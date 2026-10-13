-- 102: Private bucket for chat attachments. No storage policies: the server
-- issues signed upload URLs after a membership check and signed read URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('agent-chat-files', 'agent-chat-files', false, 10485760, array[
  'image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','text/csv',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
