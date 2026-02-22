"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Wrench, MapPin, User, Calendar, AlertTriangle } from "lucide-react";

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
  OPEN: "secondary", IN_PROGRESS: "default", RESOLVED: "outline", CLOSED: "outline",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  EMERGENCY: "bg-red-100 text-red-800 border-red-200",
};

function fmtDate(d?: string) {
  if (!d) return "—";
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
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [reqRes, staffRes] = await Promise.all([
      fetch("http://localhost:3009/maintenance/requests").then(r => r.json()).catch(() => []),
      fetch("http://localhost:3009/maintenance/staff").then(r => r.json()).catch(() => []),
    ]);
    setRequests(Array.isArray(reqRes) ? reqRes : []);
    setStaffList(Array.isArray(staffRes) ? staffRes : []);
    setLoading(false);
  }

  async function handleStatusChange(requestId: number, status: string) {
    setUpdating(requestId);
    try {
      await fetch(`http://localhost:3009/maintenance/requests/${requestId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status } : r));
      if (selected?.requestId === requestId) setSelected(prev => prev ? { ...prev, status } : null);
    } finally { setUpdating(null); }
  }

  async function handleAssignStaff(requestId: number, staffId: number) {
    setUpdating(requestId);
    try {
      await fetch(`http://localhost:3009/maintenance/requests/${requestId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS", staffId }),
      });
      const assigned = staffList.find(s => s.userId === staffId);
      setRequests(prev => prev.map(r =>
        r.requestId === requestId
          ? { ...r, status: "IN_PROGRESS", assignedStaff: assigned ? { userId: assigned.userId, fName: assigned.fName, lName: assigned.lName } : r.assignedStaff }
          : r
      ));
      if (selected?.requestId === requestId && assigned) {
        setSelected(prev => prev ? { ...prev, status: "IN_PROGRESS", assignedStaff: { userId: assigned.userId, fName: assigned.fName, lName: assigned.lName } } : null);
      }
    } finally { setUpdating(null); }
  }

  function open(r: MaintenanceRequest) { setSelected(r); setSheetOpen(true); }

  const filtered = requests.filter(r =>
    (filterStatus === "ALL" || r.status === filterStatus) &&
    (filterPriority === "ALL" || r.priority === filterPriority)
  );

  const stats = {
    open: requests.filter(r => r.status === "OPEN").length,
    inProgress: requests.filter(r => r.status === "IN_PROGRESS").length,
    resolved: requests.filter(r => r.status === "RESOLVED").length,
    emergency: requests.filter(r => r.priority === "EMERGENCY" && !["RESOLVED", "CLOSED"].includes(r.status)).length,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Requests</h1>
        <p className="text-muted-foreground">Review and manage all incoming maintenance requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Open", value: stats.open, color: "text-blue-600" },
          { label: "In Progress", value: stats.inProgress, color: "text-yellow-600" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600" },
          { label: "Emergency", value: stats.emergency, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            {["LOW", "MEDIUM", "HIGH", "EMERGENCY"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
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
                  <TableHead className="pl-6">Tenant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(req => (
                  <TableRow key={req.requestId} className="cursor-pointer hover:bg-muted/50" onClick={() => open(req)}>
                    <TableCell className="pl-6">
                      <p className="font-medium">{req.createdBy.fName} {req.createdBy.lName}</p>
                      <p className="text-xs text-muted-foreground">{req.createdBy.netId}</p>
                    </TableCell>
                    <TableCell className="text-sm">{req.category}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[req.priority]}`}>
                        {req.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(req.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[req.status] ?? "secondary"}>{req.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                      <Select value={req.status} onValueChange={val => handleStatusChange(req.requestId, val)} disabled={updating === req.requestId}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>)}
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

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4 px-6">
                <SheetTitle>Request #{selected.requestId}</SheetTitle>
                <SheetDescription>{selected.category} · {fmtDate(selected.createdAt)}</SheetDescription>
              </SheetHeader>

              <div className="px-6 mb-6 flex items-center gap-2">
                <Badge variant={STATUS_VARIANTS[selected.status] ?? "secondary"} className="text-sm px-3 py-1">
                  {selected.status.replace("_", " ")}
                </Badge>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[selected.priority]}`}>
                  {selected.priority}
                </span>
              </div>

              <div className="space-y-6 px-6">
                {/* Submitter */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Submitted By</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{selected.createdBy.fName} {selected.createdBy.lName}</span></div>
                    <div className="flex items-center gap-2"><span className="h-4 w-4" /><span className="text-sm text-muted-foreground">{selected.createdBy.netId}</span></div>
                    <div className="flex items-center gap-2"><span className="h-4 w-4" /><span className="text-sm text-muted-foreground">{selected.createdBy.email}</span></div>
                  </div>
                </div>
                <Separator />

                {/* Location */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{getLocation(selected)}</span>
                  </div>
                </div>
                <Separator />

                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                </div>
                <Separator />

                {/* Assign staff */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Assigned To</h3>
                  {selected.assignedStaff ? (
                    <p className="text-sm font-medium mb-2">{selected.assignedStaff.fName} {selected.assignedStaff.lName}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-2">Not yet assigned</p>
                  )}
                  <Select
                    value={selected.assignedStaff ? String(selected.assignedStaff.userId) : "none"}
                    onValueChange={val => val !== "none" && handleAssignStaff(selected.requestId, parseInt(val))}
                    disabled={updating === selected.requestId}
                  >
                    <SelectTrigger><SelectValue placeholder="Assign staff..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {staffList.map(s => <SelectItem key={s.userId} value={String(s.userId)}>{s.fName} {s.lName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />

                {/* Status */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Status</h3>
                  <Select
                    value={selected.status}
                    onValueChange={val => handleStatusChange(selected.requestId, val)}
                    disabled={updating === selected.requestId}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {selected.resolvedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-green-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Resolved {fmtDate(selected.resolvedAt)}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
