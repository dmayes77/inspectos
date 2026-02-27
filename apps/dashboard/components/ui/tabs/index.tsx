"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = React.useState({ width: 0, x: 0 });

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>("[data-state='active']");
    if (!active) return;
    const { offsetLeft, offsetWidth } = active;
    setIndicator((prev) => {
      if (prev.width === offsetWidth && prev.x === offsetLeft) return prev;
      return { width: offsetWidth, x: offsetLeft };
    });
  }, []);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    updateIndicator();
    const mutationObserver = new MutationObserver(updateIndicator);
    list.querySelectorAll("[data-slot='tabs-trigger']").forEach((node) => {
      mutationObserver.observe(node, { attributes: true, attributeFilter: ["data-state"] });
    });
    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(list);
    list.querySelectorAll("[data-slot='tabs-trigger']").forEach((node) => resizeObserver.observe(node));
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [updateIndicator]);

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      ref={listRef}
      className={cn("bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center rounded-md p-0.75", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0.75 left-0 rounded-md bg-background shadow-sm transition-transform duration-500 ease-out"
        style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }}
      />
      {props.children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-accent-foreground relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
