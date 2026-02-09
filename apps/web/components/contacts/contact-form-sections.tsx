"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTACT_TYPE_OPTIONS } from "@inspectos/shared/constants/contact-options";

export type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  type: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export function createEmptyContactForm(): ContactFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    type: "",
  };
}

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const nextErrors: ContactFormErrors = {};

  if (!values.name.trim()) nextErrors.name = "Name is required";
  if (!values.email.trim()) nextErrors.email = "Email is required";
  if (!values.phone.trim()) nextErrors.phone = "Phone is required";
  if (!values.type.trim()) nextErrors.type = "Client type is required";

  return nextErrors;
}

type ContactFormSectionsProps = {
  form: ContactFormValues;
  setForm: Dispatch<SetStateAction<ContactFormValues>>;
  errors: ContactFormErrors;
  setErrors?: Dispatch<SetStateAction<ContactFormErrors>>;
  title?: string;
  description?: string;
};

export function ContactFormSections({
  form,
  setForm,
  errors,
  setErrors,
  title = "Contact Information",
  description = "Enter the contact details below",
}: ContactFormSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, name: event.target.value }));
              setErrors?.((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, email: event.target.value }));
              setErrors?.((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, phone: event.target.value }));
              setErrors?.((prev) => ({ ...prev, phone: "" }));
            }}
            placeholder="(512) 555-1234"
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Client Type *</Label>
          <Select
            value={form.type}
            onValueChange={(value) => {
              setForm((prev) => ({ ...prev, type: value }));
              setErrors?.((prev) => ({ ...prev, type: "" }));
            }}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
