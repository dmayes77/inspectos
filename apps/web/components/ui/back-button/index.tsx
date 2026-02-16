"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  href?: string;
  label?: string;
  variant?: "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "md" | "sm" | "icon";
  className?: string;
};

export function BackButton({
  href,
  label,
  variant = "outline",
  size = "sm",
  className,
}: BackButtonProps) {
  const router = useRouter();
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (href) {
      router.push(href);
    }
  };

  const isIconOnly = !label;

  return (
    <Button
      variant={variant}
      size={isIconOnly ? "icon" : size}
      onClick={handleBack}
      className={cn(isIconOnly ? "" : "gap-2", className)}
    >
      <ArrowLeft className={cn(isIconOnly ? "h-4 w-4" : "h-4 w-4")} />
      {label ? <span>{label}</span> : null}
    </Button>
  );
}
