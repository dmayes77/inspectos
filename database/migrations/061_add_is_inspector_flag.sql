-- Support billing inspector seats independent of member role.
-- Owners/Admins can optionally be inspectors; inspectors are always inspectors.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_inspector boolean NOT NULL DEFAULT false;

-- Backfill existing inspectors.
UPDATE public.profiles p
SET is_inspector = true
FROM public.tenant_members tm
WHERE tm.user_id = p.id
  AND tm.role = 'inspector';

CREATE INDEX IF NOT EXISTS idx_profiles_is_inspector
  ON public.profiles (is_inspector)
  WHERE is_inspector = true;
re_JYQ88LVt_JTpitLRLmjHUukjLm3fsfvxk