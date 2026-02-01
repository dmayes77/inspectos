import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Mock API for demonstration
const mockVendors = [
  { id: "1", name: "Acme Pest Control", type: "Pest", contact: "555-1234", specialties: "Termites", status: "active", notes: "" },
  { id: "2", name: "Roof Pros", type: "Roof", contact: "555-5678", specialties: "Shingles, Flat Roofs", status: "active", notes: "" },
];

let vendorStore = [...mockVendors];

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      // Fetch vendors from Supabase
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from("vendors").select("*");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useVendor(id: string) {
  // TODO: Replace with dynamic tenant_id from user/session
  const tenantId = "f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3";
  return useQuery({
    queryKey: ["vendors", tenantId],
    queryFn: async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from("vendors").select("*").eq("tenant_id", tenantId);
      if (error) throw error;
      return data || [];
    },
  });
  return Promise.resolve();
}

export function deleteVendor(id: string) {
  vendorStore = vendorStore.filter((v) => v.id !== id);
  return Promise.resolve();
}
