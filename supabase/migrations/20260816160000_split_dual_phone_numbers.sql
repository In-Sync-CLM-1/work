-- One number per field (2026-08-16)
--
-- Four active profiles carry TWO mobile numbers in the single `phone` column,
-- separated by a slash or a comma. `toExotelRecipient()` already picks the
-- first at send time, but the record itself stays misleading: anyone reading
-- or editing that profile sees a field that isn't a phone number, and any
-- future code that trusts the column repeats the same bug.
--
-- So `phone` keeps the FIRST number and the second moves to `phone_alt`.
-- The second number is NOT discarded -- it is somebody's real alternate
-- contact, and deleting it to tidy a format would be a poor trade.
--
-- Notifications are unaffected either way: they have always used the first
-- number, and still do.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_alt text;

COMMENT ON COLUMN public.profiles.phone_alt IS
  'Secondary contact number. Not used for notifications -- `phone` is the number we message.';

-- Idempotent: once this has run, no `phone` value contains a separator, so a
-- re-run matches nothing. An existing phone_alt is never overwritten.
UPDATE public.profiles p
SET
  phone      = btrim(split_part(n.normalised, '/', 1)),
  phone_alt  = COALESCE(p.phone_alt, NULLIF(btrim(split_part(n.normalised, '/', 2)), '')),
  updated_at = now()
FROM LATERAL (SELECT translate(p.phone, ',;|', '///') AS normalised) n
WHERE p.phone ~ '[,;/|]';
