"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench } from "lucide-react";

interface MaintenanceRequest {
  requestId: number;
  category: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  createdBy: { netId: string; fName: string; lName: string; email: string };
  assignedStaff?: { userId: number; fName: string; lName: string };
  lease?: { unit?: { unitNumber: string; property: { name: string; address: string } }; room?: { roomLetter: string } };
}

interface StaffMember { userId: number; fName: string; lName: string; netId: string }

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "secondary",
  IN_PROGRESS: "default",
  RESOLVED: "outline",
  CLOSED: "outline",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  EMERGENCY: "bg-red-100 text-red-800",
};

const CATEGORY_ICONS: Record<string, string> = {
  PLUMBING: "🔧", HVAC: "❄️", ELECTRICAL: "⚡",
  INTERNET: "🌐", APPLIANCE: "🍳", STRUCTURAL: "🏗️", OTHER: "📋",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getLocation(r: MaintenanceRequest) {
  if (!r.lease?.unit) return "—";
  return `${r.lease.unit.property.name} / Unit ${r.lease.unit.unitNumber}${r.lease.room ? ` / Rm ${r.lease.room.roomLetter}` : ""}`;
}

export default function StaffMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [reqRes, staffRes] = await Promise.all([
      fetch("http://localhost:3009/maintenance/requests"),
      fetch("http://localhost:3009/maintenance/staff"),
    ]);
    setRequests(await reqRes.json());
    setStaffList(await staffRes.json());
    setLoading(false);
  }

  async function handleStatusChange(requestId: number, status: string) {
    setUpdating(requestId);
    try {
      await fetch(`http://localhost:3009/maintenance/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status } : r));
    } finally {
      setUpdating(null);
    }
  }

  async function handleAssignStaff(requestId: number, staffId: number) {
    setUpdating(requestId);
    try {
      await fetch(`http://localhost:3009/maintenance/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS", staffId }),
      });
      const assigned = staffList.find(s => s.userId === staffId);
      setRequests(prev => prev.map(r =>
        r.requestId === requestId
          ? { ...r, status: "IN_PROGRESS", assignedStaff: assigned ? { userId: assigned.userId, fName: assigned.fName, lName: assigned.lName } : r.assignedStaff }
          : r
      ));
    } finally {
      setUpdating(null);
    }
  }

  const filtered = requests.filter(r =>
    (filterStatus === "ALL" || r.status === filterStatus) &&
    (filterPriority === "ALL" || r.priority === filterPriority)
  );

  const summaryStats = {
    open: requests.filter(r => r.status === "OPEN").length,
    inProgress: requests.filter(r => r.status === "IN_PROGRESS").length,
    resolved: requests.filter(r => r.status === "RESOLVED").length,
    emergency: requests.filter(r => r.priority === "EMERGENCY" && r.status !== "RESOLVED" && r.status !== "CLOSED").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        </div>
        <p className="text-muted-foreground">Review and manage all incoming maintenance requests</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Open", value: summaryStats.open, color: "text-blue-600" },
          { label: "In Progress", value: summaryStats.inProgress, color: "text-yellow-600" },
          { label: "Resolved", value: summaryStats.resolved, color: "text-green-600" },
          { label: "🚨 Emergency", value: summaryStats.emergency, color: "text-red-600" },
        ].map(stat => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            {["LOW", "MEDIUM", "HIGH", "EMERGENCY"].map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="self-center text-sm text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading requests...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No requests match the selected filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(req => (
                  <TableRow key={req.requestId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{req.createdBy.fName} {req.createdBy.lName}</p>
                        <p className="text-xs text-muted-foreground">{req.createdBy.netId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {CATEGORY_ICONS[req.category]} {req.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[160px]">
                      {getLocation(req)}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[req.priority]}`}>
                        {req.priority}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate" title={req.description}>{req.description}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={req.assignedStaff ? String(req.assignedStaff.userId) : "none"}
                        onValueChange={val => val !== "none" && handleAssignStaff(req.requestId, parseInt(val))}
                        disabled={updating === req.requestId}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue placeholder="Assign staff..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs text-muted-foreground">Unassigned</SelectItem>
                          {staffList.map(s => (
                            <SelectItem key={s.userId} value={String(s.userId)} className="text-xs">
                              {s.fName} {s.lName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(req.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[req.status] ?? "secondary"}>
                        {req.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={req.status}
                        onValueChange={val => handleStatusChange(req.requestId, val)}
                        disabled={updating === req.requestId}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
