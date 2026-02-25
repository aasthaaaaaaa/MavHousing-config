"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis,
} from "recharts";
import {
  FileText, Wrench, Building2, TrendingUp, ChevronRight, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getApplicationStatusClass, getMaintenanceStatusClass } from "@/lib/status-colors";

const PRIORITY_DOT: Record<string, string> = {
  LOW:       "bg-emerald-500",
  MEDIUM:    "bg-amber-500",
  HIGH:      "bg-orange-500",
  EMERGENCY: "bg-red-500",
};

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

const REVENUE_COLOR = "#22c55e";
const MAINT_COLOR = "#3b82f6";

const revenueChartConfig = {
  revenue: { label: "Revenue", color: REVENUE_COLOR },
} satisfies ChartConfig;

const maintChartConfig = {
  count: { label: "Tickets", color: MAINT_COLOR },
} satisfies ChartConfig;

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}



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

const STAT_CARDS = [
  {
    key: "apps",
    label: "Pending Applications",
    icon: FileText,
    iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
    iconColor: "text-orange-500",
    valueFn: (s: Stats) => s.pendingApplications,
    subFn: (s: Stats) => `of ${s.totalApplications} total`,
    accentFn: (s: Stats) => s.pendingApplications > 0 ? "text-orange-600 dark:text-orange-400" : "",
  },
  {
    key: "maint",
    label: "Open Tickets",
    icon: Wrench,
    iconBg: "bg-yellow-500/10 dark:bg-yellow-500/20",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    valueFn: (s: Stats) => s.openMaintenance,
    subFn: (s: Stats) => `of ${s.totalMaintenance} requests`,
    accentFn: (s: Stats) => s.openMaintenance > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "leases",
    label: "Active Leases",
    icon: Building2,
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-500",
    valueFn: (s: Stats) => s.activeLeases,
    subFn: () => "current residents",
    accentFn: () => "",
  },
  {
    key: "revenue",
    label: "Total Revenue",
    icon: TrendingUp,
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500",
    valueFn: (s: Stats) => fmt(s.totalRevenue),
    subFn: () => "all time collected",
    accentFn: () => "text-emerald-600 dark:text-emerald-400",
  },
];



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
    return (
      <div className="flex flex-1 flex-col gap-5 p-6 lg:p-8">
        <div className="space-y-2">
          <div className="h-9 w-72 bg-muted/60 animate-pulse rounded-2xl" />
          <div className="h-4 w-56 bg-muted/40 animate-pulse rounded-xl" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-muted/50 animate-pulse rounded-2xl"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 h-72 bg-muted/50 animate-pulse rounded-2xl" />
          <div className="lg:col-span-2 h-72 bg-muted/50 animate-pulse rounded-2xl" style={{ animationDelay: "150ms" }} />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-muted/50 animate-pulse rounded-2xl"
              style={{ animationDelay: `${200 + i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-6 lg:p-8">

      <div
        className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Welcome back{user?.fName ? `, ${user.fName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 tracking-wide">
          Here&apos;s an overview of MavHousing operations.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, iconBg, iconColor, valueFn, subFn, accentFn }, idx) => (
          <Card
            key={key}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 py-0 gap-0"
            style={{ animationDelay: `${80 + idx * 60}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold tracking-tight tabular-nums ${accentFn(stats!)}`}>
                {valueFn(stats!)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{subFn(stats!)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        <Card
          className="lg:col-span-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl py-0 gap-0"
          style={{ animationDelay: "320ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Revenue Over Time</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Last 6 months of payments collected</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                Revenue
              </div>
            </div>
            <div>
            {stats!.revenueByMonth.length < 2 ? (
              <div className="flex items-center justify-center h-52 text-sm text-muted-foreground/60">
                Not enough data to display chart
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-56 w-full">
                <AreaChart data={stats!.revenueByMonth} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={REVENUE_COLOR} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={REVENUE_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={REVENUE_COLOR}
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={{ r: 4, fill: REVENUE_COLOR, strokeWidth: 2, stroke: "var(--color-background)" }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--color-background)" }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl py-0 gap-0"
          style={{ animationDelay: "400ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Maintenance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{stats!.totalMaintenance} total tickets</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-1 rounded-full">
                <Wrench className="h-3 w-3" />
                Status
              </div>
            </div>
            <div>
            {stats!.maintenanceByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-muted-foreground/60">
                No maintenance data
              </div>
            ) : (
              <ChartContainer config={maintChartConfig} className="h-56 w-full">
                <BarChart data={stats!.maintenanceByStatus} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={MAINT_COLOR} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

        <Card
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl py-0 gap-0"
          style={{ animationDelay: "480ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Recent Applications</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats!.pendingApplications} need review
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 rounded-full text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/staff/applications">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            {stats!.recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">No applications yet.</p>
            ) : (
              <div className="space-y-0.5">
                {stats!.recentApplications.map((app) => (
                  <div
                    key={app.appId}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{app.user?.fName} {app.user?.lName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{app.user?.netId} · {fmtDate(app.submissionDate)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getApplicationStatusClass(app.status)} text-xs rounded-full px-2.5 shrink-0 ml-2`}
                    >
                      {app.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl py-0 gap-0"
          style={{ animationDelay: "550ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Maintenance Tickets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats!.openMaintenance} open
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 rounded-full text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/staff/maintenance">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            {stats!.recentMaintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">No tickets yet.</p>
            ) : (
              <div className="space-y-0.5">
                {stats!.recentMaintenance.map((req) => (
                  <div
                    key={req.requestId}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{req.category}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{req.createdBy?.fName} {req.createdBy?.lName} · {fmtDate(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[req.priority] ?? "bg-muted-foreground"}`} />
                        <span className="text-[11px] text-muted-foreground">
                          {req.priority.charAt(0) + req.priority.slice(1).toLowerCase()}
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className={`${getMaintenanceStatusClass(req.status)} text-xs rounded-full px-2.5`}
                      >
                        {req.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl py-0 gap-0"
          style={{ animationDelay: "620ms" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Recent Payments</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmt(stats!.totalRevenue)} collected
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 rounded-full text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/staff/payments">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            {stats!.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">No payments yet.</p>
            ) : (
              <div className="space-y-0.5">
                {stats!.recentPayments.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.fName} {p.lName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.netId} · {fmtDate(p.transactionDate)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold tabular-nums">{fmt(parseFloat(p.amountPaid))}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.method?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
