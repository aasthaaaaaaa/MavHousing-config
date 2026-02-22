"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Users, Building2, FileText, Wrench, CreditCard, ShieldCheck, ChevronRight } from "lucide-react";
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
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">System-wide overview of MavHousing.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: stats!.totalUsers, sub: `${stats!.staffCount} staff · ${stats!.studentCount} students`, icon: Users },
          { label: "Applications", value: stats!.totalApplications, sub: `${stats!.pendingApplications} pending`, icon: FileText, accent: stats!.pendingApplications > 0 ? "text-orange-500" : undefined },
          { label: "Active Leases", value: stats!.activeLeases, sub: `of ${stats!.totalLeases} total`, icon: Building2 },
          { label: "Total Revenue", value: fmt(stats!.totalRevenue), sub: "all time", icon: CreditCard },
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
        {/* Users by Role — Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by Role</CardTitle>
            <CardDescription>{stats!.totalUsers} total registered users</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {stats!.usersByRole.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No user data</div>
            ) : (
              <div className="flex items-center gap-6">
                <ChartContainer config={userChartConfig} className="w-[160px] h-[160px]">
                  <PieChart>
                    <Pie data={stats!.usersByRole} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={70} strokeWidth={2}>
                      {stats!.usersByRole.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2">
                  {stats!.usersByRole.map((r, i) => (
                    <div key={r.role} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm">{r.role}</span>
                      <span className="text-sm font-semibold ml-auto">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications by Status — Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Status</CardTitle>
            <CardDescription>{stats!.totalApplications} total applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats!.appsByStatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No application data</div>
            ) : (
              <ChartContainer config={appChartConfig} className="h-48 w-full">
                <BarChart data={stats!.appsByStatus} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row — Quick actions + Recent users */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
          {[
            { label: "User Management", desc: "Create, edit, and manage staff & student accounts", href: "/admin/users", icon: Users, color: "text-purple-600" },
            { label: "Role & Permissions", desc: "Configure access levels and role assignments", href: "#", icon: ShieldCheck, color: "text-indigo-600" },
          ].map(action => (
            <Card key={action.label} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <Link href={action.href} className="flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <action.icon className={`h-5 w-5 flex-shrink-0 ${action.color}`} />
                    <div>
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent users (colspan 2) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Users</CardTitle>
                <CardDescription>Latest accounts registered</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-0.5" asChild>
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
                  <div key={u.netId}>
                    {i > 0 && <Separator />}
                    <div className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {u.fName?.[0]}{u.lName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.fName} {u.lName}</p>
                          <p className="text-xs text-muted-foreground">{u.netId} · {u.email}</p>
                        </div>
                      </div>
                      <Badge variant={u.role === "ADMIN" ? "default" : u.role === "STAFF" ? "secondary" : "outline"} className="text-xs">
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
