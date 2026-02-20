"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  DRAFT: "outline",
  PENDING_SIGNATURE: "secondary",
  SIGNED: "default",
  ACTIVE: "default",
  COMPLETED: "secondary",
  TERMINATED: "destructive",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(val: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(val));
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
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => { fetchLeases(); }, []);

  async function fetchLeases() {
    try {
      const res = await fetch("http://localhost:3009/lease/leases");
      const data = await res.json();
      setLeases(data);
    } catch {
      setLeases([]);
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
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lease Management</h1>
        <p className="text-muted-foreground">View and manage all student leases</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leases</CardTitle>
          <CardDescription>{leases.length} lease(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading leases...</p>
          ) : leases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No leases found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.leaseId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lease.user.fName} {lease.user.lName}</p>
                        <p className="text-xs text-muted-foreground">{lease.user.netId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lease.unit?.property.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{lease.unit?.property.address ?? ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getLocation(lease)}</TableCell>
                    <TableCell className="text-sm">{lease.leaseType.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(lease.startDate)} – {formatDate(lease.endDate)}
                    </TableCell>
                    <TableCell className="font-medium">{formatMoney(lease.totalDue)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[lease.status] ?? "default"}>
                        {lease.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lease.status}
                        onValueChange={(val) => handleStatusChange(lease.leaseId, val)}
                        disabled={updating === lease.leaseId}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s.replace("_", " ")}
                            </SelectItem>
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
