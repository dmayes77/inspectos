import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: inspection, error: inspectionError } = await supabaseAdmin
    .from("inspections")
    .select(
      `
        *,
        order:orders!inspections_order_id_fkey(
          id,
          scheduled_date,
          scheduled_time,
          property:properties(*),
          client:clients(id, name, email, phone, company)
        ),
        template:templates(
          id,
          name,
          description,
          template_sections(
            id,
            name,
            description,
            sort_order,
            template_items(
              id,
              name,
              description,
              item_type,
              options,
              is_required,
              sort_order
            )
          )
        )
      `,
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (inspectionError || !inspection) {
    return NextResponse.json({ error: { message: inspectionError?.message ?? "Inspection not found." } }, { status: 404 });
  }

  const { data: answers, error: answersError } = await supabaseAdmin
    .from("answers")
    .select(
      `
        id,
        template_item_id,
        section_id,
        value,
        notes,
        created_at,
        updated_at
      `,
    )
    .eq("inspection_id", id);

  if (answersError) {
    return NextResponse.json({ error: { message: answersError.message } }, { status: 500 });
  }

  const { data: findings, error: findingsError } = await supabaseAdmin
    .from("findings")
    .select(
      `
        id,
        section_id,
        template_item_id,
        defect_library_id,
        title,
        description,
        severity,
        location,
        recommendation,
        estimated_cost_min,
        estimated_cost_max,
        created_at,
        updated_at,
        media:media_assets(id, storage_path, file_name, mime_type, caption)
      `,
    )
    .eq("inspection_id", id)
    .order("severity", { ascending: false });

  if (findingsError) {
    return NextResponse.json({ error: { message: findingsError.message } }, { status: 500 });
  }

  const { data: signatures, error: signaturesError } = await supabaseAdmin
    .from("signatures")
    .select(
      `
        id,
        signer_name,
        signer_type,
        signature_data,
        signed_at
      `,
    )
    .eq("inspection_id", id)
    .order("signed_at", { ascending: true });

  if (signaturesError) {
    return NextResponse.json({ error: { message: signaturesError.message } }, { status: 500 });
  }

  const { data: media, error: mediaError } = await supabaseAdmin
    .from("media_assets")
    .select(
      `
        id,
        finding_id,
        answer_id,
        storage_path,
        file_name,
        mime_type,
        file_size,
        caption,
        created_at
      `,
    )
    .eq("inspection_id", id)
    .order("created_at", { ascending: true });

  if (mediaError) {
    return NextResponse.json({ error: { message: mediaError.message } }, { status: 500 });
  }

  const { order, ...rest } = inspection as typeof inspection & { order?: typeof inspection.job };
  const normalizedInspection = {
    ...rest,
    job: order ?? null,
  };

  return NextResponse.json({
    data: {
      inspection: normalizedInspection,
      answers: answers ?? [],
      findings: findings ?? [],
      signatures: signatures ?? [],
      media: media ?? [],
    },
  });
}
