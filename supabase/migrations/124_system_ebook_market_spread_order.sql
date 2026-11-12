-- Move the 80 km market map to the inside cover of stored system Talisbooks.
-- Front cover stays page 1. The next two pages are the map spread.
-- Other pages keep their relative order. Nothing is deleted.
-- Books that already open on that spread are renumbered to the same order.

do $$
declare
  b record;
  cover_id uuid;
  left_id uuid;
  right_id uuid;
  ord int;
  rec record;
begin
  for b in
    select id
    from public.talisbooks_books
    where coalesce(metadata->>'systemEbookFormat', '') = 'standard'
       or exists (
         select 1
         from public.talisbooks_book_pages p
         where p.book_id = talisbooks_books.id
           and p.slug in ('market', 'area-map', 'market-left', 'market-right')
       )
  loop
    select p.id into cover_id
    from public.talisbooks_book_pages p
    where p.book_id = b.id
      and p.slug not in ('back-cover', 'pdf-back-cover')
      and (
        p.slug in ('front-cover', 'pdf-front-cover')
        or coalesce(p.content->>'pageRole', '') = 'cover'
      )
    order by case when p.slug in ('front-cover', 'pdf-front-cover') then 0 else 1 end,
             p.page_number
    limit 1;

    if cover_id is null then
      continue;
    end if;

    select p.id into left_id
    from public.talisbooks_book_pages p
    where p.book_id = b.id
      and p.id <> cover_id
      and (
        p.slug in ('market', 'market-left', 'area-map')
        or (
          coalesce(p.content->>'layout', '') = 'maps'
          and coalesce(p.content->>'body', '') ilike '%80 km%'
        )
      )
    order by case
               when p.slug = 'market-left' then 0
               when p.slug = 'market' then 1
               when p.slug = 'area-map' then 2
               else 3
             end,
             p.page_number
    limit 1;

    if left_id is null then
      continue;
    end if;

    select p.id into right_id
    from public.talisbooks_book_pages p
    where p.book_id = b.id
      and p.id not in (cover_id, left_id)
      and (
        p.slug in ('market-right', 'area-map', 'market')
        or (
          coalesce(p.content->>'layout', '') = 'maps'
          and coalesce(p.content->>'body', '') ilike '%80 km%'
        )
      )
    order by case when p.slug = 'market-right' then 0 else 1 end, p.page_number
    limit 1;

    if right_id is null then
      insert into public.talisbooks_book_pages (
        book_id, layout_id, template_id, title, slug, page_number, sort_order,
        content, background_image_id, is_visible, settings
      )
      select
        book_id, layout_id, template_id, title, 'market-right',
        page_number + 100000, sort_order + 100000,
        content, background_image_id, is_visible, settings
      from public.talisbooks_book_pages
      where id = left_id
      returning id into right_id;
    end if;

    update public.talisbooks_book_pages
    set slug = 'market-left'
    where id = left_id and slug = 'market';

    update public.talisbooks_book_pages
    set page_number = page_number + 200000,
        sort_order = sort_order + 200000
    where book_id = b.id;

    update public.talisbooks_book_pages
    set page_number = 1, sort_order = 1, updated_at = now()
    where id = cover_id;

    update public.talisbooks_book_pages
    set page_number = 2, sort_order = 2, updated_at = now()
    where id = left_id;

    update public.talisbooks_book_pages
    set page_number = 3, sort_order = 3, updated_at = now()
    where id = right_id;

    ord := 4;
    for rec in
      select id
      from public.talisbooks_book_pages
      where book_id = b.id
        and id not in (cover_id, left_id, right_id)
      order by page_number
    loop
      update public.talisbooks_book_pages
      set page_number = ord, sort_order = ord, updated_at = now()
      where id = rec.id;
      ord := ord + 1;
    end loop;
  end loop;
end $$;
