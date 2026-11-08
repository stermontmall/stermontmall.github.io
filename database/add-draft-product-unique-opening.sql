-- Applied directly to Supabase project oewvtbnmyombbtggamor.
-- Enforces 600-900 words, rejects exact duplicate first-200-word openings across all
-- products and drafts, and preserves the "Price in Kenya" suffix within 60 characters.
create or replace function public.add_draft_product(
  p_name text, p_price numeric, p_category_id bigint, p_unit text, p_description text, p_source_url text
)
returns text language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_name text := btrim(regexp_replace(p_name, '[[:space:]]+', ' ', 'g'));
  v_desc text := btrim(regexp_replace(p_description, '[[:space:]]+', ' ', 'g'));
  v_words int := coalesce(array_length(regexp_split_to_array(v_desc, '[[:space:]]+'), 1), 0);
  v_opening text;
  v_id text;
  v_title text;
  v_source_cost numeric(12,2);
  v_selling_price numeric(12,2);
begin
  if char_length(v_name) < 3 or char_length(v_name) > 90 then raise exception 'name must be 3-90 characters'; end if;
  if p_price is null or p_price <= 0 then raise exception 'p_price must be the exact source KES cost'; end if;
  if p_source_url is null or p_source_url !~ '^https://[^/]+\.[^/]+' then raise exception 'p_source_url must be the https product page the source price came from'; end if;
  if not exists (select 1 from categories where id = p_category_id) then raise exception 'unknown category_id; select id,name from categories'; end if;
  if v_words < 600 or v_words > 900 then raise exception 'description must be 600-900 words (got %)', v_words; end if;
  v_opening := array_to_string((regexp_split_to_array(lower(v_desc), '[[:space:]]+'))[1:200], ' ');
  if exists (
    select 1 from products p
    where array_to_string(
      (regexp_split_to_array(lower(btrim(regexp_replace(coalesce(p.description, ''), '[[:space:]]+', ' ', 'g'))), '[[:space:]]+'))[1:200],
      ' '
    ) = v_opening
  ) then
    raise exception 'the first 200 words duplicate an existing product; rewrite the opening with verified SKU-specific facts';
  end if;
  if exists (select 1 from products where lower(name) = lower(v_name)) then raise exception 'a product with this name already exists'; end if;
  v_source_cost := round(p_price, 2);
  v_selling_price := round(v_source_cost, 2);
  v_selling_price := round(v_source_cost * 1.15, 2);
  v_id := btrim(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), '-');
  v_id := left(v_id, 70);
  if v_id = '' then v_id := 'product'; end if;
  if exists (select 1 from products where id = v_id) then v_id := v_id || '-' || substr(md5(random()::text), 1, 5); end if;
  v_title := case
    when char_length(v_name || ' – Price in Kenya') <= 60 then v_name || ' – Price in Kenya'
    else regexp_replace(left(v_name, 60 - char_length(' – Price in Kenya')), '[[:space:]]+[^[:space:]]*$', '') || ' – Price in Kenya'
  end;
  insert into products (id, slug, name, seo_name, seo_title, description, price, cost, old_price, unit, category_id, images, active, stock, low_at, featured)
  values (v_id, v_id, v_name, v_name, v_title, v_desc, v_selling_price, v_source_cost, null, coalesce(nullif(btrim(p_unit), ''), 'piece'), p_category_id, '{}', false, 1000, 20, false);
  return v_id;
end
$function$;
