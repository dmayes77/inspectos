"use client";

import { ReactNode } from "react";

type ResourceFormLayoutProps = {
  left: ReactNode;
  right: ReactNode;
};

export function ResourceFormLayout({ left, right }: ResourceFormLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">{left}</div>
      <div className="space-y-6">{right}</div>
    </div>
  );
}
