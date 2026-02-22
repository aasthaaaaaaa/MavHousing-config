"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Users, Trash2, UserPlus, Building2, Bed } from "lucide-react";

interface OccupantUser {
  userId: number;
  netId: string;
  fName: string;
  lName: string;
  email: string;
}

interface Occupant {
  occupantId: number;
  occupantType: string;
  moveInDate?: string;
  moveOutDate?: string;
  user: OccupantUser;
}

interface Lease {
  leaseId: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  status: string;
  user: OccupantUser;
  unit?: { unitNumber: string; property: { name: string; address: string } };
  room?: { roomLetter: string };
  bed?: { bedLetter: string };
  occupants: Occupant[];
}

const TYPE_BADGE: Record<string, string> = {
  LEASE_HOLDER: "bg-blue-100 text-blue-800 border-blue-200",
  ROOMMATE: "bg-purple-100 text-purple-800 border-purple-200",
  OCCUPANT: "bg-green-100 text-green-800 border-green-200",
};

function getLocation(l: Lease) {
  if (!l.unit) return "—";
  const parts = [l.unit.property.name, `Unit ${l.unit.unitNumber}`];
  if (l.room) parts.push(`Room ${l.room.roomLetter}`);
  if (l.bed) parts.push(`Bed ${l.bed.bedLetter}`);
  return parts.join(" · ");
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface StudentOption { userId: number; netId: string; fName: string; lName: string; }

export default function StaffOccupancyPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lease | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [addType, setAddType] = useState("ROOMMATE");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => { fetchOccupancy(); }, []);

  async function fetchOccupancy() {
    try {
      const res = await fetch("http://localhost:3009/lease/occupancy");
      const data = await res.json();
      const loaded: Lease[] = Array.isArray(data) ? data : [];
      setLeases(loaded);
      await fetchStudents(loaded); // pass loaded data directly — state isn't updated yet
    } catch {
      toast({ title: "Error", description: "Failed to load occupancy data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Build students list from already-loaded leases (all have userId)
  // Called after leases are set
  async function fetchStudents(loadedLeases: Lease[]) {
    try {
      const res = await fetch("http://localhost:3009/housing/students");
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }

  async function handleAdd() {
    if (!selected || !addUserId) return;
    const uid = parseInt(addUserId);
    if (isNaN(uid)) return;
    setAdding(true);
    try {
      const res = await fetch(`http://localhost:3009/lease/occupancy/${selected.leaseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, occupantType: addType }),
      });
      if (!res.ok) throw new Error();
      const newOcc: Occupant = await res.json();
      const updated = leases.map(l =>
        l.leaseId === selected.leaseId ? { ...l, occupants: [...l.occupants, newOcc] } : l
      );
      setLeases(updated);
      setSelected(updated.find(l => l.leaseId === selected.leaseId) ?? selected);
      setAddUserId("placeholder"); setTimeout(() => setAddUserId(""), 0); // reset select
      toast({ title: "Occupant added" });
    } catch {
      toast({ title: "Error", description: "Failed to add occupant. Check the user ID.", variant: "destructive" });
    } finally { setAdding(false); }
  }

  async function handleRemove(occupantId: number) {
    if (!selected) return;
    setRemovingId(occupantId);
    try {
      await fetch(`http://localhost:3009/lease/occupancy/${occupantId}`, { method: "DELETE" });
      const updated = leases.map(l =>
        l.leaseId === selected.leaseId
          ? { ...l, occupants: l.occupants.filter(o => o.occupantId !== occupantId) }
          : l
      );
      setLeases(updated);
      setSelected(updated.find(l => l.leaseId === selected.leaseId) ?? selected);
      toast({ title: "Occupant removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove occupant", variant: "destructive" });
    } finally { setRemovingId(null); }
  }

  const filtered = leases.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.user.fName.toLowerCase().includes(q) ||
      l.user.lName.toLowerCase().includes(q) ||
      l.user.netId.toLowerCase().includes(q) ||
      l.unit?.property.name.toLowerCase().includes(q) ||
      false
    );
  });

  const stats = {
    total: leases.length,
    withRoommates: leases.filter(l => l.occupants.some(o => o.occupantType === "ROOMMATE")).length,
    totalOccupants: leases.reduce((s, l) => s + l.occupants.length, 0),
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading occupancy data...</div>;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Occupancy Management</h1>
        <p className="text-muted-foreground">View and manage who is assigned to each lease unit.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-3">
        {[
          { label: "Active Leases", value: stats.total, icon: Building2 },
          { label: "With Roommates", value: stats.withRoommates, icon: Users },
          { label: "Total Occupants", value: stats.totalOccupants, icon: User },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name, NetID, or property..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">{filtered.length} lease{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Lease Holder</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Lease Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Occupants</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">No leases found.</TableCell>
                </TableRow>
              ) : filtered.map(lease => (
                <TableRow
                  key={lease.leaseId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => { setSelected(lease); setSheetOpen(true); }}
                >
                  <TableCell className="pl-6">
                    <p className="font-medium">{lease.user.fName} {lease.user.lName}</p>
                    <p className="text-xs text-muted-foreground">{lease.user.netId}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{lease.unit?.property.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {lease.unit ? `Unit ${lease.unit.unitNumber}` : ""}
                      {lease.room ? ` · Room ${lease.room.roomLetter}` : ""}
                      {lease.bed ? ` · Bed ${lease.bed.bedLetter}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lease.leaseType.replace("_", " ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {fmtDate(lease.startDate)} – {fmtDate(lease.endDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{lease.occupants.length}</span>
                      {lease.occupants.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          ({lease.occupants.filter(o => o.occupantType === "ROOMMATE").length} roommate{lease.occupants.filter(o => o.occupantType === "ROOMMATE").length !== 1 ? "s" : ""})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">
                    <Badge variant={lease.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                      {lease.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4 px-6">
                <SheetTitle>Lease #{selected.leaseId} — Occupancy</SheetTitle>
                <SheetDescription>{getLocation(selected)}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-6">
                {/* Lease holder info */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lease Holder</h3>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selected.user.fName} {selected.user.lName}</p>
                      <p className="text-xs text-muted-foreground">{selected.user.netId} · {selected.user.email}</p>
                    </div>
                    <Badge className="ml-auto text-xs border bg-blue-100 text-blue-800 border-blue-200">LEASE HOLDER</Badge>
                  </div>
                </div>

                <Separator />

                {/* Current occupants */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Occupants ({selected.occupants.length})
                  </h3>
                  {selected.occupants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No additional occupants assigned.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.occupants.map(occ => (
                        <div key={occ.occupantId} className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {occ.user.fName[0]}{occ.user.lName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{occ.user.fName} {occ.user.lName}</p>
                            <p className="text-xs text-muted-foreground">{occ.user.netId}</p>
                          </div>
                          <Badge className={`text-xs border flex-shrink-0 ${TYPE_BADGE[occ.occupantType] ?? ""}`}>
                            {occ.occupantType.replace("_", " ")}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => handleRemove(occ.occupantId)}
                            disabled={removingId === occ.occupantId}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Add occupant */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Assign Occupant</h3>
                  <div className="space-y-3">
                    <Select value={addUserId} onValueChange={setAddUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {students
                          .filter(s => s.userId !== selected.user.userId &&
                            !selected.occupants.some(o => o.user.userId === s.userId))
                          .map(s => (
                            <SelectItem key={s.userId} value={String(s.userId)}>
                              {s.fName} {s.lName} <span className="text-muted-foreground ml-1">({s.netId})</span>
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <Select value={addType} onValueChange={setAddType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROOMMATE">Roommate</SelectItem>
                        <SelectItem value="OCCUPANT">Occupant</SelectItem>
                        <SelectItem value="LEASE_HOLDER">Lease Holder</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="w-full" onClick={handleAdd} disabled={adding || !addUserId}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {adding ? "Assigning..." : "Assign Occupant"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Unit details */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Unit Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{selected.unit?.property.address ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>
                        Unit {selected.unit?.unitNumber ?? "—"}
                        {selected.room ? ` · Room ${selected.room.roomLetter}` : ""}
                        {selected.bed ? ` · Bed ${selected.bed.bedLetter}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{selected.leaseType.replace("_", " ")} lease · {fmtDate(selected.startDate)} → {fmtDate(selected.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
