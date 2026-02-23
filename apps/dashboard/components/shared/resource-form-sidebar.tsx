"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResourceFormSidebarProps = {
  actions: ReactNode;
  tips?: string[];
  tipTitle?: string;
};

export function ResourceFormSidebar({ actions, tips = [], tipTitle = "Quick Tips" }: ResourceFormSidebarProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 w-full">{actions}</div>
        </CardContent>
      </Card>
      {tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tipTitle}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {tips.map((tip, index) => (
              <p key={index}>{tip}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
