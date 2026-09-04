-- Optional sample rows, so the pages have something to render.
-- Run after schema.sql; safe to skip and safe to delete later.

insert into public.notifications (title, body, is_read, created_at) values
  ('Welcome to the app', 'Thanks for installing. Here is what you can do first.', false, now() - interval '20 minutes'),
  ('New photos in the gallery', 'Six images were added this morning.', false, now() - interval '5 hours'),
  ('Scheduled maintenance', 'The app will be briefly unavailable on Sunday at 02:00 UTC.', true, now() - interval '3 days');

-- image_url must point at a host allowed in next.config.ts (Supabase Storage
-- public objects by default), otherwise next/image will refuse to load it.
insert into public.gallery_items (title, caption, image_url, created_at) values
  ('Harbour at dawn', 'Shot on the east pier.', 'https://placehold.co/800x800/png', now() - interval '1 day'),
  ('Market street', null, 'https://placehold.co/800x800/png', now() - interval '2 days');
