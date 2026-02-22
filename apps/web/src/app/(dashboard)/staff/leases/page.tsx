"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { User, Building2, Calendar, DollarSign, MapPin } from "lucide-react";

interface Lease {
  leaseId: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  totalDue: string;
  status: string;
  user: { netId: string; fName: string; lName: string; email: string };
  unit?: { unitNumber: string; property: { name: string; address: string } };
  room?: { roomLetter: string };
  bed?: { bedLetter: string };
}

const STATUSES = ["DRAFT", "PENDING_SIGNATURE", "SIGNED", "ACTIVE", "COMPLETED", "TERMINATED"];

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline", PENDING_SIGNATURE: "secondary", SIGNED: "default",
  ACTIVE: "default", COMPLETED: "secondary", TERMINATED: "destructive",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-green-600 border-green-300 bg-green-50",
  SIGNED: "text-blue-600 border-blue-300 bg-blue-50",
  PENDING_SIGNATURE: "text-yellow-600 border-yellow-300 bg-yellow-50",
  TERMINATED: "text-red-600 border-red-300 bg-red-50",
};

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtMoney(v: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(v));
}
function getLocation(l: Lease) {
  if (!l.unit) return "—";
  const parts = [`Unit ${l.unit.unitNumber}`];
  if (l.room) parts.push(`Room ${l.room.roomLetter}`);
  if (l.bed) parts.push(`Bed ${l.bed.bedLetter}`);
  return parts.join(", ");
}

export default function StaffLeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lease | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => { fetchLeases(); }, []);

  async function fetchLeases() {
    try {
      const res = await fetch("http://localhost:3009/lease/leases");
      const data = await res.json();
      setLeases(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(leaseId: number, status: string) {
    setUpdating(leaseId);
    try {
      await fetch(`http://localhost:3009/lease/leases/${leaseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setLeases(prev => prev.map(l => l.leaseId === leaseId ? { ...l, status } : l));
      if (selected?.leaseId === leaseId) setSelected(prev => prev ? { ...prev, status } : null);
    } finally {
      setUpdating(null);
    }
  }

  function open(l: Lease) { setSelected(l); setSheetOpen(true); }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading leases...</div>;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lease Management</h1>
        <p className="text-muted-foreground">{leases.length} lease{leases.length !== 1 ? "s" : ""} on record</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">No leases found.</TableCell>
                </TableRow>
              ) : leases.map(lease => (
                <TableRow
                  key={lease.leaseId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => open(lease)}
                >
                  <TableCell className="pl-6">
                    <p className="font-medium">{lease.user.fName} {lease.user.lName}</p>
                    <p className="text-xs text-muted-foreground">{lease.user.netId}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{lease.unit?.property.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{getLocation(lease)}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lease.leaseType.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {fmtDate(lease.startDate)} – {fmtDate(lease.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[lease.status] ?? "default"} className={STATUS_COLORS[lease.status] ?? ""}>
                      {lease.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                    <Select value={lease.status} onValueChange={val => handleStatusChange(lease.leaseId, val)} disabled={updating === lease.leaseId}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4 px-6">
                <SheetTitle>Lease #{selected.leaseId}</SheetTitle>
                <SheetDescription>{selected.leaseType.replace(/_/g, " ")}</SheetDescription>
              </SheetHeader>

              <div className="px-6 mb-6">
                <Badge variant={STATUS_VARIANTS[selected.status] ?? "default"} className={`${STATUS_COLORS[selected.status] ?? ""} text-sm px-3 py-1`}>
                  {selected.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="space-y-6 px-6">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tenant</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{selected.user.fName} {selected.user.lName}</span></div>
                    <div className="flex items-center gap-2"><span className="h-4 w-4" /><span className="text-sm text-muted-foreground">{selected.user.netId}</span></div>
                    <div className="flex items-center gap-2"><span className="h-4 w-4" /><span className="text-sm text-muted-foreground">{selected.user.email}</span></div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Property</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{selected.unit?.property.name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">{selected.unit?.property.address}</p>
                      <p className="text-sm text-muted-foreground">{getLocation(selected)}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lease Period</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{fmtDate(selected.startDate)} → {fmtDate(selected.endDate)}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Financials</h3>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-lg font-bold">{fmtMoney(selected.totalDue)}</span>
                    <span className="text-sm text-muted-foreground">total due</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Status</h3>
                  <Select value={selected.status} onValueChange={val => handleStatusChange(selected.leaseId, val)} disabled={updating === selected.leaseId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
