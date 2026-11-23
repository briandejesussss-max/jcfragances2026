-- ============================================================================
-- Panel → Clientes → "Compraron sin cuenta".
-- Personas con pedidos que no están ligados a ninguna cuenta, agrupadas por correo.
-- has_account = ya tiene cuenta con ese correo, pero no ha agregado esos pedidos.
-- Solo administradores.
-- ============================================================================

create or replace function public.admin_list_guest_buyers(p_query text default '')
returns table (
  email text,
  name text,
  phone text,
  orders_count bigint,
  total numeric,
  last_order_number text,
  last_order_at timestamptz,
  has_account boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  return query
    with guest as (
      select lower(trim(o.customer->>'email')) as em, o.*
        from public.orders o
       where o.user_id is null
         and coalesce(trim(o.customer->>'email'), '') <> ''
    ),
    grouped as (
      select g.em,
             count(*) as n,
             sum(g.total) filter (where g.status <> 'cancelado') as spent,
             max(g.created_at) as last_at
        from guest g
       group by g.em
    )
    select gr.em,
           coalesce(l.customer->>'name', ''),
           coalesce(l.customer->>'phone', ''),
           gr.n,
           coalesce(gr.spent, 0),
           l.number,
           gr.last_at,
           exists (select 1 from auth.users u where lower(u.email) = gr.em)
      from grouped gr
      join lateral (
        select g2.customer, g2.number from guest g2 where g2.em = gr.em order by g2.created_at desc limit 1
      ) l on true
     where coalesce(trim(p_query), '') = ''
        or gr.em ilike '%' || trim(p_query) || '%'
        or l.customer->>'name' ilike '%' || trim(p_query) || '%'
        or l.customer->>'phone' ilike '%' || trim(p_query) || '%'
     order by gr.last_at desc
     limit 200;
end $$;
revoke execute on function public.admin_list_guest_buyers(text) from public, anon;
grant execute on function public.admin_list_guest_buyers(text) to authenticated;
