-- ============================================================================
-- Reseñas reales de clientes.
-- Solo clientes con cuenta pueden calificar perfumes de pedidos ENTREGADOS
-- (compra verificada). Una reseña por cliente y perfume (se puede editar).
-- El público ve las reseñas no ocultas, sin el id del usuario.
-- Los administradores pueden ocultar o borrar reseñas.
-- ============================================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fragrance_id text not null references public.fragrances (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  longevity text check (longevity in ('poca', 'media', 'larga')),
  sillage text check (sillage in ('suave', 'moderada', 'fuerte')),
  comment text not null default '' check (char_length(comment) <= 600),
  author_name text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fragrance_id)
);
create index if not exists reviews_fragrance_idx on public.reviews (fragrance_id) where not hidden;
alter table public.reviews enable row level security;

-- Columnas visibles: todas menos user_id y order_id.
revoke all on public.reviews from anon, authenticated;
grant select (id, fragrance_id, rating, longevity, sillage, comment, author_name, hidden, created_at, updated_at)
  on public.reviews to anon, authenticated;
grant update (hidden) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

-- Dos reglas: el público ve las no ocultas; los administradores ven todas.
-- (is_admin() no se puede ejecutar como visitante, por eso va en una regla aparte.)
drop policy if exists "ver reseñas publicadas" on public.reviews;
create policy "ver reseñas publicadas" on public.reviews for select to anon, authenticated
  using (not hidden);
drop policy if exists "admin ve todas las reseñas" on public.reviews;
create policy "admin ve todas las reseñas" on public.reviews for select to authenticated
  using ((select public.is_admin()));
drop policy if exists "admin modera reseñas" on public.reviews;
create policy "admin modera reseñas" on public.reviews for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admin borra reseñas" on public.reviews;
create policy "admin borra reseñas" on public.reviews for delete to authenticated
  using ((select public.is_admin()));

-- Promedio y número de reseñas visibles por perfume.
create or replace view public.review_stats with (security_invoker = true) as
  select fragrance_id, count(*)::int as reviews, round(avg(rating)::numeric, 1) as average
    from public.reviews
   where not hidden
   group by fragrance_id;
grant select on public.review_stats to anon, authenticated;

-- Crear o editar la reseña propia (solo con un pedido entregado que incluya el perfume).
create or replace function public.upsert_review(
  p_fragrance_id text, p_rating int, p_longevity text, p_sillage text, p_comment text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order uuid;
  v_name text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'sin sesion'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'calificacion no valida'; end if;
  if p_longevity is not null and p_longevity not in ('poca', 'media', 'larga') then raise exception 'duracion no valida'; end if;
  if p_sillage is not null and p_sillage not in ('suave', 'moderada', 'fuerte') then raise exception 'estela no valida'; end if;
  if char_length(coalesce(p_comment, '')) > 600 then raise exception 'comentario largo'; end if;

  select o.id into v_order
    from orders o
   where o.user_id = v_uid
     and o.status = 'entregado'
     and o.items @> jsonb_build_array(jsonb_build_object('fragId', p_fragrance_id))
   order by o.delivered_at desc nulls last
   limit 1;
  if v_order is null then raise exception 'sin compra entregada'; end if;

  select nullif(split_part(trim(coalesce(p.name, '')), ' ', 1), '') into v_name from profiles p where p.id = v_uid;

  insert into reviews (user_id, fragrance_id, order_id, rating, longevity, sillage, comment, author_name)
  values (v_uid, p_fragrance_id, v_order, p_rating, p_longevity, p_sillage, trim(coalesce(p_comment, '')), coalesce(v_name, 'Cliente'))
  on conflict (user_id, fragrance_id) do update
    set rating = excluded.rating,
        longevity = excluded.longevity,
        sillage = excluded.sillage,
        comment = excluded.comment,
        author_name = excluded.author_name,
        updated_at = now()
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.upsert_review(text, int, text, text, text) from public, anon;
grant execute on function public.upsert_review(text, int, text, text, text) to authenticated;

-- Reseñas propias (para mostrar "ya calificado" y editar).
create or replace function public.my_reviews()
returns table (fragrance_id text, rating smallint, longevity text, sillage text, comment text, hidden boolean)
language sql
stable
security definer
set search_path = public
as $$
  select r.fragrance_id, r.rating, r.longevity, r.sillage, r.comment, r.hidden
    from reviews r
   where r.user_id = auth.uid();
$$;
revoke execute on function public.my_reviews() from public, anon;
grant execute on function public.my_reviews() to authenticated;
