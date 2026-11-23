-- ============================================================================
-- Panel → Clientes: lista de cuentas de cliente y contraseña temporal.
--
-- Sin dominio propio no hay correos de recuperación, así que el propietario
-- (o cualquier administrador) puede ponerle una contraseña temporal a un
-- cliente que la olvidó. Solo administradores; nunca sobre cuentas de admin.
-- ============================================================================

-- Lista de clientes (cuentas que no son administradoras), con búsqueda.
create or replace function public.admin_list_customers(p_query text default '')
returns table (
  id uuid,
  email text,
  name text,
  phone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  orders_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  return query
    select u.id, u.email::text, coalesce(p.name, ''), coalesce(p.phone, ''), u.created_at, u.last_sign_in_at,
           (select count(*) from public.orders o where o.user_id = u.id)
      from auth.users u
      left join public.profiles p on p.id = u.id
     where not exists (select 1 from public.admins a where a.user_id = u.id)
       and (coalesce(trim(p_query), '') = ''
            or u.email ilike '%' || trim(p_query) || '%'
            or p.name ilike '%' || trim(p_query) || '%'
            or p.phone ilike '%' || trim(p_query) || '%')
     order by u.created_at desc
     limit 100;
end $$;
revoke execute on function public.admin_list_customers(text) from public, anon;
grant execute on function public.admin_list_customers(text) to authenticated;

-- Contraseña temporal para un cliente. Cierra sus sesiones abiertas.
create or replace function public.admin_set_customer_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'contraseña corta'; end if;
  if exists (select 1 from public.admins a where a.user_id = p_user_id) then raise exception 'es administrador'; end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_user_id;
  if not found then raise exception 'no encontrado'; end if;

  delete from auth.sessions where user_id = p_user_id;
end $$;
revoke execute on function public.admin_set_customer_password(uuid, text) from public, anon;
grant execute on function public.admin_set_customer_password(uuid, text) to authenticated;
