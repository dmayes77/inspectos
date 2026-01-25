"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_STAGE_OPTIONS } from "@/lib/constants/lead-options";

export type LeadFormValues = {
  name: string;
  email: string;
  phone: string;
  stage: string;
  serviceName: string;
  requestedDate: string;
  estimatedValue: string;
  source: string;
};

export type LeadFormErrors = Partial<Record<keyof LeadFormValues, string>>;

export function createEmptyLeadForm(): LeadFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    stage: "new",
    serviceName: "",
    requestedDate: "",
    estimatedValue: "",
    source: "",
  };
}

export function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const nextErrors: LeadFormErrors = {};

  if (!values.name.trim()) nextErrors.name = "Name is required";

  if (values.estimatedValue) {
    const value = Number(values.estimatedValue);
    if (!Number.isFinite(value) || value < 0) {
      nextErrors.estimatedValue = "Estimated value must be 0 or higher";
    }
  }

  return nextErrors;
}

type LeadFormSectionsProps = {
  form: LeadFormValues;
  setForm: Dispatch<SetStateAction<LeadFormValues>>;
  errors: LeadFormErrors;
  setErrors?: Dispatch<SetStateAction<LeadFormErrors>>;
  disabled?: boolean;
  title?: string;
  description?: string;
};

export function LeadFormSections({
  form,
  setForm,
  errors,
  setErrors,
  disabled = false,
  title = "Lead Details",
  description = "Enter contact and request info.",
}: LeadFormSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, name: event.target.value }));
              setErrors?.((prev) => ({ ...prev, name: "" }));
            }}
            disabled={disabled}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Stage</Label>
          <Select
            value={form.stage}
            onValueChange={(value) => setForm((prev) => ({ ...prev, stage: value }))}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceName">Service</Label>
          <Input
            id="serviceName"
            value={form.serviceName}
            onChange={(event) => setForm((prev) => ({ ...prev, serviceName: event.target.value }))}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="requestedDate">Requested date</Label>
          <Input
            id="requestedDate"
            type="date"
            value={form.requestedDate}
            onChange={(event) => setForm((prev) => ({ ...prev, requestedDate: event.target.value }))}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedValue">Estimated value</Label>
          <Input
            id="estimatedValue"
            type="number"
            min="0"
            step="1"
            value={form.estimatedValue}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, estimatedValue: event.target.value }));
              setErrors?.((prev) => ({ ...prev, estimatedValue: "" }));
            }}
            disabled={disabled}
          />
          {errors.estimatedValue && (
            <p className="text-sm text-destructive">{errors.estimatedValue}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={form.source}
            onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
