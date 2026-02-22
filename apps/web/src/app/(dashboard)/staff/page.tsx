"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer
} from "recharts";
import {
  FileText, Wrench, Building2, TrendingUp, ChevronRight
} from "lucide-react";
import Link from "next/link";

interface Stats {
  pendingApplications: number;
  totalApplications: number;
  openMaintenance: number;
  totalMaintenance: number;
  activeLeases: number;
  totalRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  maintenanceByStatus: { status: string; count: number }[];
  recentApplications: { appId: number; status: string; submissionDate: string; user: { fName: string; lName: string; netId: string } }[];
  recentMaintenance: { requestId: number; category: string; priority: string; status: string; createdAt: string; createdBy: { fName: string; lName: string } }[];
  recentPayments: { fName: string; lName: string; netId: string; amountPaid: string; transactionDate: string; method: string }[];
}

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const maintChartConfig = {
  count: { label: "Tickets", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-green-600", MEDIUM: "text-yellow-600",
  HIGH: "text-orange-600", EMERGENCY: "text-red-600",
};

function groupByMonth(payments: any[]): { month: string; revenue: number }[] {
  const map: Record<string, number> = {};
  payments.forEach(p => {
    if (!p.isSuccessful) return;
    const d = new Date(p.transactionDate);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    map[key] = (map[key] ?? 0) + parseFloat(p.amountPaid);
  });
  return Object.entries(map)
    .map(([month, revenue]) => ({ month, revenue }))
    .slice(-6);
}

function groupMaintByStatus(maint: any[]): { status: string; count: number }[] {
  const map: Record<string, number> = {};
  maint.forEach(m => { map[m.status] = (map[m.status] ?? 0) + 1; });
  return Object.entries(map).map(([status, count]) => ({
    status: status.replace("_", " "),
    count,
  }));
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const [apps, maint, payments, leases] = await Promise.all([
        fetch("http://localhost:3009/housing/applications").then(r => r.json()).catch(() => []),
        fetch("http://localhost:3009/maintenance/requests").then(r => r.json()).catch(() => []),
        fetch("http://localhost:3009/payment/all").then(r => r.json()).catch(() => []),
        fetch("http://localhost:3009/lease/leases").then(r => r.json()).catch(() => []),
      ]);
      const a = Array.isArray(apps) ? apps : [];
      const m = Array.isArray(maint) ? maint : [];
      const p = Array.isArray(payments) ? payments : [];
      const l = Array.isArray(leases) ? leases : [];

      setStats({
        pendingApplications: a.filter((x: any) => ["SUBMITTED", "UNDER_REVIEW"].includes(x.status)).length,
        totalApplications: a.length,
        openMaintenance: m.filter((x: any) => x.status === "OPEN").length,
        totalMaintenance: m.length,
        activeLeases: l.filter((x: any) => ["ACTIVE", "SIGNED"].includes(x.status)).length,
        totalRevenue: p.filter((x: any) => x.isSuccessful).reduce((s: number, x: any) => s + parseFloat(x.amountPaid), 0),
        revenueByMonth: groupByMonth(p),
        maintenanceByStatus: groupMaintByStatus(m),
        recentApplications: a.slice(0, 5),
        recentMaintenance: m.slice(0, 5),
        recentPayments: p.slice(0, 5).map((x: any) => ({
          fName: x.lease?.user?.fName, lName: x.lease?.user?.lName,
          netId: x.lease?.user?.netId, amountPaid: x.amountPaid,
          transactionDate: x.transactionDate, method: x.method,
        })),
      });
    } finally { setLoading(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.fName ? `, ${user.fName}` : ""}!
        </h1>
        <p className="text-muted-foreground">Here&apos;s an overview of MavHousing operations.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending Applications", value: stats!.pendingApplications, sub: `of ${stats!.totalApplications} total`, icon: FileText, accent: stats!.pendingApplications > 0 ? "text-orange-500" : undefined },
          { label: "Open Tickets", value: stats!.openMaintenance, sub: `of ${stats!.totalMaintenance} requests`, icon: Wrench, accent: stats!.openMaintenance > 0 ? "text-yellow-500" : "text-green-500" },
          { label: "Active Leases", value: stats!.activeLeases, sub: "current residents", icon: Building2 },
          { label: "Total Revenue", value: fmt(stats!.totalRevenue), sub: "all time collected", icon: TrendingUp },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${accent ?? ""}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">

        {/* Revenue area chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Over Time</CardTitle>
            <CardDescription>Last 6 months of payments collected</CardDescription>
          </CardHeader>
          <CardContent>
            {stats!.revenueByMonth.length < 2 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                Not enough data to display chart
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-48 w-full">
                <AreaChart data={stats!.revenueByMonth} margin={{ left: -20, right: 4 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Maintenance by status bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance by Status</CardTitle>
            <CardDescription>Breakdown of all {stats!.totalMaintenance} tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {stats!.maintenanceByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                No maintenance data
              </div>
            ) : (
              <ChartContainer config={maintChartConfig} className="h-48 w-full">
                <BarChart data={stats!.maintenanceByStatus} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Detail rows */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

        {/* Recent Applications */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Applications</CardTitle>
                <CardDescription>{stats!.pendingApplications} need review</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-0.5" asChild>
                <Link href="/staff/applications">View all <ChevronRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats!.recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">No applications yet.</p>
            ) : stats!.recentApplications.map((app, i) => (
              <div key={app.appId}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{app.user?.fName} {app.user?.lName}</p>
                    <p className="text-xs text-muted-foreground">{app.user?.netId} · {fmtDate(app.submissionDate)}</p>
                  </div>
                  <Badge variant={app.status === "APPROVED" ? "default" : app.status === "REJECTED" ? "destructive" : "secondary"} className="text-xs">
                    {app.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Maintenance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Maintenance Tickets</CardTitle>
                <CardDescription>{stats!.openMaintenance} open</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-0.5" asChild>
                <Link href="/staff/maintenance">View all <ChevronRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats!.recentMaintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">No tickets yet.</p>
            ) : stats!.recentMaintenance.map((req, i) => (
              <div key={req.requestId}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{req.category}</p>
                    <p className="text-xs text-muted-foreground">{req.createdBy?.fName} {req.createdBy?.lName} · {fmtDate(req.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${PRIORITY_COLOR[req.priority] ?? ""}`}>{req.priority}</span>
                    <Badge variant={req.status === "RESOLVED" ? "outline" : req.status === "IN_PROGRESS" ? "default" : "secondary"} className="text-xs">
                      {req.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Payments</CardTitle>
                <CardDescription>{fmt(stats!.totalRevenue)} collected</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-0.5" asChild>
                <Link href="/staff/payments">View all <ChevronRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats!.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">No payments yet.</p>
            ) : stats!.recentPayments.map((p, i) => (
              <div key={i}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.fName} {p.lName}</p>
                    <p className="text-xs text-muted-foreground">{p.netId} · {fmtDate(p.transactionDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(parseFloat(p.amountPaid))}</p>
                    <p className="text-xs text-muted-foreground">{p.method?.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
