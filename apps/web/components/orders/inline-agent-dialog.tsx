"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type InlineAgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentCreated: (agentId: string) => void;
};

type Agency = {
  id: string;
  name: string;
};

export function InlineAgentDialog({ open, onOpenChange, onAgentCreated }: InlineAgentDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    licenseNumber: "",
    agencyId: "__none__",
  });

  useEffect(() => {
    if (open) {
      loadAgencies();
    }
  }, [open]);

  const loadAgencies = async () => {
    setLoadingAgencies(true);
    try {
      const response = await fetch("/api/admin/agencies");
      if (response.ok) {
        const result = await response.json();
        setAgencies(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load agencies:", error);
    } finally {
      setLoadingAgencies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          license_number: form.licenseNumber.trim() || null,
          agency_id: form.agencyId === "__none__" ? null : form.agencyId,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to create agent");
      }

      const result = await response.json();
      toast.success("Agent created");
      onAgentCreated(result.data.id);
      queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("agents-"),
      });
      onOpenChange(false);
      setForm({
        name: "",
        role: "",
        email: "",
        phone: "",
        licenseNumber: "",
        agencyId: "__none__",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>Add a new real estate agent to your database and link to this order.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="agent-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Jane Smith"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-role">Role / Title</Label>
            <Input id="agent-role" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} placeholder="Buyer’s Agent" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-email">Email</Label>
            <Input
              id="agent-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="jane@realty.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-phone">Phone</Label>
            <Input
              id="agent-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-license">License Number</Label>
            <Input
              id="agent-license"
              value={form.licenseNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
              placeholder="RE-12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-agency">Agency</Label>
            <Select value={form.agencyId} onValueChange={(value) => setForm((prev) => ({ ...prev, agencyId: value }))}>
              <SelectTrigger id="agent-agency">
                <SelectValue placeholder={loadingAgencies ? "Loading..." : "Select agency (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
