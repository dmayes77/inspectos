-- =====================================================
-- Lock down seed auth helper (service role only)
-- =====================================================

REVOKE ALL ON FUNCTION public.create_seed_auth_user(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_seed_auth_user(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_seed_auth_user(TEXT, TEXT) TO supabase_admin;
