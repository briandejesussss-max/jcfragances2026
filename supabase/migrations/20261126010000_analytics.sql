-- ============================================================================
-- Estadísticas propias (anónimas): visitas, perfumes vistos, agregados a la bolsa,
-- compras iniciadas, pedidos y clics a WhatsApp, con su origen (Instagram, Google…).
-- No se guardan datos personales: solo un identificador aleatorio del navegador.
-- Los visitantes solo pueden REGISTRAR eventos (con límites); solo los
-- administradores pueden leer el resumen.
-- ============================================================================

create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor text not null check (char_length(visitor) between 8 and 64),
  type text not null check (type in ('page_view', 'product_view', 'add_to_cart', 'checkout_start', 'order_placed', 'whatsapp_click')),
  fragrance_id text check (char_length(fragrance_id) <= 80),
  path text check (char_length(path) <= 200),
  source text check (char_length(source) <= 30)
);
create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_type_created_idx on public.events (type, created_at);
create index if not exists events_visitor_created_idx on public.events (visitor, created_at);
alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;

-- Registrar un evento. Ignora silenciosamente lo que no cumple (para no romper la tienda).
create or replace function public.track_event(p_visitor text, p_type text, p_fragrance_id text, p_path text, p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or char_length(p_visitor) not between 8 and 64 then return; end if;
  if p_type not in ('page_view', 'product_view', 'add_to_cart', 'checkout_start', 'order_placed', 'whatsapp_click') then return; end if;
  -- Límite por navegador: 400 eventos al día.
  if (select count(*) from events e where e.visitor = p_visitor and e.created_at > now() - interval '1 day') >= 400 then return; end if;
  insert into events (visitor, type, fragrance_id, path, source)
  values (
    p_visitor,
    p_type,
    nullif(left(coalesce(p_fragrance_id, ''), 80), ''),
    nullif(left(coalesce(p_path, ''), 200), ''),
    nullif(left(lower(coalesce(p_source, '')), 30), '')
  );
end $$;
revoke execute on function public.track_event(text, text, text, text, text) from public;
grant execute on function public.track_event(text, text, text, text, text) to anon, authenticated;

-- Resumen para el panel (zona horaria de México).
create or replace function public.admin_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_days int := greatest(1, least(coalesce(p_days, 30), 365));
  v_from timestamptz := date_trunc('day', now() at time zone 'America/Mexico_City') at time zone 'America/Mexico_City' - make_interval(days => v_days - 1);
  v jsonb;
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;

  with ev as (select * from events where created_at >= v_from),
  ord as (select * from orders where created_at >= v_from and status <> 'cancelado'),
  days as (
    select generate_series((v_from at time zone 'America/Mexico_City')::date, (now() at time zone 'America/Mexico_City')::date, interval '1 day')::date as d
  ),
  sold as (
    select i->>'fragId' as fragrance_id, sum((i->>'qty')::int) as units
      from ord, jsonb_array_elements(ord.items) i
     group by 1
  ),
  per_frag as (
    select fragrance_id,
           count(*) filter (where type = 'product_view') as views,
           count(distinct visitor) filter (where type = 'product_view') as viewers,
           count(*) filter (where type = 'add_to_cart') as adds
      from ev where fragrance_id is not null group by fragrance_id
  )
  select jsonb_build_object(
    'days', v_days,
    'totals', jsonb_build_object(
      'visitors', (select count(distinct visitor) from ev),
      'page_views', (select count(*) from ev where type = 'page_view'),
      'product_views', (select count(*) from ev where type = 'product_view'),
      'add_to_cart', (select count(*) from ev where type = 'add_to_cart'),
      'whatsapp_clicks', (select count(*) from ev where type = 'whatsapp_click'),
      'orders', (select count(*) from ord),
      'paid_orders', (select count(*) from ord where status not in ('pendiente_pago')),
      'revenue', (select coalesce(sum(total), 0) from ord where status not in ('pendiente_pago'))
    ),
    'funnel', jsonb_build_object(
      'visitors', (select count(distinct visitor) from ev),
      'viewed_product', (select count(distinct visitor) from ev where type = 'product_view'),
      'added_to_cart', (select count(distinct visitor) from ev where type = 'add_to_cart'),
      'started_checkout', (select count(distinct visitor) from ev where type = 'checkout_start'),
      'ordered', (select count(distinct visitor) from ev where type = 'order_placed')
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'day', d,
               'visitors', (select count(distinct visitor) from ev where (ev.created_at at time zone 'America/Mexico_City')::date = d),
               'orders', (select count(*) from ord where (ord.created_at at time zone 'America/Mexico_City')::date = d)
             ) order by d), '[]'::jsonb)
        from days
    ),
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('source', s, 'visitors', n) order by n desc), '[]'::jsonb)
        from (select coalesce(source, 'directo') as s, count(distinct visitor) as n from ev where type = 'page_view' group by 1) x
    ),
    'fragrances', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', f.id,
               'name', f.data->>'name',
               'brand', f.data->>'brand',
               'views', coalesce(p.views, 0),
               'viewers', coalesce(p.viewers, 0),
               'adds', coalesce(p.adds, 0),
               'sold', coalesce(s.units, 0)
             ) order by coalesce(p.views, 0) desc, coalesce(s.units, 0) desc), '[]'::jsonb)
        from fragrances f
        left join per_frag p on p.fragrance_id = f.id
        left join sold s on s.fragrance_id = f.id
    )
  ) into v;
  return v;
end $$;
revoke execute on function public.admin_stats(int) from public, anon;
grant execute on function public.admin_stats(int) to authenticated;
