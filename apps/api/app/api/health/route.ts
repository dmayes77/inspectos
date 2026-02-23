/**
 * Health check endpoint
 * Returns 200 OK if the API service is running
 */
export async function GET() {
  return Response.json({ ok: true, service: "inspectos-api" });
}
