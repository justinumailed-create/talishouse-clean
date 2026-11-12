-- Move the protected-market page (slug market) to page 2 in stored
-- standard system Talisbooks. Pages that sat between the cover and that
-- page shift down by one. Idempotent: books whose market page is already
-- page 2 are left alone. The unique (book_id, page_number) constraint is
-- cleared by parking numbers above 1000 first.

do $$
declare
  rec record;
begin
  for rec in
    select b.id as book_id, m.page_number as market_page
    from public.talisbooks_books b
    join public.talisbooks_book_pages m
      on m.book_id = b.id
     and m.slug = 'market'
    where b.metadata->>'systemEbookFormat' = 'standard'
      and m.page_number > 2
  loop
    update public.talisbooks_book_pages
       set page_number = page_number + 1000,
           sort_order = coalesce(sort_order, page_number) + 1000
     where book_id = rec.book_id;

    update public.talisbooks_book_pages p
       set page_number = case
             when p.slug = 'market' then 2
             when p.page_number - 1000 >= 2
              and p.page_number - 1000 < rec.market_page
               then (p.page_number - 1000) + 1
             else p.page_number - 1000
           end,
           sort_order = case
             when p.slug = 'market' then 2
             when p.page_number - 1000 >= 2
              and p.page_number - 1000 < rec.market_page
               then (p.page_number - 1000) + 1
             else p.page_number - 1000
           end
     where p.book_id = rec.book_id;
  end loop;
end $$;
