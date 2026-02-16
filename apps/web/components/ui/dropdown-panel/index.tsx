"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// DropdownPanel — lightweight positioned dropdown (TailAdmin style)
interface DropdownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

function DropdownPanel({ isOpen, onClose, children, className }: DropdownPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 z-40 mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark",
        className
      )}
    >
      {children}
    </div>
  );
}

// DropdownItem — a single item inside a DropdownPanel
interface DropdownItemProps {
  tag?: "a" | "button";
  href?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

function DropdownItem({
  tag = "button",
  href,
  onClick,
  onItemClick,
  className,
  children,
}: DropdownItemProps) {
  const base = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05] dark:hover:text-white";

  const handleClick = (e: React.MouseEvent) => {
    if (tag === "button") e.preventDefault();
    onClick?.();
    onItemClick?.();
  };

  if (tag === "a" && href) {
    return (
      <Link href={href} className={cn(base, className)} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={cn(base, className)}>
      {children}
    </button>
  );
}

export { DropdownPanel, DropdownItem };
