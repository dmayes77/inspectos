import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type ClientInlineFormProps = {
  onCreate: (client: { name: string; email: string }) => void;
  onCancel?: () => void;
};

export function ClientInlineForm({ onCreate, onCancel }: ClientInlineFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 400)); // Simulate async
        onCreate({ name, email });
        setSubmitting(false);
        setName("");
        setEmail("");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="client-name">Name</Label>
        <Input id="client-name" name="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Client Name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-email">Email</Label>
        <Input
          id="client-email"
          name="client-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@email.com"
          required
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Client"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
