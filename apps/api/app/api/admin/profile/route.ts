import { serverError, success, notFound } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { normalizePhoneForStorage } from '@/lib/phone/normalize';

const PROFILE_FIELDS =
  'id, email, full_name, avatar_url, phone, bio, social_links, social_facebook, social_twitter, social_linkedin, social_instagram, address_line1, address_line2, city, state_region, country, postal_code, custom_permissions';

type ProfileRow = {
  social_links?: string[] | null;
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
  [key: string]: unknown;
};

function mapProfileSocialLinks(profile: ProfileRow) {
  const fromArray = Array.isArray(profile.social_links)
    ? profile.social_links.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return {
      ...profile,
      social_links: fromArray,
    };
  }

  const fallback = [
    profile.social_facebook,
    profile.social_twitter,
    profile.social_linkedin,
    profile.social_instagram,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    ...profile,
    social_links: fallback,
  };
}

/**
 * GET /api/admin/profile
 */
export const GET = withAuth(async ({ supabase, serviceClient, user, memberRole, memberPermissions }) => {
  const profileResult = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', user.userId).maybeSingle();

  if (profileResult.error) return serverError('Failed to fetch profile', profileResult.error);

  let profileData = profileResult.data as ProfileRow | null;
  if (!profileData) {
    if (!user.email) {
      return notFound('Profile not found');
    }
    const seeded = await serviceClient
      .from('profiles')
      .upsert(
        {
          id: user.userId,
          email: user.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select(PROFILE_FIELDS)
      .single();
    if (seeded.error) return serverError('Failed to initialize profile', seeded.error);
    profileData = seeded.data as ProfileRow;
  }

  return success({
    ...mapProfileSocialLinks(profileData),
    role: memberRole,
    permissions: memberPermissions,
  });
});

/**
 * PUT /api/admin/profile
 */
export const PUT = withAuth(async ({ supabase, serviceClient, user, request }) => {
  const body = await request.json() as {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    bio?: string;
    social_facebook?: string;
    social_twitter?: string;
    social_linkedin?: string;
    social_instagram?: string;
    social_links?: string[] | null;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_region?: string;
    country?: string;
    postal_code?: string;
  };

  const updateBody: Record<string, unknown> = { ...body };
  if ('phone' in body) {
    updateBody.phone = normalizePhoneForStorage(body.phone);
  }
  if ('social_links' in body) {
    const incomingLinks = Array.isArray(body.social_links) ? body.social_links : [];
    const socialLinks = incomingLinks
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean);
    updateBody.social_links = socialLinks;
    updateBody.social_facebook = socialLinks[0] ?? null;
    updateBody.social_twitter = socialLinks[1] ?? null;
    updateBody.social_linkedin = socialLinks[2] ?? null;
    updateBody.social_instagram = socialLinks[3] ?? null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updateBody, updated_at: new Date().toISOString() })
    .eq('id', user.userId)
    .select(PROFILE_FIELDS)
    .maybeSingle();

  if (error) return serverError('Failed to update profile', error);

  let profileData = data as ProfileRow | null;
  if (!profileData) {
    if (!user.email) {
      return notFound('Profile not found');
    }

    const seeded = await serviceClient
      .from('profiles')
      .upsert(
        {
          id: user.userId,
          email: user.email,
          ...updateBody,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select(PROFILE_FIELDS)
      .single();
    if (seeded.error) return serverError('Failed to update profile', seeded.error);
    profileData = seeded.data as ProfileRow;
  }

  return success(mapProfileSocialLinks(profileData));
});
