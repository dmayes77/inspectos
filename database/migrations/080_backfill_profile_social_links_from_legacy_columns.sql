-- Ensure the social_links array exists for flexible social profile entries.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_links TEXT[] NOT NULL DEFAULT '{}';

-- Backfill social_links for existing rows that only have legacy social_* fields.
UPDATE public.profiles
SET social_links = ARRAY_REMOVE(
  ARRAY[
    NULLIF(BTRIM(social_facebook), ''),
    NULLIF(BTRIM(social_twitter), ''),
    NULLIF(BTRIM(social_linkedin), ''),
    NULLIF(BTRIM(social_instagram), '')
  ],
  NULL
)
WHERE (social_links IS NULL OR cardinality(social_links) = 0)
  AND (
    NULLIF(BTRIM(social_facebook), '') IS NOT NULL
    OR NULLIF(BTRIM(social_twitter), '') IS NOT NULL
    OR NULLIF(BTRIM(social_linkedin), '') IS NOT NULL
    OR NULLIF(BTRIM(social_instagram), '') IS NOT NULL
  );
