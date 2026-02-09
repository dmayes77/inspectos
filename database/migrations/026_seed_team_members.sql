-- =====================================================
-- Seed mock team members into auth/users + profiles + tenant_members
-- =====================================================

DO $$
DECLARE
  v_tenant_id UUID := 'f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3';
  v_user_id UUID;
BEGIN
  -- Sarah Johnson (OWNER)
  v_user_id := (SELECT id FROM auth.users WHERE email = 'sarah@acmeinspections.com' LIMIT 1);
  IF v_user_id IS NULL THEN
    v_user_id := create_seed_auth_user('sarah@acmeinspections.com', 'Sarah Johnson');
  END IF;
  INSERT INTO profiles (id, email, full_name)
  VALUES (v_user_id, 'sarah@acmeinspections.com', 'Sarah Johnson')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'owner')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Mike Richardson (INSPECTOR)
  v_user_id := (SELECT id FROM auth.users WHERE email = 'mike@acmeinspections.com' LIMIT 1);
  IF v_user_id IS NULL THEN
    v_user_id := create_seed_auth_user('mike@acmeinspections.com', 'Mike Richardson');
  END IF;
  INSERT INTO profiles (id, email, full_name)
  VALUES (v_user_id, 'mike@acmeinspections.com', 'Mike Richardson')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'inspector')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- James Wilson (INSPECTOR)
  v_user_id := (SELECT id FROM auth.users WHERE email = 'james@acmeinspections.com' LIMIT 1);
  IF v_user_id IS NULL THEN
    v_user_id := create_seed_auth_user('james@acmeinspections.com', 'James Wilson');
  END IF;
  INSERT INTO profiles (id, email, full_name)
  VALUES (v_user_id, 'james@acmeinspections.com', 'James Wilson')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'inspector')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- David Chen (INSPECTOR)
  v_user_id := (SELECT id FROM auth.users WHERE email = 'david@acmeinspections.com' LIMIT 1);
  IF v_user_id IS NULL THEN
    v_user_id := create_seed_auth_user('david@acmeinspections.com', 'David Chen');
  END IF;
  INSERT INTO profiles (id, email, full_name)
  VALUES (v_user_id, 'david@acmeinspections.com', 'David Chen')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'inspector')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Jennifer Martinez (OFFICE_STAFF -> viewer)
  v_user_id := (SELECT id FROM auth.users WHERE email = 'jennifer@acmeinspections.com' LIMIT 1);
  IF v_user_id IS NULL THEN
    v_user_id := create_seed_auth_user('jennifer@acmeinspections.com', 'Jennifer Martinez');
  END IF;
  INSERT INTO profiles (id, email, full_name)
  VALUES (v_user_id, 'jennifer@acmeinspections.com', 'Jennifer Martinez')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'viewer')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Tom Anderson (ADMIN)
  v_user_id := (SELECT id FROM auth.users WHERE email = 'tom@acmeinspections.com' LIMIT 1);
  IF v_user_id IS NULL THEN
    v_user_id := create_seed_auth_user('tom@acmeinspections.com', 'Tom Anderson');
  END IF;
  INSERT INTO profiles (id, email, full_name)
  VALUES (v_user_id, 'tom@acmeinspections.com', 'Tom Anderson')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'admin')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
END $$;
