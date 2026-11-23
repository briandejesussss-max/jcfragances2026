-- ============================================================================
-- Endurecimiento de seguridad (aplicada en producción el 23-nov-2026)
--
-- 1. Solo los usuarios de la tabla `admins` pueden escribir en el catálogo,
--    pedidos y finanzas. Hoy las políticas permiten todo a CUALQUIER usuario
--    autenticado: si el registro de usuarios está abierto, cualquiera que cree
--    una cuenta obtiene acceso de administrador.
-- 2. `create_order` recalcula el subtotal con los precios guardados en la base
--    de datos en lugar de confiar en el total enviado por el navegador.
-- 3. `orders_to_income` (función de trigger) deja de ser invocable por la API.
-- ============================================================================

-- 1. Lista de administradores ------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

-- Da de alta a los usuarios que existen hoy (la cuenta del propietario).
insert into public.admins (user_id) select id from auth.users on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admin ve admins" on public.admins;
create policy "admin ve admins" on public.admins for select to authenticated using ((select public.is_admin()));

drop policy if exists "admin fragancias" on public.fragrances;
create policy "admin fragancias" on public.fragrances for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin config" on public.store_config;
create policy "admin config" on public.store_config for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin pedidos" on public.orders;
create policy "admin pedidos" on public.orders for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin movimientos" on public.movements;
create policy "admin movimientos" on public.movements for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin ajustes" on public.app_settings;
create policy "admin ajustes" on public.app_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and (select public.is_admin()));
drop policy if exists "admin edita fotos" on storage.objects;
create policy "admin edita fotos" on storage.objects for update to authenticated using (bucket_id = 'fotos' and (select public.is_admin()));
drop policy if exists "admin borra fotos" on storage.objects;
create policy "admin borra fotos" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and (select public.is_admin()));

-- 2. Total del pedido calculado en la base de datos --------------------------
-- Mantiene la misma firma (compatible con la app actual). El precio de cada
-- renglón se toma de fragrances.data->'prices'->size->'price'; el total enviado
-- por el cliente se ignora. El envío nunca puede ser menor al envío base.
create or replace function public.create_order(p_customer jsonb, p_items jsonb, p_total numeric, p_shipping numeric default 0)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
  v_items jsonb := '[]'::jsonb;
  v_sub numeric := 0;
  v_ship numeric := greatest(coalesce(p_shipping, 0), 180);
  it jsonb;
  v_price numeric;
  v_qty int;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'sin productos'; end if;
  if jsonb_array_length(p_items) > 60 then raise exception 'demasiados productos'; end if;
  if coalesce(p_customer->>'email', '') = '' then raise exception 'falta correo'; end if;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'cantidad no válida'; end if;
    select (f.data->'prices'->(it->>'size')->>'price')::numeric into v_price
      from fragrances f where f.id = it->>'fragId';
    if v_price is null or v_price <= 0 then raise exception 'producto no disponible: %', it->>'fragId'; end if;
    v_sub := v_sub + v_price * v_qty;
    v_items := v_items || jsonb_set(it, '{price}', to_jsonb(v_price));
  end loop;

  insert into orders(customer, items, total, shipping)
  values (p_customer, v_items, v_sub + v_ship, v_ship)
  returning number into n;
  return n;
end $$;

-- 3. La función del trigger no debe llamarse desde la API ---------------------
revoke execute on function public.orders_to_income() from public, anon, authenticated;
