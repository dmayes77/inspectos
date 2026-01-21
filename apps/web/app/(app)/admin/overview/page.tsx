import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, DollarSign, Users, TrendingUp, Calendar, Clock, MapPin, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { mockAdminUser } from "@/lib/constants/mock-users";
import { inspectionStatusBadge } from "@/lib/admin/badges";
import { can } from "@/lib/admin/permissions";
import { formatTime12 } from "@/lib/utils/dates";
import { getServiceNamesByIds } from "@/lib/utils/services";

const stats = [
  {
    title: "Inspections This Week",
    value: "24",
    change: "+12%",
    changeType: "positive" as const,
    icon: ClipboardList,
  },
  {
    title: "Revenue This Week",
    value: "$9,450",
    change: "+8%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Active Clients",
    value: "156",
    change: "+3",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Avg. Completion Time",
    value: "2.4h",
    change: "-15min",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

import { inspections } from "@/lib/mock/inspections";
import { services } from "@/lib/mock/services";

// Filter today's inspections from the real mock data
const today = new Date().toISOString().slice(0, 10);
const todayInspections = inspections.filter((i) => i.date === today);

const recentActivity = [
  {
    id: 1,
    action: "Report delivered",
    details: "123 Oak Street - John Smith",
    time: "2 hours ago",
  },
  {
    id: 2,
    action: "Payment received",
    details: "$425.00 from Sarah Chen",
    time: "3 hours ago",
  },
  {
    id: 3,
    action: "New booking",
    details: "Full inspection - 789 Cedar Lane",
    time: "5 hours ago",
  },
  {
    id: 4,
    action: "Inspection completed",
    details: "321 Pine Road - James Wilson",
    time: "6 hours ago",
  },
];


export default function OverviewPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Dashboard"
          description={`Welcome back, ${mockAdminUser.name.split(" ")[0]}. Here's what's happening today.`}
          actions={
            can(mockAdminUser.role, "create_inspections") ? (
            <Button asChild className="sm:w-auto">
              <Link href="/admin/inspections/new">
                <Plus className="mr-2 h-4 w-4" />
                New Inspection
              </Link>
            </Button>
            ) : null
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold sm:text-2xl">{stat.value}</div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  <span className={stat.changeType === "positive" ? "text-green-600" : "text-red-600"}>{stat.change}</span> from last week
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Inspections - Takes 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today&apos;s Inspections
                </CardTitle>
                <CardDescription>{todayInspections.length} inspections scheduled for today</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/inspections">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayInspections.map((inspection) => (
                  <div key={inspection.inspectionId} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatTime12(inspection.time)}</span>
                          {inspectionStatusBadge(inspection.status)}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {inspection.address}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{inspection.inspector}</span>
                          <Badge variant="outline" className="text-xs">
                            {inspection.types && inspection.types.length > 0 ? getServiceNamesByIds(inspection.types, services).join(", ") : "N/A"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/inspections/${inspection.inspectionId}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Awaiting review and delivery</p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/admin/inspections?status=pending_report">View pending →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,150</div>
              <p className="text-xs text-muted-foreground">5 invoices unpaid</p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/admin/settings/billing">View invoices →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Team Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2/3</div>
              <p className="text-xs text-muted-foreground">Inspectors available tomorrow</p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/admin/team">Manage team →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
