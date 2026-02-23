"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Home, Plus, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { inspectionStatusBadge } from "@/lib/admin/badges";
import { formatDateShort, formatTime12 } from "@inspectos/shared/utils/dates";

import { useTeamMembers } from "@/hooks/use-team";

const upcomingInspections = [
  {
    id: "1",
    propertyAddress: "456 Oak Street",
    city: "Austin",
    state: "TX",
    date: "2024-03-20",
    time: "9:00 AM",
    type: "Residential - Full",
    status: "scheduled",
    client: "John & Mary Smith",
  },
  {
    id: "2",
    propertyAddress: "789 Maple Drive",
    city: "Round Rock",
    state: "TX",
    date: "2024-03-20",
    time: "2:00 PM",
    type: "Residential - Full",
    status: "scheduled",
    client: "Robert Johnson",
  },
  {
    id: "3",
    propertyAddress: "123 Elm Avenue",
    city: "Cedar Park",
    state: "TX",
    date: "2024-03-21",
    time: "10:00 AM",
    type: "Pre-listing",
    status: "scheduled",
    client: "Sarah Williams",
  },
  {
    id: "4",
    propertyAddress: "321 Pine Road",
    city: "Austin",
    state: "TX",
    date: "2024-03-22",
    time: "9:00 AM",
    type: "Commercial",
    status: "scheduled",
    client: "ABC Properties LLC",
  },
];

const pastInspections = [
  {
    id: "5",
    propertyAddress: "567 Cedar Lane",
    city: "Austin",
    state: "TX",
    date: "2024-03-18",
    time: "9:00 AM",
    type: "Residential - Full",
    status: "completed",
    client: "Michael Brown",
  },
  {
    id: "6",
    propertyAddress: "890 Birch Street",
    city: "Austin",
    state: "TX",
    date: "2024-03-17",
    time: "1:00 PM",
    type: "Residential - Full",
    status: "completed",
    client: "Jennifer Davis",
  },
  {
    id: "7",
    propertyAddress: "234 Walnut Drive",
    city: "Round Rock",
    state: "TX",
    date: "2024-03-16",
    time: "10:00 AM",
    type: "Pre-listing",
    status: "completed",
    client: "David Martinez",
  },
];


export default function TeamMemberSchedulePage() {
  const params = useParams();
  const { data: teamMembers = [] } = useTeamMembers();
  const rawMemberId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const memberId = rawMemberId ? String(rawMemberId) : "";
  const member = teamMembers.find((m) => m.memberId.toLowerCase() === memberId.toLowerCase());

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-semibold mb-2">Team Member Not Found</h1>
        <p className="text-muted-foreground mb-6">The team member you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {/* Back Button */}

      <AdminPageHeader
        title={
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:text-left">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-xl text-primary">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{member.name}&apos;s Schedule</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">View and manage inspection assignments</p>
            </div>
          </div>
        }
        actions={
          <Button size="sm" className="btn-admin sm:w-auto" asChild>
            <Link href="/inspections/new">
              <Plus className="mr-2 h-4 w-4" />
              Assign Inspection
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 items-stretch gap-2 lg:grid-cols-4">
        <Card className="card-admin h-full">
          <CardContent className="flex h-full flex-col gap-1 pt-4">
            <div className="text-xl font-bold sm:text-2xl">{upcomingInspections.length}</div>
            <p className="min-h-[2rem] text-xs leading-tight text-muted-foreground sm:text-sm">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="card-admin h-full">
          <CardContent className="flex h-full flex-col gap-1 pt-4">
            <div className="text-xl font-bold sm:text-2xl">{pastInspections.length}</div>
            <p className="min-h-[2rem] text-xs leading-tight text-muted-foreground sm:text-sm">Completed This Week</p>
          </CardContent>
        </Card>
        <Card className="card-admin h-full">
          <CardContent className="flex h-full flex-col gap-1 pt-4">
            <div className="text-xl font-bold sm:text-2xl">32</div>
            <p className="min-h-[2rem] text-xs leading-tight text-muted-foreground sm:text-sm">This Month</p>
          </CardContent>
        </Card>
        <Card className="card-admin h-full">
          <CardContent className="flex h-full flex-col gap-1 pt-4">
            <div className="text-xl font-bold sm:text-2xl">98%</div>
            <p className="min-h-[2rem] text-xs leading-tight text-muted-foreground sm:text-sm">Completion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-3">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:justify-start">
          <TabsTrigger value="upcoming">Upcoming ({upcomingInspections.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastInspections.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* Upcoming Inspections */}
        <TabsContent value="upcoming" className="space-y-2">
          {upcomingInspections.map((inspection) => (
            <Card key={inspection.id} className="card-admin transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{inspection.propertyAddress}</CardTitle>
                      {inspectionStatusBadge(inspection.status)}
                    </div>
                    <CardDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateShort(inspection.date)} at {formatTime12(inspection.time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {inspection.city}, {inspection.state}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{inspection.type}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Client: {inspection.client}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                    <Link href={`/inspections/${inspection.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Past Inspections */}
        <TabsContent value="past" className="space-y-2">
          {pastInspections.map((inspection) => (
            <Card key={inspection.id} className="card-admin transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{inspection.propertyAddress}</CardTitle>
                      {inspectionStatusBadge(inspection.status)}
                    </div>
                    <CardDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateShort(inspection.date)} at {formatTime12(inspection.time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {inspection.city}, {inspection.state}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{inspection.type}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Client: {inspection.client}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                    <Link href={`/inspections/${inspection.id}`}>View Report</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card className="card-admin">
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Full calendar integration coming soon</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Calendar View</h3>
                <p className="text-sm text-muted-foreground max-w-md">Interactive calendar view with drag-and-drop scheduling will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
