-- After the 80 km inside-cover spread (migration 124), place the
-- protected-market page on the next page. Cover stays page 1, the map
-- spread stays the next two pages, and every later page keeps its order.
-- Books that already have that page in place are left alone.

do $$
declare
  b record;
  left_id uuid;
  right_id uuid;
  market_id uuid;
  left_page int;
  right_page int;
  ord int;
  rec record;
begin
  for b in
    select id
    from public.talisbooks_books
    where coalesce(metadata->>'systemEbookFormat', '') = 'standard'
  loop
    select p.id, p.page_number into left_id, left_page
    from public.talisbooks_book_pages p
    where p.book_id = b.id and p.slug = 'market-left'
    order by p.page_number
    limit 1;

    if left_id is null then
      continue;
    end if;

    select p.id, p.page_number into right_id, right_page
    from public.talisbooks_book_pages p
    where p.book_id = b.id
      and p.id <> left_id
      and p.slug in ('market-right', 'area-map')
      and p.page_number > left_page
    order by case when p.slug = 'market-right' then 0 else 1 end, p.page_number
    limit 1;

    if right_id is null then
      right_page := left_page;
    end if;

    select p.id into market_id
    from public.talisbooks_book_pages p
    where p.book_id = b.id and p.slug = 'market'
    limit 1;

    if market_id is not null and exists (
      select 1
      from public.talisbooks_book_pages
      where id = market_id and page_number = right_page + 1
    ) then
      continue;
    end if;

    if market_id is null then
      insert into public.talisbooks_book_pages (
        book_id, layout_id, template_id, title, slug, page_number, sort_order,
        content, background_image_id, is_visible, settings
      )
      select
        book_id, layout_id, template_id, title, 'market',
        400000, 400000,
        content, background_image_id, is_visible, settings
      from public.talisbooks_book_pages
      where id = left_id
      returning id into market_id;
    end if;

    update public.talisbooks_book_pages
    set page_number = page_number + 300000,
        sort_order = coalesce(sort_order, page_number) + 300000
    where book_id = b.id
      and page_number < 300000;

    update public.talisbooks_book_pages
    set page_number = 1, sort_order = 1, updated_at = now()
    where book_id = b.id
      and slug in ('front-cover', 'pdf-front-cover');

    update public.talisbooks_book_pages
    set page_number = 2, sort_order = 2, updated_at = now()
    where id = left_id;

    if right_id is not null then
      update public.talisbooks_book_pages
      set page_number = 3, sort_order = 3, updated_at = now()
      where id = right_id;
    end if;

    update public.talisbooks_book_pages
    set page_number = right_page - left_page + 3,
        sort_order = right_page - left_page + 3,
        updated_at = now()
    where id = market_id;

    ord := right_page - left_page + 4;
    for rec in
      select id
      from public.talisbooks_book_pages
      where book_id = b.id
        and page_number >= 300000
      order by page_number
    loop
      update public.talisbooks_book_pages
      set page_number = ord, sort_order = ord, updated_at = now()
      where id = rec.id;
      ord := ord + 1;
    end loop;
  end loop;
end $$;
