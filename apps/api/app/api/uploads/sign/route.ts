import { NextRequest } from 'next/server';
import {
  createServiceClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError
} from '@/lib/supabase';

interface SignRequest {
  tenant_id: string;
  files: {
    id: string;
    file_name: string;
    mime_type: string;
    file_size: number;
    inspection_id?: string;
    finding_id?: string;
  }[];
}

interface SignedUrl {
  id: string;
  upload_url: string;
  public_url: string;
  expires_at: string;
}

/**
 * POST /api/uploads/sign
 *
 * Generates signed URLs for uploading files to Supabase Storage.
 * Files are organized by tenant and inspection.
 *
 * Body:
 * {
 *   tenant_id: string,
 *   files: [
 *     { id, file_name, mime_type, file_size, inspection_id?, finding_id? }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const body: SignRequest = await request.json();
    if (!body.tenant_id || !body.files || !Array.isArray(body.files)) {
      return badRequest('Invalid request body');
    }

    if (body.files.length === 0) {
      return badRequest('No files to sign');
    }

    if (body.files.length > 20) {
      return badRequest('Maximum 20 files per request');
    }

    const supabase = createServiceClient();

    // Verify user is a member of this tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', body.tenant_id)
      .eq('user_id', user.userId)
      .single();

    if (membershipError || !membership) {
      return unauthorized('Not a member of this tenant');
    }

    const signedUrls: SignedUrl[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const file of body.files) {
      try {
        // Validate file size (max 50MB)
        if (file.file_size > 50 * 1024 * 1024) {
          errors.push({ id: file.id, error: 'File too large (max 50MB)' });
          continue;
        }

        // Validate mime type
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp',
          'application/pdf',
          'video/mp4', 'video/quicktime'
        ];
        if (!allowedTypes.includes(file.mime_type)) {
          errors.push({ id: file.id, error: `File type not allowed: ${file.mime_type}` });
          continue;
        }

        // Build the storage path
        // Format: {tenant_id}/{inspection_id}/{file_id}_{filename}
        const sanitizedName = file.file_name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .slice(0, 100);

        const folder = file.inspection_id || 'general';
        const storagePath = `${body.tenant_id}/${folder}/${file.id}_${sanitizedName}`;

        // Create signed upload URL (valid for 1 hour)
        const { data: signedData, error: signError } = await supabase.storage
          .from('inspections')
          .createSignedUploadUrl(storagePath);

        if (signError || !signedData) {
          errors.push({ id: file.id, error: signError?.message || 'Failed to create signed URL' });
          continue;
        }

        // Get the public URL for after upload
        const { data: publicData } = supabase.storage
          .from('inspections')
          .getPublicUrl(storagePath);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        signedUrls.push({
          id: file.id,
          upload_url: signedData.signedUrl,
          public_url: publicData.publicUrl,
          expires_at: expiresAt.toISOString()
        });
      } catch (error) {
        errors.push({
          id: file.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return Response.json({
      success: true,
      signed_urls: signedUrls,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[Uploads Sign] Error:', error);
    return serverError();
  }
}
