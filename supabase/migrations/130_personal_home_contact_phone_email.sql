-- Optional phone and email on a Mapsite personal home page.
-- Empty means the page shows no phone or email under the contact name.
-- Combined contact_name values that already include a phone and/or email
-- are split into the new columns so no information is lost.

alter table public.mapsite_personal_home
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

update public.mapsite_personal_home
set
  contact_email = nullif(
    trim(substring(contact_name from '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')),
    ''
  ),
  contact_phone = nullif(
    trim(substring(contact_name from '\+?1?[[:space:].-]*\(?[0-9]{3}\)?[[:space:].-]*[0-9]{3}[[:space:].-]*[0-9]{4}')),
    ''
  ),
  contact_name = nullif(
    trim(both ' ,-–' from regexp_replace(
      regexp_replace(
        regexp_replace(
          contact_name,
          '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
          '',
          'g'
        ),
        '\m(EM|E-?MAIL|EMAIL)\M[[:space:]]*[:\-–]?',
        '',
        'gi'
      ),
      '\+?1?[[:space:].-]*\(?[0-9]{3}\)?[[:space:].-]*[0-9]{3}[[:space:].-]*[0-9]{4}',
      '',
      'g'
    )),
    ''
  )
where contact_name is not null
  and (
    contact_name ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
    or contact_name ~ '\+?1?[[:space:].-]*\(?[0-9]{3}\)?[[:space:].-]*[0-9]{3}[[:space:].-]*[0-9]{4}'
  )
  and contact_phone is null
  and contact_email is null;
