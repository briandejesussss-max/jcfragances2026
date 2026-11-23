-- ============================================================================
-- Ligar pedidos anteriores sin confirmación de correo.
--
-- Sin dominio propio la tienda no envía correos de confirmación, así que
-- "tener una cuenta con ese correo" ya no prueba que el correo sea tuyo.
-- Se elimina el ligado automático por correo (claim_my_orders) y se reemplaza
-- por claim_order: el cliente liga un pedido escribiendo su número Y el correo
-- con el que compró (los mismos datos que pide el rastreo público).
-- ============================================================================

drop function if exists public.claim_my_orders();

create or replace function public.claim_order(p_number text, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_owner uuid;
  v_number text;
begin
  if v_uid is null then raise exception 'sin sesion'; end if;

  select id, user_id, number into v_id, v_owner, v_number
    from orders
   where upper(number) = upper(trim(p_number))
     and lower(customer->>'email') = lower(trim(p_email));

  if v_id is null then raise exception 'no encontrado'; end if;
  if v_owner is not null and v_owner <> v_uid then raise exception 'ya ligado'; end if;

  update orders set user_id = v_uid where id = v_id;
  return v_number;
end $$;
revoke execute on function public.claim_order(text, text) from public, anon;
grant execute on function public.claim_order(text, text) to authenticated;
