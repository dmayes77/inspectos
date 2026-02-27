"use client";

import { Shield, Unlock, Lock, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { permissionCategories, getPermissionsForRole } from "@/lib/permissions";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { DeleteButton, SaveButton } from "@/components/shared/action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Star, ClipboardList, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTeamMembers, useUpdateTeamMember, useDeleteTeamMember, TeamMember } from "@/hooks/use-team";
import { useProfile } from "@/hooks/use-profile";
import { can } from "@/lib/admin/permissions";
import { uploadCurrentUserAvatar } from "@/lib/api/media";
import { parseSlugIdSegment } from "@/lib/routing/slug-id";

type WeeklyAvailabilitySlot = {
  day: string;
  available: boolean;
  startTime: string;
  endTime: string;
};

const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailabilitySlot[] = [
  { day: "Mon", available: true, startTime: "08:00", endTime: "17:00" },
  { day: "Tue", available: true, startTime: "08:00", endTime: "17:00" },
  { day: "Wed", available: true, startTime: "08:00", endTime: "17:00" },
  { day: "Thu", available: true, startTime: "08:00", endTime: "17:00" },
  { day: "Fri", available: true, startTime: "08:00", endTime: "17:00" },
  { day: "Sat", available: false, startTime: "", endTime: "" },
  { day: "Sun", available: false, startTime: "", endTime: "" },
];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function normalizeWeeklyAvailability(value: unknown): WeeklyAvailabilitySlot[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_WEEKLY_AVAILABILITY;

  const normalized = value
    .map((entry): WeeklyAvailabilitySlot | null => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const day = typeof record.day === "string" ? record.day : "";
      if (!day) return null;

      if (typeof record.window === "string") {
        const window = record.window;
        if (window.toLowerCase() === "unavailable") {
          return { day, available: false, startTime: "", endTime: "" };
        }
        return { day, available: true, startTime: "", endTime: "" };
      }

      return {
        day,
        available: Boolean(record.available),
        startTime: typeof record.startTime === "string" ? record.startTime : "",
        endTime: typeof record.endTime === "string" ? record.endTime : "",
      };
    })
    .filter((slot): slot is WeeklyAvailabilitySlot => Boolean(slot));

  return normalized.length > 0 ? normalized : DEFAULT_WEEKLY_AVAILABILITY;
}

export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: profile } = useProfile();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const rawMemberId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const memberId = parseSlugIdSegment(rawMemberId ? String(rawMemberId) : "");
  const member = teamMembers.find((m) => m.memberId.toLowerCase() === memberId.toLowerCase());
  const [form, setForm] = useState<Partial<TeamMember>>({});
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailabilitySlot[]>([]);
  const [availabilityExceptions, setAvailabilityExceptions] = useState<
    Array<{ id: string; type: string; startDate: string; endDate: string; status: string }>
  >([]);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const uploadAvatarMutation = useMutation({ mutationFn: uploadCurrentUserAvatar });

  const effectiveRole = (form.role as TeamMember["role"]) ?? member?.role;
  const memberRolePermissions = effectiveRole ? getPermissionsForRole(effectiveRole) : [];
  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];
  const canEditMember = can(userRole, "edit_team", userPermissions);
  const canDeleteMember = can(userRole, "delete_team", userPermissions);
  const canManageRoles = can(userRole, "manage_roles", userPermissions);

  useEffect(() => {
    if (!member) return;
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      isInspector: member.isInspector,
      role: member.role,
      status: member.status,
      location: member.location,
      addressLine1: member.addressLine1,
      addressLine2: member.addressLine2,
      city: member.city,
      stateRegion: member.stateRegion,
      postalCode: member.postalCode,
      country: member.country,
    });
    setWeeklyAvailability(normalizeWeeklyAvailability(member.weeklyAvailability));
    setAvailabilityExceptions(Array.isArray(member.availabilityExceptions) ? member.availabilityExceptions : []);
    setCustomPermissions(Array.isArray(member.customPermissions) ? member.customPermissions : []);
  }, [member]);

  if (!member) {
    return (
      <div className="p-8">Not found.</div>
    );
  }

  const handleSave = () => {
    if (!canEditMember) return;
    updateMember.mutate({
      memberId: member.memberId,
      ...form,
      customPermissions,
      weeklyAvailability,
      availabilityExceptions,
    });
  };

  const handleDelete = () => {
    deleteMember.mutate(member.memberId);
    setDeleteDialogOpen(false);
    router.push("/team");
  };
  const memberInitials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const resolvedAvatarUrl = form.avatarUrl ?? member.avatarUrl ?? undefined;

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Use PNG, JPEG, WebP, or GIF images.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Profile photos must be under 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const data = await uploadAvatarMutation.mutateAsync(file);
      setForm((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      toast.success("Profile photo updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload profile photo.";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const headerActions = (
    <div className="space-y-2">
      {canEditMember ? (
        <>
          <SaveButton className="w-full" onClick={handleSave} isSaving={updateMember.isPending} />
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                status: (prev.status ?? member.status) === "active" ? "inactive" : "active",
              }))
            }
          >
            {(form.status ?? member.status) === "active" ? (
              <Lock className="mr-2 h-4 w-4" />
            ) : (
              <Unlock className="mr-2 h-4 w-4" />
            )}
            {(form.status ?? member.status) === "active" ? "Suspend" : "Reactivate"}
          </Button>
        </>
      ) : null}
      {canDeleteMember ? (
        <DeleteButton
          className="w-full"
          onClick={() => setDeleteDialogOpen(true)}
        />
      ) : null}
    </div>
  );

  return (
    <>
      <IdPageLayout
        title={member.name}
        description="Adjust profile details, schedule, and permissions."
        breadcrumb={
          <>
            <Link href="/team" className="text-muted-foreground transition hover:text-foreground">
              Team
            </Link>
            <span className="text-muted-foreground">{">"}</span>
            <span className="max-w-[20rem] truncate font-medium">{member.name}</span>
          </>
        }
        left={
          <div className="space-y-4">
      {/* Details Row: Contact Info & Certifications */}
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Contact Info */}
        <Card className="card-admin flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={resolvedAvatarUrl} />
                <AvatarFallback>{memberInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="space-y-0.5">
                  <p className="mb-0 font-medium leading-tight">{member.name}</p>
                  <p className="mb-0 text-sm text-muted-foreground leading-tight">{member.email || "No email provided"}</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="team-avatar">Profile photo</Label>
                  <Input
                    id="team-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />
                  <p className="mb-0 text-xs text-muted-foreground">
                    {isUploadingAvatar ? "Uploading photo..." : "Use a square JPG, PNG, WebP, or GIF under 2MB."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="member-name">Full Name</Label>
                <Input
                  id="member-name"
                  value={form.name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="member-phone">Phone</Label>
                <Input
                  id="member-phone"
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-location">Location</Label>
                <Input
                  id="member-location"
                  value={form.location ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={(form.role as TeamMember["role"]) ?? member.role}
                  disabled={!canManageRoles}
                  onValueChange={(value) => {
                    setForm((f) => ({
                      ...f,
                      role: value as TeamMember["role"],
                      isInspector:
                        value === "INSPECTOR"
                          ? true
                          : value === "OWNER" || value === "ADMIN"
                            ? Boolean(f.isInspector)
                            : false,
                    }));
                    setCustomPermissions([]);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OFFICE_STAFF">Office Staff</SelectItem>
                    <SelectItem value="INSPECTOR">Inspector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={(form.status as TeamMember["status"]) ?? member.status}
                  disabled={!canEditMember}
                  onValueChange={(value) => setForm((f) => ({ ...f, status: value as TeamMember["status"] }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(String((form.role as TeamMember["role"]) ?? member.role) === "OWNER" ||
              String((form.role as TeamMember["role"]) ?? member.role) === "ADMIN" ||
              String((form.role as TeamMember["role"]) ?? member.role) === "INSPECTOR") ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={Boolean(form.isInspector ?? member.isInspector)}
                  disabled={!canEditMember || ((form.role as TeamMember["role"]) ?? member.role) === "INSPECTOR"}
                  onCheckedChange={(value) => setForm((f) => ({ ...f, isInspector: Boolean(value) }))}
                />
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Also inspector (billable seat)
                </Label>
              </div>
            ) : null}

            <Separator />

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-address-line-1">Address Line 1</Label>
              <Input
                id="member-address-line-1"
                value={form.addressLine1 ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-address-line-2">Address Line 2</Label>
              <Input
                id="member-address-line-2"
                value={form.addressLine2 ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
                placeholder="Suite, unit, etc."
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="member-city">City</Label>
                <Input
                  id="member-city"
                  value={form.city ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-state-region">State</Label>
                <Input
                  id="member-state-region"
                  value={form.stateRegion ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, stateRegion: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-postal-code">ZIP</Label>
                <Input
                  id="member-postal-code"
                  value={form.postalCode ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-country">Country</Label>
              <Input
                id="member-country"
                value={form.country ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="US"
              />
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        {member.certifications.length > 0 && (
          <Card className="card-admin flex-1 md:max-w-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {member.certifications.map((cert) => (
                  <Badge key={cert} color="light">
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="card-admin">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Schedule & Exceptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Weekly Schedule</div>
            <div className="space-y-2">
              {weeklyAvailability.map((slot) => (
                <div key={slot.day} className="flex items-center gap-3 px-1 py-1.5">
                  <div className="w-16 text-xs font-medium">{slot.day}</div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={slot.available ? "available" : "unavailable"}
                      onValueChange={(value) =>
                        setWeeklyAvailability((prev) =>
                          prev.map((item) =>
                            item.day === slot.day
                              ? {
                                  ...item,
                                  available: value === "available",
                                  startTime: value === "available" ? item.startTime || "08:00" : "",
                                  endTime: value === "available" ? item.endTime || "17:00" : "",
                                }
                              : item
                          )
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Not Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {slot.available ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.startTime}
                        className="h-8 w-32 text-xs"
                        onChange={(e) =>
                          setWeeklyAvailability((prev) =>
                            prev.map((item) => (item.day === slot.day ? { ...item, startTime: e.target.value } : item))
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        className="h-8 w-32 text-xs"
                        onChange={(e) =>
                          setWeeklyAvailability((prev) =>
                            prev.map((item) => (item.day === slot.day ? { ...item, endTime: e.target.value } : item))
                          )
                        }
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No hours set</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Exceptions</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setAvailabilityExceptions((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      type: "Personal",
                      startDate: "",
                      endDate: "",
                      status: "Pending",
                    },
                  ])
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Exception
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Time-off requests and one-off availability overrides are managed here.
            </p>
            <div className="space-y-2">
              {availabilityExceptions.map((exception) => (
                <div key={exception.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={exception.type}
                        className="h-8 min-w-28 text-xs"
                        onChange={(e) =>
                          setAvailabilityExceptions((prev) =>
                            prev.map((item) => (item.id === exception.id ? { ...item, type: e.target.value } : item))
                          )
                        }
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Input
                        type="date"
                        value={exception.startDate}
                        className="h-8 text-xs"
                        onChange={(e) =>
                          setAvailabilityExceptions((prev) =>
                            prev.map((item) => (item.id === exception.id ? { ...item, startDate: e.target.value } : item))
                          )
                        }
                      />
                      <span>to</span>
                      <Input
                        type="date"
                        value={exception.endDate}
                        className="h-8 text-xs"
                        onChange={(e) =>
                          setAvailabilityExceptions((prev) =>
                            prev.map((item) => (item.id === exception.id ? { ...item, endDate: e.target.value } : item))
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={exception.status}
                      onValueChange={(value) =>
                        setAvailabilityExceptions((prev) =>
                          prev.map((item) => (item.id === exception.id ? { ...item, status: value } : item))
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() =>
                        setAvailabilityExceptions((prev) => prev.filter((item) => item.id !== exception.id))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role & Permissions below */}
      <div className="mt-4">
        <Card className="card-admin">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Role & Permissions</CardTitle>
            </div>
            <div className="text-muted-foreground text-sm mt-1">
              Role permissions are fixed. Custom permissions can be toggled inline.
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Object.entries(permissionCategories).map(([categoryKey, category]) => {
              return (
                <div key={categoryKey} className="rounded-md border p-3">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">{category.label}</h4>
                  <div className="space-y-2 pl-3">
                    {category.permissions.map((permission) => {
                      const grantedByRole = memberRolePermissions.includes(permission.id);
                      const grantedCustom = customPermissions.includes(permission.id);
                      const checked = grantedByRole || grantedCustom;
                      return (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <Checkbox
                          checked={checked}
                          disabled={grantedByRole || !canManageRoles}
                          onCheckedChange={(value) => {
                            if (grantedByRole) return;
                            setCustomPermissions((prev) =>
                              value ? [...prev, permission.id] : prev.filter((id) => id !== permission.id)
                            );
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{permission.label}</span>
                            {grantedByRole ? (
                              <Badge color="light" className="text-xs">
                                <Lock className="mr-1 h-3 w-3" />
                                From Role
                              </Badge>
                            ) : grantedCustom ? (
                              <Badge color="light" className="text-xs border-amber-500 text-amber-700">
                                <Unlock className="mr-1 h-3 w-3" />
                                Custom
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Inspector Stats (if applicable) */}
      {member.isInspector && (
        <div className="mt-4">
          <Card className="card-admin">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Inspector Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-sm">Total Inspections</span>
                </div>
                <span className="text-lg font-bold">{member.inspections.toLocaleString()}</span>
              </div>
              {member.rating && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">Average Rating</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-bold">{member.rating}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
          </div>
        }
        right={
          <>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {headerActions}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Save after role/status updates to apply permissions.</p>
                <p>Use exceptions for one-off schedule overrides.</p>
                <p>Set inspector toggle only for billable field users.</p>
              </CardContent>
            </Card>
          </>
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <span className="font-semibold">{member.name}</span>. You can reactivate them later from the team list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
