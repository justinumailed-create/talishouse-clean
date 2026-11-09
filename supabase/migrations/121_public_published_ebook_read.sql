-- The published-book policies already allow public reads. Anon never received
-- SELECT, so a preview without the service role could not open a FAST Code's
-- own eBook. Pages are limited to those published public books.

grant select on table public.talisbooks_books to anon, authenticated;
grant select on table public.talisbooks_book_pages to anon, authenticated;

drop policy if exists "Public can view talisbooks book pages" on public.talisbooks_book_pages;
create policy "Public can view talisbooks book pages"
  on public.talisbooks_book_pages
  for select
  to public
  using (
    exists (
      select 1
      from public.talisbooks_books b
      where b.id = talisbooks_book_pages.book_id
        and b.is_public = true
        and b.publish_status = 'published'
    )
  );
