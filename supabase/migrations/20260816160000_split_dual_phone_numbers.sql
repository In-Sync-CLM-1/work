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
--
-- The split is computed in a CTE rather than a LATERAL in the FROM clause:
-- an UPDATE's target table is not visible to a LATERAL subquery beside it,
-- which fails with "invalid reference to FROM-clause entry".
WITH split AS (
  SELECT
    id,
    btrim(split_part(translate(phone, ',;|', '///'), '/', 1))            AS first_num,
    NULLIF(btrim(split_part(translate(phone, ',;|', '///'), '/', 2)), '') AS second_num
  FROM public.profiles
  WHERE phone ~ '[,;/|]'
)
UPDATE public.profiles p
SET
  phone      = s.first_num,
  phone_alt  = COALESCE(p.phone_alt, s.second_num),
  updated_at = now()
FROM split s
WHERE s.id = p.id;
