-- Apply role-based default profile colors for members still using the neutral placeholder.
-- Owners/Admins/Inspectors/Office Staff can still customize colors afterward.

UPDATE public.profiles p
SET profile_color = CASE tm.role
  WHEN 'owner' THEN '#94A3B8'
  WHEN 'admin' THEN '#60A5FA'
  WHEN 'inspector' THEN '#2DD4BF'
  WHEN 'viewer' THEN '#C4B5FD' -- Office Staff
  ELSE '#CBD5E1' -- Neutral fallback for unknown roles
END
FROM public.tenant_members tm
WHERE tm.user_id = p.id
  AND (
    p.profile_color IS NULL
    OR UPPER(p.profile_color) = '#CBD5E1'
  );
