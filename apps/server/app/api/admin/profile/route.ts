import { serverError, success, notFound } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

const PROFILE_FIELDS = 'id, email, full_name, avatar_url, phone, bio, social_facebook, social_twitter, social_linkedin, social_instagram, address_line1, address_line2, city, state_region, country, postal_code';

/**
 * GET /api/admin/profile
 */
export const GET = withAuth(async ({ supabase, user, memberRole }) => {
  const profileResult = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', user.userId).single();

  if (profileResult.error) return serverError('Failed to fetch profile', profileResult.error);
  if (!profileResult.data) return notFound('Profile not found');

  return success({ ...profileResult.data, role: memberRole });
});

/**
 * PUT /api/admin/profile
 */
export const PUT = withAuth(async ({ supabase, user, request }) => {
  const body = await request.json() as {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    bio?: string;
    social_facebook?: string;
    social_twitter?: string;
    social_linkedin?: string;
    social_instagram?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_region?: string;
    country?: string;
    postal_code?: string;
  };

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', user.userId)
    .select(PROFILE_FIELDS)
    .single();

  if (error) return serverError('Failed to update profile', error);

  return success(data);
});
