-- Códigos de descuento y envío gratis calculados en la base de datos.
--
-- Por qué aquí y no en el navegador ni en el servidor web: `create_order` se puede llamar
-- directamente con la llave pública, así que el descuento y el envío gratis se calculan
-- dentro de la función con datos que solo el propietario puede editar. Nadie puede
-- mandarse un descuento inventado.
--
-- * Tabla `coupons`: solo el propietario la ve y la edita (la configuración de la tienda es
--   pública, por eso los códigos no viven ahí).
-- * `coupon_quote(code, items)`: el cliente pregunta cuánto le descuenta un código.
-- * `create_order(..., p_coupon)`: aplica el código y el envío gratis al guardar el pedido.

create table if not exists public.coupons (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,20}$'),
  kind text not null check (kind in ('percent', 'amount')),
  value numeric not null check (value > 0),
  applies_to text not null default 'all' check (applies_to in ('all', 'decants', 'bottles')),
  min_subtotal numeric not null default 0 check (min_subtotal >= 0),
  ends_at date,
  max_uses int check (max_uses is null or max_uses > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint coupon_percent_max check (kind <> 'percent' or value <= 100)
);

alter table public.coupons enable row level security;
drop policy if exists "admin cupones" on public.coupons;
create policy "admin cupones" on public.coupons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter table public.orders add column if not exists coupon text;
create index if not exists orders_coupon_idx on public.orders (coupon) where coupon is not null;

-- Cuánto descuenta un código para estos productos (precios tomados de la base).
-- Devuelve { ok, code, discount, subtotal, message }.
create or replace function public.coupon_quote(p_code text, p_items jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.coupons;
  v_code text := upper(trim(coalesce(p_code, '')));
  it jsonb;
  v_price numeric;
  v_qty int;
  v_sub numeric := 0;
  v_eligible numeric := 0;
  v_is_bottle boolean;
  v_used int;
  v_disc numeric;
  v_today date := (now() at time zone 'America/Mexico_City')::date;
begin
  if v_code = '' then return jsonb_build_object('ok', false, 'message', 'Escribe tu código'); end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 60 then
    return jsonb_build_object('ok', false, 'message', 'Agrega productos a tu bolsa');
  end if;

  select * into c from public.coupons where code = v_code;
  if not found or not c.active then return jsonb_build_object('ok', false, 'message', 'Ese código no existe o ya no está activo'); end if;
  if c.ends_at is not null and c.ends_at < v_today then return jsonb_build_object('ok', false, 'message', 'Ese código ya venció'); end if;
  if c.max_uses is not null then
    select count(*) into v_used from public.orders where coupon = c.code and status <> 'cancelado';
    if v_used >= c.max_uses then return jsonb_build_object('ok', false, 'message', 'Ese código ya se agotó'); end if;
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(least(coalesce((it->>'qty')::int, 0), 50), 0);
    select (f.data->'prices'->(it->>'size')->>'price')::numeric into v_price from public.fragrances f where f.id = it->>'fragId';
    if v_price is null or v_price <= 0 or v_qty = 0 then continue; end if;
    v_sub := v_sub + v_price * v_qty;
    v_is_bottle := (it->>'size') = 'bottle';
    if c.applies_to = 'all' or (c.applies_to = 'bottles' and v_is_bottle) or (c.applies_to = 'decants' and not v_is_bottle) then
      v_eligible := v_eligible + v_price * v_qty;
    end if;
  end loop;

  if v_sub < c.min_subtotal then
    return jsonb_build_object('ok', false, 'message', 'Este código aplica en compras desde $' || to_char(c.min_subtotal, 'FM999G999'));
  end if;
  if v_eligible <= 0 then
    return jsonb_build_object('ok', false, 'message', case c.applies_to when 'decants' then 'Este código solo aplica en decants' else 'Este código solo aplica en botellas' end);
  end if;

  v_disc := case when c.kind = 'percent' then round(v_eligible * c.value / 100) else least(c.value, v_eligible) end;
  return jsonb_build_object(
    'ok', true,
    'code', c.code,
    'discount', v_disc,
    'subtotal', v_sub,
    'message', case when c.kind = 'percent' then c.value::text || '% de descuento' else '$' || to_char(c.value, 'FM999G999') || ' de descuento' end
      || case c.applies_to when 'decants' then ' en decants' when 'bottles' then ' en botellas' else '' end
  );
end $$;

revoke all on function public.coupon_quote(text, jsonb) from public;
grant execute on function public.coupon_quote(text, jsonb) to anon, authenticated;

-- Pedido nuevo: misma validación de antes + código de descuento + envío gratis desde el monto
-- configurado por el propietario (sobre lo que paga en productos, ya con descuento).
drop function if exists public.create_order(jsonb, jsonb, numeric, numeric);
create or replace function public.create_order(p_customer jsonb, p_items jsonb, p_total numeric, p_shipping numeric default 0, p_coupon text default null)
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
  v_free numeric;
  v_disc numeric := 0;
  v_code text := null;
  v_quote jsonb;
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

  if coalesce(trim(p_coupon), '') <> '' then
    v_quote := public.coupon_quote(p_coupon, p_items);
    if not coalesce((v_quote->>'ok')::boolean, false) then raise exception 'cupón: %', v_quote->>'message'; end if;
    v_disc := least((v_quote->>'discount')::numeric, v_sub);
    v_code := v_quote->>'code';
  end if;

  select nullif((data->>'freeShippingFrom')::numeric, 0) into v_free from store_config where id = 1;
  if v_free is not null and v_sub - v_disc >= v_free then v_ship := 0; end if;

  insert into orders(customer, items, total, shipping, discount, coupon, user_id)
  values (p_customer, v_items, v_sub - v_disc + v_ship, v_ship, v_disc, v_code, auth.uid())
  returning number into n;
  return n;
end $$;

revoke all on function public.create_order(jsonb, jsonb, numeric, numeric, text) from public;
grant execute on function public.create_order(jsonb, jsonb, numeric, numeric, text) to anon, authenticated;

-- Usos de cada código (para el panel)
create or replace function public.coupon_uses()
returns table (code text, uses bigint)
language sql
stable
security definer
set search_path = public
as $$
  select o.coupon, count(*) from public.orders o
  where o.coupon is not null and o.status <> 'cancelado' and (select public.is_admin())
  group by o.coupon;
$$;
revoke all on function public.coupon_uses() from public, anon;
grant execute on function public.coupon_uses() to authenticated;
