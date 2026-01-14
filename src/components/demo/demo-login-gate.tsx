"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppWindow, Shield, User } from "lucide-react";

const roleOptions = [
  { value: "inspector", label: "Inspector", href: "/inspector/schedule" },
  { value: "admin", label: "Admin", href: "/admin/overview" },
];

export function DemoLoginGate() {
  const router = useRouter();
  const [role, setRole] = useState(roleOptions[0].value);

  const handleContinue = () => {
    const target = roleOptions.find((option) => option.value === role);
    router.push(target?.href || "/inspector/schedule");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardContent className="space-y-6 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <AppWindow className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="mx-auto">
              Demo Sign In
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">Choose a role</h1>
            <p className="text-sm text-muted-foreground">
              This demo lets you preview the mobile experience.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      {option.value === "inspector" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="lg" className="w-full" onClick={handleContinue}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
