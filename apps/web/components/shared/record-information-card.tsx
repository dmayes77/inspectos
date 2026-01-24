import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { formatTimestamp } from "@/lib/utils/dates";

type RecordInformationCardProps = {
  title?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function RecordInformationCard({
  title = "Record Information",
  createdAt,
  updatedAt,
}: RecordInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created {createdAt ? formatTimestamp(createdAt) : "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Updated {updatedAt ? formatTimestamp(updatedAt) : "—"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
