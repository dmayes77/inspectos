"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type MultiSelectOption = {
  value: string;
  label: string;
  meta?: string; // e.g. vendor type, role
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function MultiSelect({ options, value, onChange, placeholder = "Select...", className, id }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const filteredOptions = options.filter(
    (opt) => !value.includes(opt.value) && opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (optionValue: string) => {
    onChange([...value, optionValue]);
    setSearch("");
    inputRef.current?.focus();
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1 text-sm cursor-text",
          "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
          open && "ring-1 ring-ring",
        )}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedOptions.map((opt) => (
          <Badge key={opt.value} color="light" className="gap-1 pr-1 text-xs font-normal">
            {opt.label}
            {opt.meta && <span className="text-muted-foreground">· {opt.meta}</span>}
            <button
              type="button"
              className="ml-0.5 rounded-md opacity-60 hover:opacity-100 focus:outline-none"
              onClick={(e) => handleRemove(opt.value, e)}
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selectedOptions.length === 0 ? placeholder : ""}
          className="flex-1 min-w-16 bg-transparent outline-none placeholder:text-muted-foreground text-xs"
        />
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                {search ? "No results." : "All options selected."}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur
                    handleSelect(opt.value);
                  }}
                >
                  <span className="flex-1 text-left">{opt.label}</span>
                  {opt.meta && <span className="text-xs text-muted-foreground">{opt.meta}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
