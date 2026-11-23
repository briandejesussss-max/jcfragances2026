-- ============================================================================
-- Cuentas de cliente: perfil, pedidos ligados a la cuenta y avisos por correo.
-- Requiere 20261123000000_harden_security.sql (tabla admins / is_admin()).
-- El propietario sigue igual: los clientes solo leen SUS pedidos y editan SU perfil.
-- ============================================================================

-- 1. Perfil del cliente ------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  address jsonb not null default '{}'::jsonb,
  notify_email boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "cliente ve su perfil" on public.profiles;
create policy "cliente ve su perfil" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "cliente crea su perfil" on public.profiles;
create policy "cliente crea su perfil" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists "cliente edita su perfil" on public.profiles;
create policy "cliente edita su perfil" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Perfil automático al crear la cuenta (nombre y preferencia de avisos del registro).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, notify_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'notify_email')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Pedidos ligados a la cuenta ----------------------------------------------
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_customer_email_idx on public.orders (lower(customer->>'email'));

drop policy if exists "cliente ve sus pedidos" on public.orders;
create policy "cliente ve sus pedidos" on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

-- create_order: igual que en harden_security, y además guarda la cuenta que compra (null si no hay sesión).
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

  insert into orders(customer, items, total, shipping, user_id)
  values (p_customer, v_items, v_sub + v_ship, v_ship, auth.uid())
  returning number into n;
  return n;
end $$;

-- 3. Ligar pedidos anteriores por correo (solo con correo confirmado) ---------
create or replace function public.claim_my_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_count integer;
begin
  select lower(email) into v_email from auth.users
   where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then return 0; end if;
  update orders set user_id = auth.uid()
   where user_id is null and lower(customer->>'email') = v_email;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke execute on function public.claim_my_orders() from public, anon;
grant execute on function public.claim_my_orders() to authenticated;
