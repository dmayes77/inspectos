"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ArrowLeft, Calendar, Plus, Edit, CheckCircle, XCircle, Clock } from "lucide-react";
import { getTeamMembers, type TeamMember } from "@/lib/mock/team";
import { mockAdminUser } from "@/lib/constants/mock-users";

const teamMembers = getTeamMembers();

const timeOffRequests = [
  {
    id: "1",
    type: "vacation",
    startDate: "2024-04-15",
    endDate: "2024-04-19",
    reason: "Family vacation to Colorado",
    status: "approved",
    requestedDate: "2024-03-10",
  },
  {
    id: "2",
    type: "sick_leave",
    startDate: "2024-03-05",
    endDate: "2024-03-06",
    reason: "Medical appointment and recovery",
    status: "approved",
    requestedDate: "2024-03-04",
  },
  {
    id: "3",
    type: "personal",
    startDate: "2024-05-20",
    endDate: "2024-05-20",
    reason: "Moving to new apartment",
    status: "pending",
    requestedDate: "2024-03-15",
  },
];

const recurringAvailability = {
  monday: { available: true, startTime: "08:00", endTime: "17:00" },
  tuesday: { available: true, startTime: "08:00", endTime: "17:00" },
  wednesday: { available: true, startTime: "08:00", endTime: "17:00" },
  thursday: { available: true, startTime: "08:00", endTime: "17:00" },
  friday: { available: true, startTime: "08:00", endTime: "17:00" },
  saturday: { available: false, startTime: "", endTime: "" },
  sunday: { available: false, startTime: "", endTime: "" },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-500 hover:bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-500">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "denied":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Denied
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500">
          <XCircle className="mr-1 h-3 w-3 text-amber-500" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "vacation":
      return "Vacation";
    case "sick_leave":
      return "Sick Leave";
    case "personal":
      return "Personal Day";
    default:
      return type;
  }
}

export default function TeamMemberAvailabilityPage() {
  const params = useParams();
  const member = teamMembers.find((m: TeamMember) => m.teamMemberId === params.id || m.id === params.id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [addTimeOffOpen, setAddTimeOffOpen] = useState(false);

  if (!member) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-semibold mb-2">Team Member Not Found</h1>
          <p className="text-muted-foreground mb-6">The team member you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/admin/team">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Team
            </Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  const handleCancelRequest = () => {
    if (selectedRequestId) {
      const idx = timeOffRequests.findIndex((r) => r.id === selectedRequestId);
      if (idx !== -1) {
        timeOffRequests[idx].status = "cancelled";
      }
    }
    setDeleteDialogOpen(false);
    setSelectedRequestId(null);
  };

  const handleApproveRequest = (requestId: string) => {
    // TODO: Implement API call to approve request
  };

  const handleDenyRequest = (requestId: string) => {
    // TODO: Implement API call to deny request
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/team/${member.teamMemberId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>

        <AdminPageHeader
          title={
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-xl text-primary">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{member.name}&apos;s Availability</h1>
                <p className="text-muted-foreground">Manage time off and working hours</p>
              </div>
            </div>
          }
          actions={
            <Button onClick={() => setAddTimeOffOpen(true)} className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Time Off
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{timeOffRequests.filter((r) => r.status === "approved").length}</div>
              <p className="text-sm text-muted-foreground">Approved Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{timeOffRequests.filter((r) => r.status === "pending").length}</div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">15</div>
              <p className="text-sm text-muted-foreground">Days Used (2024)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">10</div>
              <p className="text-sm text-muted-foreground">Days Remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Recurring Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Standard working hours for each day of the week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(recurringAvailability).map(([day, schedule]) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="font-medium capitalize">{day}</p>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {schedule.available ? (
                    <>
                      <Badge className="bg-green-500 hover:bg-green-500">Available</Badge>
                      <span className="text-sm text-muted-foreground">
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </>
                  ) : (
                    <Badge variant="outline">Not Available</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Time Off Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Time Off Requests</CardTitle>
            <CardDescription>View and manage all time off requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeOffRequests.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Time Off Requests</h3>
                <p className="text-sm text-muted-foreground">This team member hasn&apos;t submitted any time off requests yet.</p>
              </div>
            ) : (
              timeOffRequests.map((request) => (
                <div key={request.id} className="flex items-start justify-between border rounded-lg p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{getTypeLabel(request.type)}</h4>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {request.reason && <p className="pl-6">{request.reason}</p>}
                      <p className="pl-6 text-xs">Requested on {new Date(request.requestedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {request.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleApproveRequest(request.id)}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDenyRequest(request.id)}>
                          <XCircle className="mr-1 h-4 w-4" />
                          Deny
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 text-amber-500" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Time Off Request</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the time off request as cancelled. You can view cancelled requests in the list for record-keeping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRequest} className="bg-amber-500 hover:bg-amber-600 text-white">
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Time Off Dialog */}
      <AlertDialog open={addTimeOffOpen} onOpenChange={setAddTimeOffOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Time Off</AlertDialogTitle>
            <AlertDialogDescription>Create a new time off request for {member.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select defaultValue="vacation">
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick_leave">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Day</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input id="endDate" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" placeholder="Optional reason for time off..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select defaultValue="approved">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setAddTimeOffOpen(false)}>Add Time Off</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
