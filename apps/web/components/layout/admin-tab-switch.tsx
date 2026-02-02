"use client";

"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

export type AdminTabItem = {
  value: string;
  label: ReactNode;
};

export type AdminTabSwitchProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: AdminTabItem[];
  className?: string;
};

export function AdminTabSwitch({ value, onValueChange, items, className }: AdminTabSwitchProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
      <TabsList className="grid h-9 w-full grid-cols-2 bg-accent text-xs">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="px-2 text-[11px] font-semibold leading-5"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
