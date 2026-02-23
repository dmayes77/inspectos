"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreateClient } from "@/hooks/use-clients";
import { clientsQueryKeys } from "@inspectos/shared/query";

type InlineClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (clientId: string) => void;
};

export function InlineClientDialog({ open, onOpenChange, onClientCreated }: InlineClientDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const createClient = useCreateClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    setLoading(true);
    try {
      const client = await createClient.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim() || "",
        phone: form.phone.trim() || "",
        type: "Homebuyer",
        inspections: 0,
        lastInspection: "",
        totalSpent: 0,
        createdAt: null,
        updatedAt: null,
      });
      toast.success("Client created");
      onClientCreated(client.clientId);
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
      onOpenChange(false);
      setForm({ name: "", email: "", phone: "", company: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your database and link to this order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-company">Company</Label>
            <Input
              id="client-company"
              value={form.company}
              onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
              placeholder="Acme Corp"
            />
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
                  Create Client
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
