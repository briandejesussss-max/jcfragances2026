-- ============================================================================
-- Reseñas abiertas: cualquiera puede opinar (con o sin cuenta, con o sin compra).
--  * verified = true  → tiene un pedido entregado con ese perfume ("Compra verificada").
--    Se publica de inmediato.
--  * verified = false → "Opinión". Queda pendiente (pending) hasta que un
--    administrador la apruebe en el panel.
-- Protección: sin links en el texto, 1 reseña por perfume y navegador/cuenta,
-- máximo 5 al día por navegador y un tope global de pendientes por hora.
-- ============================================================================

alter table public.reviews alter column user_id drop not null;
alter table public.reviews add column if not exists visitor text check (visitor is null or char_length(visitor) between 8 and 64);
alter table public.reviews add column if not exists verified boolean not null default false;
alter table public.reviews add column if not exists pending boolean not null default false;

-- Las reseñas que ya existían venían de compras entregadas.
update public.reviews set verified = true where user_id is not null and order_id is not null;

create unique index if not exists reviews_visitor_fragrance_uniq on public.reviews (visitor, fragrance_id) where user_id is null;
drop index if exists public.reviews_fragrance_idx;
create index if not exists reviews_fragrance_idx on public.reviews (fragrance_id) where not hidden and not pending;
create index if not exists reviews_pending_idx on public.reviews (created_at) where pending;

-- Columnas visibles: se agregan verified y pending (visitor y user_id siguen ocultos).
grant select (verified, pending) on public.reviews to anon, authenticated;
grant update (hidden, pending) on public.reviews to authenticated;

drop policy if exists "ver reseñas publicadas" on public.reviews;
create policy "ver reseñas publicadas" on public.reviews for select to anon, authenticated
  using (not hidden and not pending);

create or replace view public.review_stats with (security_invoker = true) as
  select fragrance_id, count(*)::int as reviews, round(avg(rating)::numeric, 1) as average
    from public.reviews
   where not hidden and not pending
   group by fragrance_id;
grant select on public.review_stats to anon, authenticated;

-- Enviar una reseña (visitantes y clientes).
create or replace function public.submit_review(
  p_fragrance_id text, p_rating int, p_longevity text, p_sillage text, p_comment text, p_name text, p_visitor text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order uuid;
  v_name text;
  v_comment text := trim(coalesce(p_comment, ''));
  v_verified boolean;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'calificacion no valida'; end if;
  if p_longevity is not null and p_longevity not in ('poca', 'media', 'larga') then raise exception 'duracion no valida'; end if;
  if p_sillage is not null and p_sillage not in ('suave', 'moderada', 'fuerte') then raise exception 'estela no valida'; end if;
  if char_length(v_comment) > 600 then raise exception 'comentario largo'; end if;
  if v_comment ~* '(https?://|www\.|\.(com|net|org|mx|io|ly|me|xyz|shop)(/|\s|$))' then raise exception 'sin links'; end if;
  if not exists (select 1 from fragrances f where f.id = p_fragrance_id) then raise exception 'perfume no existe'; end if;

  -- Nombre: el escrito, o el del perfil; solo el nombre de pila.
  v_name := nullif(split_part(trim(coalesce(p_name, '')), ' ', 1), '');
  if v_name is null and v_uid is not null then
    select nullif(split_part(trim(coalesce(p.name, '')), ' ', 1), '') into v_name from profiles p where p.id = v_uid;
  end if;
  if v_name is null or char_length(v_name) < 2 then raise exception 'falta nombre'; end if;
  v_name := left(v_name, 30);
  if v_name ~* '(https?://|www\.|\.com)' then raise exception 'sin links'; end if;

  if v_uid is not null then
    select o.id into v_order
      from orders o
     where o.user_id = v_uid
       and o.status = 'entregado'
       and o.items @> jsonb_build_array(jsonb_build_object('fragId', p_fragrance_id))
     order by o.delivered_at desc nulls last
     limit 1;
    v_verified := v_order is not null;

    if not v_verified and (select count(*) from reviews r where r.user_id = v_uid and r.created_at > now() - interval '1 day') >= 5 then
      raise exception 'limite diario';
    end if;

    insert into reviews (user_id, fragrance_id, order_id, rating, longevity, sillage, comment, author_name, verified, pending)
    values (v_uid, p_fragrance_id, v_order, p_rating, p_longevity, p_sillage, v_comment, v_name, v_verified, not v_verified)
    on conflict (user_id, fragrance_id) do update
      set rating = excluded.rating,
          longevity = excluded.longevity,
          sillage = excluded.sillage,
          comment = excluded.comment,
          author_name = excluded.author_name,
          order_id = coalesce(excluded.order_id, reviews.order_id),
          verified = excluded.verified or reviews.verified,
          pending = not (excluded.verified or reviews.verified),
          updated_at = now();
    v_verified := v_verified or exists (select 1 from reviews r where r.user_id = v_uid and r.fragrance_id = p_fragrance_id and r.verified);
  else
    if p_visitor is null or char_length(p_visitor) not between 8 and 64 then raise exception 'sin visitante'; end if;
    if (select count(*) from reviews r where r.visitor = p_visitor and r.created_at > now() - interval '1 day') >= 5 then
      raise exception 'limite diario';
    end if;
    if (select count(*) from reviews r where r.pending and r.user_id is null and r.created_at > now() - interval '1 hour') >= 30 then
      raise exception 'limite diario';
    end if;
    v_verified := false;

    insert into reviews (user_id, visitor, fragrance_id, rating, longevity, sillage, comment, author_name, verified, pending)
    values (null, p_visitor, p_fragrance_id, p_rating, p_longevity, p_sillage, v_comment, v_name, false, true)
    on conflict (visitor, fragrance_id) where user_id is null do update
      set rating = excluded.rating,
          longevity = excluded.longevity,
          sillage = excluded.sillage,
          comment = excluded.comment,
          author_name = excluded.author_name,
          pending = true,
          updated_at = now();
  end if;

  return jsonb_build_object('verified', v_verified, 'pending', not v_verified);
end $$;
revoke execute on function public.submit_review(text, int, text, text, text, text, text) from public;
grant execute on function public.submit_review(text, int, text, text, text, text, text) to anon, authenticated;

-- Reseñas propias: ahora también dice si está pendiente o verificada.
drop function if exists public.my_reviews();
create function public.my_reviews()
returns table (fragrance_id text, rating smallint, longevity text, sillage text, comment text, hidden boolean, pending boolean, verified boolean)
language sql
stable
security definer
set search_path = public
as $$
  select r.fragrance_id, r.rating, r.longevity, r.sillage, r.comment, r.hidden, r.pending, r.verified
    from reviews r
   where r.user_id = auth.uid();
$$;
revoke execute on function public.my_reviews() from public, anon;
grant execute on function public.my_reviews() to authenticated;
