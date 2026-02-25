"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoleBadgeClass } from "@/lib/role-colors";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Users, Building2, FileText, CreditCard, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SystemStats {
  totalUsers: number;
  staffCount: number;
  studentCount: number;
  totalApplications: number;
  pendingApplications: number;
  totalLeases: number;
  activeLeases: number;
  totalMaintenance: number;
  openMaintenance: number;
  totalRevenue: number;
  usersByRole: { role: string; count: number }[];
  appsByStatus: { status: string; count: number }[];
  recentUsers: { userId: number; fName: string; lName: string; netId: string; email: string; role: string; createdAt?: string }[];
}

const userChartConfig = {
  count: { label: "Users", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const appChartConfig = {
  count: { label: "Applications", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const PIE_COLORS = [
  "#3b82f6", // blue-500 for students
  "#f59e0b", // amber-500 for admin
  "#10b981", // emerald-500 for staff
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
];

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Students", STAFF: "Staff", ADMIN: "Admins",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const token = Cookies.get('access_token');
      const [usersRes, appsRes, leasesRes, maintRes, paymentsRes] = await Promise.all([
        fetch("http://localhost:3009/auth/get-all", {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("http://localhost:3009/housing/applications").then(r => r.json()).catch(() => []),
        fetch("http://localhost:3009/lease/leases").then(r => r.json()).catch(() => []),
        fetch("http://localhost:3009/maintenance/requests").then(r => r.json()).catch(() => []),
        fetch("http://localhost:3009/payment/all").then(r => r.json()).catch(() => []),
      ]);

      const users = Array.isArray(usersRes) ? usersRes : [];
      const apps = Array.isArray(appsRes) ? appsRes : [];
      const leases = Array.isArray(leasesRes) ? leasesRes : [];
      const maint = Array.isArray(maintRes) ? maintRes : [];
      const payments = Array.isArray(paymentsRes) ? paymentsRes : [];

      // Group users by role (normalize case)
      const roleMap: Record<string, number> = {};
      users.forEach((u: any) => { 
        const r = u.role?.toUpperCase() || 'UNKNOWN';
        roleMap[r] = (roleMap[r] ?? 0) + 1; 
      });

      // Group apps by status
      const appStatusMap: Record<string, number> = {};
      apps.forEach((a: any) => { appStatusMap[a.status] = (appStatusMap[a.status] ?? 0) + 1; });

      setStats({
        totalUsers: users.length,
        staffCount: users.filter((u: any) => u.role?.toUpperCase() === "STAFF").length,
        studentCount: users.filter((u: any) => u.role?.toUpperCase() === "STUDENT").length,
        totalApplications: apps.length,
        pendingApplications: apps.filter((a: any) => ["SUBMITTED", "UNDER_REVIEW"].includes(a.status)).length,
        totalLeases: leases.length,
        activeLeases: leases.filter((l: any) => ["ACTIVE", "SIGNED"].includes(l.status)).length,
        totalMaintenance: maint.length,
        openMaintenance: maint.filter((m: any) => m.status === "OPEN").length,
        totalRevenue: payments.filter((p: any) => p.isSuccessful).reduce((s: number, p: any) => s + parseFloat(p.amountPaid), 0),
        usersByRole: Object.entries(roleMap).map(([role, count]) => ({ role: ROLE_LABELS[role] ?? role, count })),
        appsByStatus: Object.entries(appStatusMap).map(([status, count]) => ({ status: status.replace("_", " "), count })),
        recentUsers: users.slice(-6).reverse(),
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-12 w-64 bg-muted animate-pulse rounded-xl" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="h-56 bg-muted animate-pulse rounded-2xl" />
          <div className="h-56 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: "120ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">

      <div
        className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">System-wide overview of MavHousing.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: stats!.totalUsers, sub: `${stats!.staffCount} staff · ${stats!.studentCount} students`, icon: Users },
          { label: "Applications", value: stats!.totalApplications, sub: `${stats!.pendingApplications} pending`, icon: FileText, accent: stats!.pendingApplications > 0 ? "text-orange-500" : undefined },
          { label: "Active Leases", value: stats!.activeLeases, sub: `of ${stats!.totalLeases} total`, icon: Building2 },
          { label: "Total Revenue", value: fmt(stats!.totalRevenue), sub: "all time", icon: CreditCard },
        ].map(({ label, value, sub, icon: Icon, accent }, idx) => (
          <Card
            key={label}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ animationDelay: `${80 + idx * 70}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold tracking-tight ${accent ?? ""}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card
          className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl transition-all hover:shadow-md"
          style={{ animationDelay: "360ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Applications by Status</CardTitle>
            <CardDescription>{stats!.totalApplications} total applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats!.appsByStatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No application data</div>
            ) : (
              <ChartContainer config={appChartConfig} className="h-52 w-full">
                <BarChart data={stats!.appsByStatus} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card
          className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl transition-all hover:shadow-md"
          style={{ animationDelay: "430ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Users by Role</CardTitle>
            <CardDescription>{stats!.totalUsers} registered users</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 pt-2">
            {stats!.usersByRole.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No user data</div>
            ) : (
              <>
                <ChartContainer config={userChartConfig} className="w-[140px] h-[140px]">
                  <PieChart>
                    <Pie data={stats!.usersByRole} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={62} innerRadius={28} strokeWidth={2}>
                      {stats!.usersByRole.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="w-full space-y-2">
                  {stats!.usersByRole.map((r, i) => (
                    <div key={r.role} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm text-muted-foreground flex-1">{r.role}</span>
                      <span className="text-sm font-semibold tabular-nums">{r.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both flex flex-col gap-3"
          style={{ animationDelay: "500ms" }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Quick Actions</p>
          {[
            { label: "User Management", desc: "Manage staff & student accounts", href: "/admin/users", icon: Users, color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
            { label: "Role & Permissions", desc: "Configure access levels", href: "#", icon: ShieldCheck, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" },
          ].map(action => (
            <Card key={action.label} className="rounded-2xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:bg-muted/30">
              <CardContent className="p-4">
                <Link href={action.href} className="flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{action.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card
          className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl transition-all hover:shadow-md"
          style={{ animationDelay: "560ms" }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Users</CardTitle>
                <CardDescription>Latest accounts registered</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-0.5 rounded-lg" asChild>
                <Link href="/admin/users">View all <ChevronRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats!.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">No users yet.</p>
            ) : (
              <div>
                {stats!.recentUsers.map((u, i) => (
                  <div key={u.netId} className="transition-colors hover:bg-muted/40">
                    {i > 0 && <Separator />}
                    <div className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-background">
                          {u.fName?.[0]}{u.lName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{u.fName} {u.lName}</p>
                          <p className="text-xs text-muted-foreground">{u.netId} · {u.email}</p>
                        </div>
                      </div>
                      <Badge className={`${getRoleBadgeClass(u.role)} border font-medium capitalize text-xs rounded-full px-2.5`} variant="outline">
                        {u.role}
                      </Badge>
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
