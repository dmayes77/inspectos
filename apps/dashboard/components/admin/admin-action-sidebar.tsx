"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminActionSidebarProps = {
  title: string;
  description?: ReactNode;
  actions: ReactNode;
  className?: string;
};

export function AdminActionSidebar({ title, description, actions, className = "" }: AdminActionSidebarProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-2">{actions}</CardContent>
    </Card>
  );
}
