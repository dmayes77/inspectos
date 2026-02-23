"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root data-slot="avatar" className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("aspect-square size-full object-cover", className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
      {...props}
    />
  );
}

// TailAdmin-style initials avatar
interface AvatarTextProps {
  name: string;
  className?: string;
}

function AvatarText({ name, className = "" }: AvatarTextProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-brand-100 text-brand-600",
    "bg-pink-100 text-pink-600",
    "bg-cyan-100 text-cyan-600",
    "bg-orange-100 text-orange-600",
    "bg-green-100 text-green-600",
    "bg-purple-100 text-purple-600",
    "bg-yellow-100 text-yellow-600",
    "bg-error-100 text-error-600",
  ];

  const colorClass = colors[
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  ];

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        colorClass,
        className
      )}
    >
      <span className="text-sm font-medium">{initials}</span>
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarText };
