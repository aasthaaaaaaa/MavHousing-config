"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Wrench, AlertTriangle, CheckCircle2, Clock, Users,
  Search, ArrowUpRight, TrendingUp, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { getMaintenanceStatusClass, getPriorityClass } from "@/lib/status-colors";

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-emerald-500", MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500", EMERGENCY: "bg-red-500",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6", IN_PROGRESS: "#f59e0b",
  RESOLVED: "#22c55e", CLOSED: "#6b7280",
};

const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#ef4444",
];

interface MaintRequest {
  requestId: number;
  category: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  createdBy: { netId: string; fName: string; lName: string };
  assignedStaff?: { userId: number; fName: string; lName: string; netId?: string };
}

interface StaffMember {
  userId: number; fName: string; lName: string; netId: string;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const statusChartConfig = {
  count: { label: "Tickets", color: "#3b82f6" },
} satisfies ChartConfig;

const categoryChartConfig = {
  count: { label: "Tickets", color: "#8b5cf6" },
} satisfies ChartConfig;

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintRequest[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffSearch, setStaffSearch] = useState("");
  const [detailView, setDetailView] = useState<{ title: string; requests: MaintRequest[] } | null>(null);

  useEffect(() => {
    async function load() {
      const propertyQuery = user?.staffPosition === "RESIDENT_A" && user.assignedPropertyId ? `?propertyId=${user.assignedPropertyId}` : "";
      const [reqRes, staffRes] = await Promise.all([
        fetch(`http://localhost:3009/maintenance/requests${propertyQuery}`).then(r => r.json()).catch(() => []),
        fetch("http://localhost:3009/maintenance/staff").then(r => r.json()).catch(() => []),
      ]);
      setRequests(Array.isArray(reqRes) ? reqRes : []);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      setLoading(false);
    }
    load();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const open = requests.filter(r => r.status === "OPEN").length;
    const inProgress = requests.filter(r => r.status === "IN_PROGRESS").length;
    const resolved = requests.filter(r => r.status === "RESOLVED").length;
    const closed = requests.filter(r => r.status === "CLOSED").length;
    const emergency = requests.filter(r => r.priority === "EMERGENCY" && !["RESOLVED", "CLOSED"].includes(r.status)).length;
    return { open, inProgress, resolved, closed, emergency, total: requests.length };
  }, [requests]);

  // Status breakdown for bar chart
  const statusData = useMemo(() => [
    { status: "Open", count: stats.open, fill: STATUS_COLORS.OPEN },
    { status: "In Progress", count: stats.inProgress, fill: STATUS_COLORS.IN_PROGRESS },
    { status: "Resolved", count: stats.resolved, fill: STATUS_COLORS.RESOLVED },
    { status: "Closed", count: stats.closed, fill: STATUS_COLORS.CLOSED },
  ], [stats]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => { map[r.category] = (map[r.category] ?? 0) + 1; });
    return Object.entries(map)
      .map(([name, count], i) => ({ name, count, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  // Staff workload
  const staffLoad = useMemo(() => {
    const map: Record<number, { staff: StaffMember; open: number; inProgress: number; resolved: number; total: number }> = {};
    staffList.forEach(s => {
      map[s.userId] = { staff: s, open: 0, inProgress: 0, resolved: 0, total: 0 };
    });
    requests.forEach(r => {
      if (r.assignedStaff?.userId && map[r.assignedStaff.userId]) {
        const entry = map[r.assignedStaff.userId];
        entry.total++;
        if (r.status === "OPEN") entry.open++;
        else if (r.status === "IN_PROGRESS") entry.inProgress++;
        else if (r.status === "RESOLVED" || r.status === "CLOSED") entry.resolved++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [requests, staffList]);

  // Staff search
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staffLoad;
    const q = staffSearch.toLowerCase();
    return staffLoad.filter(sl =>
      sl.staff.netId.toLowerCase().includes(q) ||
      sl.staff.fName.toLowerCase().includes(q) ||
      sl.staff.lName.toLowerCase().includes(q)
    );
  }, [staffLoad, staffSearch]);

  // Tickets for searched staff
  const searchedStaffTickets = useMemo(() => {
    if (!staffSearch.trim()) return [];
    const staffIds = filteredStaff.map(s => s.staff.userId);
    return requests
      .filter(r => r.assignedStaff?.userId && staffIds.includes(r.assignedStaff.userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);
  }, [requests, filteredStaff, staffSearch]);

  // Unassigned tickets
  const unassigned = useMemo(() =>
    requests.filter(r => !r.assignedStaff && !["RESOLVED", "CLOSED"].includes(r.status)),
  [requests]);

  // Recent active tickets
  const recentActive = useMemo(() =>
    requests
      .filter(r => !["RESOLVED", "CLOSED"].includes(r.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8),
  [requests]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="h-9 w-72 bg-muted animate-pulse rounded-2xl" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="h-72 bg-muted animate-pulse rounded-2xl" />
          <div className="h-72 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: "100ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-2xl font-bold tracking-tight">
          Maintenance Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {user?.fName ? `Welcome, ${user.fName}. ` : ""}Ticket analytics and staff workload overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Open Tickets", value: stats.open, icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Resolved", value: stats.resolved + stats.closed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Emergency", value: stats.emergency, icon: AlertTriangle, color: stats.emergency > 0 ? "text-red-500" : "text-muted-foreground", bg: stats.emergency > 0 ? "bg-red-500/10" : "bg-muted" },
        ].map(({ label, value, icon: Icon, color, bg }, idx) => (
          <Card 
            key={label} 
            className="rounded-2xl py-0 gap-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both cursor-pointer hover:shadow-md transition-all" 
            style={{ animationDelay: `${80 + idx * 50}ms` }}
            onClick={() => {
              const statusMap: Record<string, string> = { "Open Tickets": "OPEN", "In Progress": "IN_PROGRESS", "Resolved": "RESOLVED", "Emergency": "EMERGENCY" };
              const targetStatus = statusMap[label];
              setDetailView({
                title: `${label} List`,
                requests: targetStatus === "EMERGENCY" 
                  ? requests.filter(r => r.priority === "EMERGENCY" && !["RESOLVED", "CLOSED"].includes(r.status))
                  : requests.filter(r => targetStatus === "RESOLVED" ? ["RESOLVED", "CLOSED"].includes(r.status) : r.status === targetStatus)
              });
            }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold tracking-tight leading-none ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "200ms" }}>
        {/* Status Distribution */}
        <Card className="lg:col-span-3 rounded-2xl py-0 gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Ticket Status Distribution</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{stats.total} total tickets</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-full">
                <BarChart3 className="h-3 w-3" /> Breakdown
              </div>
            </div>
            <ChartContainer config={statusChartConfig} className="h-52 w-full">
              <BarChart data={statusData} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="lg:col-span-2 rounded-2xl py-0 gap-0">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold tracking-tight">By Category</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Issue type distribution</p>
            </div>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-muted-foreground/60">No data</div>
            ) : (
              <div className="space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.fill }} />
                    <span className="text-sm flex-1 truncate">{cat.name}</span>
                    <span className="text-sm font-bold tabular-nums">{cat.count}</span>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(cat.count / stats.total) * 100}%`, backgroundColor: cat.fill }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Workload */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "300ms" }}>
        <Card className="rounded-2xl py-0 gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                  <Users className="h-4 w-4" /> Staff Workload
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ticket assignments per maintenance staff member
                </p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search staff by NetID or name..."
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {filteredStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No staff members found.</p>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStaff.map(sl => (
                  <div
                    key={sl.staff.userId}
                    className="p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => setDetailView({
                      title: `Tickets for ${sl.staff.fName} ${sl.staff.lName}`,
                      requests: requests.filter(r => r.assignedStaff?.userId === sl.staff.userId)
                    })}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {sl.staff.fName[0]}{sl.staff.lName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{sl.staff.fName} {sl.staff.lName}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{sl.staff.netId}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs tabular-nums">{sl.total} tickets</Badge>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { label: "Open", count: sl.open, color: "text-blue-600 bg-blue-500/10" },
                        { label: "Active", count: sl.inProgress, color: "text-amber-600 bg-amber-500/10" },
                        { label: "Done", count: sl.resolved, color: "text-emerald-600 bg-emerald-500/10" },
                      ].map(b => (
                        <span key={b.label} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.color}`}>
                          {b.count} {b.label}
                        </span>
                      ))}
                    </div>
                    {/* Load bar */}
                    {sl.total > 0 && (
                      <div className="mt-2.5 h-1.5 bg-muted rounded-full overflow-hidden flex">
                        {sl.open > 0 && <div className="h-full bg-blue-500" style={{ width: `${(sl.open / sl.total) * 100}%` }} />}
                        {sl.inProgress > 0 && <div className="h-full bg-amber-500" style={{ width: `${(sl.inProgress / sl.total) * 100}%` }} />}
                        {sl.resolved > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(sl.resolved / sl.total) * 100}%` }} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Searched staff's tickets */}
            {staffSearch.trim() && searchedStaffTickets.length > 0 && (
              <div className="mt-5 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Tickets assigned to filtered staff</h3>
                <div className="space-y-1">
                  {searchedStaffTickets.map(r => (
                    <Link
                      key={r.requestId}
                      href="/staff/maintenance"
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground">#{r.requestId}</span>
                        <span className="text-sm truncate">{r.category}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0 rounded-full border ${getPriorityClass(r.priority)}`}>{r.priority}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`${getMaintenanceStatusClass(r.status)} text-[10px] rounded-full`}>
                          {r.status.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Unassigned + Recent Active */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "400ms" }}>
        {/* Unassigned */}
        <Card className="rounded-2xl py-0 gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Unassigned Tickets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{unassigned.length} ticket{unassigned.length !== 1 ? "s" : ""} need assignment</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 rounded-full" asChild>
                <Link href="/staff/maintenance">Manage <ArrowUpRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            {unassigned.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> All tickets assigned!
              </div>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {unassigned.slice(0, 10).map(r => (
                  <div key={r.requestId} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.category}</p>
                      <p className="text-[11px] text-muted-foreground">{r.createdBy.fName} {r.createdBy.lName} · {fmtDate(r.createdAt)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ml-2 ${getPriorityClass(r.priority)}`}>
                      {r.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Active */}
        <Card className="rounded-2xl py-0 gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Recent Active Tickets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Latest open and in-progress tickets</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 rounded-full" asChild>
                <Link href="/staff/maintenance">View all <ArrowUpRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            {recentActive.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> No active tickets!
              </div>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {recentActive.map(r => (
                  <div key={r.requestId} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.category}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.assignedStaff ? `${r.assignedStaff.fName} ${r.assignedStaff.lName}` : "Unassigned"} · {fmtDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[r.priority] ?? "bg-muted-foreground"}`} />
                      <Badge variant="outline" className={`${getMaintenanceStatusClass(r.status)} text-[10px] rounded-full`}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detailView} onOpenChange={(open) => !open && setDetailView(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailView?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailView?.requests.map((r) => (
                  <TableRow key={r.requestId}>
                    <TableCell className="font-mono text-xs">#{r.requestId}</TableCell>
                    <TableCell className="text-sm font-medium">{r.category}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityClass(r.priority)}`}>
                        {r.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getMaintenanceStatusClass(r.status)} text-[10px] rounded-full`}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {detailView?.requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No tickets found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
