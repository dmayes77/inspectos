"use client";

import * as React from "react";
import { Save, Trash2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type SaveButtonProps = Omit<ButtonProps, "variant" | "children" | "startIcon"> & {
  label?: string;
  savingLabel?: string;
  isSaving?: boolean;
};

export function SaveButton({
  label = "Save Changes",
  savingLabel = "Saving...",
  isSaving = false,
  ...props
}: SaveButtonProps) {
  return (
    <Button variant="primary" loading={isSaving} startIcon={<Save className="size-4" />} {...props}>
      {isSaving ? savingLabel : label}
    </Button>
  );
}

type DeleteButtonProps = Omit<ButtonProps, "variant" | "children" | "startIcon"> & {
  label?: string;
};

export function DeleteButton({ label = "Delete", ...props }: DeleteButtonProps) {
  return (
    <Button variant="destructive" startIcon={<Trash2 className="size-4" />} {...props}>
      {label}
    </Button>
  );
}
