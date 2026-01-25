import { PropsWithChildren } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ActionSidebarCardProps = PropsWithChildren<{
  title: string;
  tips?: string[];
}>;

export function ActionSidebarCard({ title, tips, children }: ActionSidebarCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">{children}</CardContent>

      {tips && tips.length > 0 && (
        <>
          <Separator />
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {tips.map((tip, index) => (
              <p key={index}>{tip}</p>
            ))}
          </CardContent>
        </>
      )}
    </Card>
  );
}
