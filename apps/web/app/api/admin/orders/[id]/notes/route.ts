import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

const noteTypes = new Set(["internal", "client"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("order_notes")
    .select(
      `
      id,
      order_id,
      tenant_id,
      note_type,
      body,
      created_at,
      created_by:profiles(id, full_name, email, avatar_url)
    `
    )
    .eq("tenant_id", tenantId)
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  let payload: { note_type?: string; body?: string } = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const noteType = payload.note_type?.trim?.();
  const body = payload.body?.trim?.();
  if (!noteType || !noteTypes.has(noteType)) {
    return NextResponse.json(
      { error: { message: "note_type must be 'internal' or 'client'." } },
      { status: 400 }
    );
  }
  if (!body) {
    return NextResponse.json(
      { error: { message: "Note body is required." } },
      { status: 400 }
    );
  }

  const { data: note, error } = await supabaseAdmin
    .from("order_notes")
    .insert({
      tenant_id: tenantId,
      order_id: id,
      note_type: noteType,
      body,
    })
    .select(
      `
      id,
      order_id,
      tenant_id,
      note_type,
      body,
      created_at,
      created_by:profiles(id, full_name, email, avatar_url)
    `
    )
    .single();

  if (error || !note) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Failed to save note." } },
      { status: 500 }
    );
  }

  const orderUpdate: Record<string, string | null> = {};
  if (noteType === "internal") orderUpdate.internal_notes = body;
  if (noteType === "client") orderUpdate.client_notes = body;
  await supabaseAdmin
    .from("orders")
    .update(orderUpdate)
    .eq("tenant_id", tenantId)
    .eq("id", id);

  return NextResponse.json({ data: note });
}
