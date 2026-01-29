import Link from "next/link";
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

type ClientInfo = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type ClientInfoCardProps = {
  title: string;
  client?: ClientInfo | null;
  actionLabel?: string;
  actionHref?: string;
  emptyLabel?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  typeBadge?: ReactNode;
};

export function ClientInfoCard({
  title,
  client,
  actionLabel,
  actionHref,
  emptyLabel = "No client assigned",
  emptyActionLabel,
  emptyActionHref,
  typeBadge,
}: ClientInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {client ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/admin/contacts/${client.id}`} className="font-medium hover:underline block truncate">
                  {client.name}
                </Link>
                {typeBadge ? <div className="mt-1">{typeBadge}</div> : null}
                {client.email && <p className="text-sm text-muted-foreground truncate">{client.email}</p>}
                {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
              </div>
            </div>
            {actionLabel && actionHref ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">{emptyLabel}</p>
            {emptyActionLabel && emptyActionHref ? (
              <Button asChild variant="outline" size="sm">
                <Link href={emptyActionHref}>{emptyActionLabel}</Link>
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
