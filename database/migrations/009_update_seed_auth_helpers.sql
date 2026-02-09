-- =====================================================
-- Update seed auth helper to avoid confirmed_at writes
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_seed_auth_user(p_email TEXT, p_full_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    aud,
    role,
    email_confirmed_at,
    created_at,
    updated_at
  )
  VALUES (
    new_id,
    p_email,
    jsonb_build_object('full_name', p_full_name),
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', p_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RETURN new_id;
END;
$$;
