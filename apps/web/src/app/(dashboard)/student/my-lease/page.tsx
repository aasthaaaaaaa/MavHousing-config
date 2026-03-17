"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, CreditCard, BedDouble, DoorOpen, Key, Users, UserPlus, Trash2, AlertTriangle, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getLeaseStatusClass, getOccupantTypeClass } from "@/lib/status-colors";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Lease {
  leaseId: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  totalDue: string;
  dueThisMonth: string;
  status: string;
  signedAt: string;
  terminationFee?: string;
  terminationReason?: string;
  unit?: {
    unitNumber: string;
    floorLevel?: number;
    maxOccupancy?: number;
    property: {
      name: string;
      address: string;
      propertyType: string;
    };
  };
  room?: { roomLetter: string };
  bed?: { bedLetter: string };
  occupants?: {
    occupantId: number;
    occupantType: string;
    moveInDate: string | null;
    moveOutDate: string | null;
    user: {
      userId: number;
      netId: string;
      fName: string;
      lName: string;
      email: string;
    };
  }[];
  payments?: {
    amountPaid: string;
    transactionDate: string;
    isSuccessful: boolean;
  }[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatMoney(val: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(val));
}

function calcLeaseStats(l: Lease) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const paidThisMonth = (l.payments || [])
    .filter(p => p.isSuccessful && new Date(p.transactionDate) >= startOfMonth)
    .reduce((acc, p) => acc + parseFloat(p.amountPaid), 0);
  
  const monthlyRent = parseFloat(l.dueThisMonth);
  const extraFees = parseFloat(l.terminationFee || "0");
  const totalDueThisMonth = monthlyRent + extraFees;
  const balanceThisMonth = Math.max(0, totalDueThisMonth - paidThisMonth);
  
  return {
    paidThisMonth,
    monthlyRent,
    extraFees,
    totalDueThisMonth,
    balanceThisMonth,
    isClear: balanceThisMonth <= 0.01
  };
}

export default function MyLeasePage() {
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [inviteUtaId, setInviteUtaId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [termReason, setTermReason] = useState("");
  const [requestingTerm, setRequestingTerm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.userId) fetchLease();
  }, [user]);

  async function fetchLease() {
    try {
      const res = await fetch(`http://localhost:3009/lease/my-lease?userId=${user!.userId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setLease(data);
    } catch {
      setLease(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignLease() {
    setSigning(true);
    try {
      await fetch(`http://localhost:3009/lease/leases/${lease!.leaseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SIGNED" }),
      });
      setLease({ ...lease!, status: "SIGNED", signedAt: new Date().toISOString() });
    } catch {
      // Could add toast here
    } finally {
      setSigning(false);
    }
  }

  async function handleAddOccupant(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteUtaId.trim()) return;

    setInviting(true);
    try {
      const res = await fetch(`http://localhost:3009/housing/leases/${lease!.leaseId}/occupants?userId=${user!.userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utaId: inviteUtaId }),
      });

      if (res.ok) {
        toast.success("Occupant invitation sent successfully!");
        setInviteUtaId("");
        // We do not immediately show them in the lease table until they accept the application
        // so no local state update of occupants is strictly necessary, 
        // however, we could optionally refetch the lease.
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to invite occupant");
      }
    } catch (error) {
      toast.error("An error occurred while inviting occupant");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveOccupant(targetUserId: number) {
    if (!confirm("Are you sure you want to remove this occupant?")) return;

    try {
      const res = await fetch(`http://localhost:3009/housing/leases/${lease!.leaseId}/occupants/${targetUserId}?userId=${user!.userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Occupant removed successfully.");
        setLease({
          ...lease!,
          occupants: lease!.occupants!.filter(o => o.user.userId !== targetUserId)
        });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to remove occupant");
      }
    } catch (error) {
      toast.error("An error occurred while removing occupant");
    }
  }

  async function handleTerminationRequest() {
    if (!termReason.trim()) return;
    setRequestingTerm(true);
    try {
      const res = await fetch(`http://localhost:3009/lease/${lease!.leaseId}/request-termination`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: termReason }),
      });
      if (res.ok) {
        toast.success("Termination request submitted to management.");
        setLease({ ...lease!, status: "TERMINATION_REQUESTED", terminationReason: termReason });
        setTermDialogOpen(false);
      } else {
        toast.error("Failed to submit termination request.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setRequestingTerm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-10 w-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-28 bg-muted animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Lease</h2>
        <p className="text-muted-foreground">
          You don&apos;t have a lease on file. If you believe this is an error, please contact staff.
        </p>
      </div>
    );
  }

  const statusLabel = lease.status.replace(/_/g, " ");

  return (
    <div className="p-6 min-w-3xl max-w-7xl mx-auto space-y-3">
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-2xl font-bold tracking-tight">My Lease</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your current lease agreement details</p>
      </div>

      {lease.status === 'PENDING_SIGNATURE' && (
        <Card className="border-primary/50 bg-primary/5 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "80ms" }}>
          <CardHeader>
            <CardTitle className="text-primary">Action Required: Sign Your Lease</CardTitle>
            <CardDescription className="text-base text-foreground mt-2">
              You have been offered a housing assignment! Please review the details below.
              By clicking &quot;Accept &amp; Sign Lease&quot;, you agree to the terms and financial obligations of this lease.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleSignLease} disabled={signing}>
              {signing ? "Signing..." : "Accept & Sign Lease"}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {lease.status === 'TERMINATION_REQUESTED' && (
        <Card className="border-amber-500/50 bg-amber-500/5 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "80ms" }}>
          <CardHeader>
            <CardTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Termination Request Pending
            </CardTitle>
            <CardDescription className="text-base text-foreground mt-2">
              You have requested to end your lease early. Management is currently reviewing your request. 
              {lease.terminationFee && parseFloat(lease.terminationFee) > 0 ? (
                <span className="block mt-2 font-bold text-destructive">
                  An early termination fee of {formatMoney(lease.terminationFee)} has been added to your account. 
                  Please clear all dues to finalize the termination.
                </span>
              ) : (
                <span className="block mt-2">Waiting for management to set termination fees if applicable.</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Card — left column */}
        {lease.unit && (
          <Card className="md:row-span-2 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>{lease.unit.property.name}</CardTitle>
                </div>
                <Badge variant="outline" className={`${getLeaseStatusClass(lease.status)} rounded-full px-2.5`}>{statusLabel}</Badge>
              </div>
              <CardDescription>{lease.unit.property.address}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Unit</p>
                <p className="font-medium">{lease.unit.unitNumber}</p>
              </div>
              {lease.unit.floorLevel && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Floor</p>
                  <p className="font-medium">{lease.unit.floorLevel}</p>
                </div>
              )}
              {lease.room && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <DoorOpen className="h-3 w-3" /> Room
                  </p>
                  <p className="font-medium">Room {lease.room.roomLetter}</p>
                </div>
              )}
              {lease.bed && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <BedDouble className="h-3 w-3" /> Bed
                  </p>
                  <p className="font-medium">Bed {lease.bed.bedLetter}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Lease Type</p>
                <p className="font-medium capitalize">{lease.leaseType.replace("_", " ")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Property Type</p>
                <p className="font-medium">{lease.unit.property.propertyType}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dates Card — right top */}
        <Card className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "220ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Lease Period</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</span>
              <span className="font-medium">{formatDate(lease.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">End Date</span>
              <span className="font-medium">{formatDate(lease.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Key className="h-3 w-3" /> Signed
              </span>
              <span className="font-medium">{formatDate(lease.signedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financials Card — right bottom */}
        <Card className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "290ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Financial Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total Due (Full Term)</span>
              <span className="font-semibold">{formatMoney(lease.totalDue)}</span>
            </div>
            
            {(() => {
              const stats = calcLeaseStats(lease);
              return (
                <div className="space-y-3 pt-2">
                   <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monthly Rent</span>
                    <span className="font-medium">{formatMoney(String(stats.monthlyRent))}</span>
                  </div>

                  {stats.extraFees > 0 && (
                    <div className="flex justify-between items-center text-sm text-destructive">
                      <span className="">Extra Fees / Termination Fee</span>
                      <span className="font-semibold">{formatMoney(String(stats.extraFees))}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span className="">Paid This Month</span>
                    <span>- {formatMoney(String(stats.paidThisMonth))}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/20">
                    <span className="text-xs font-bold uppercase tracking-tight">Remaining This Month</span>
                    <span className={`text-xl font-bold ${stats.isClear ? 'text-green-600' : 'text-primary'}`}>
                      {formatMoney(String(stats.balanceThisMonth))}
                    </span>
                  </div>
                </div>
              );
            })()}

            {lease.status === 'ACTIVE' && (
              <>
                <Separator />
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => setTermDialogOpen(true)}>
                  Request Early Lease Ending
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {lease.occupants && lease.occupants.length > 0 && (
        <Card className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "360ms" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>People on My Lease</CardTitle>
            </div>
            <CardDescription>{lease.occupants.length} occupant{lease.occupants.length !== 1 ? 's' : ''}. Max capacity: {lease.unit?.maxOccupancy || 1}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Show Add Occupant form if BY_UNIT and the current user is LEASE_HOLDER */}
            {lease.leaseType === 'BY_UNIT' &&
              lease.occupants.some(o => o.user.userId === user?.userId && o.occupantType === 'LEASE_HOLDER') && (
                <form onSubmit={handleAddOccupant} className="flex gap-3 items-end bg-muted/30 p-4 rounded-xl border">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Invite a Roommate</label>
                    <Input
                      placeholder="Enter 10-digit UTA ID"
                      value={inviteUtaId}
                      onChange={e => setInviteUtaId(e.target.value)}
                      maxLength={10}
                    />
                  </div>
                  <Button type="submit" disabled={inviting || !inviteUtaId.trim() || lease.occupants.length >= (lease.unit?.maxOccupancy || 1)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {inviting ? "Inviting..." : "Add Occupant"}
                  </Button>
                </form>
              )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Net ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Move-in Date</TableHead>
                  {lease.leaseType === 'BY_UNIT' && lease.occupants.some(o => o.user.userId === user?.userId && o.occupantType === 'LEASE_HOLDER') && (
                    <TableHead className="text-right">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lease.occupants.map((occ) => (
                  <TableRow key={occ.occupantId} className="transition-colors">
                    <TableCell className="font-medium">{occ.user.fName} {occ.user.lName}</TableCell>
                    <TableCell>{occ.user.netId}</TableCell>
                    <TableCell>{occ.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getOccupantTypeClass(occ.occupantType)} rounded-full px-2.5`}>
                        {occ.occupantType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{occ.moveInDate ? formatDate(occ.moveInDate) : '—'}</TableCell>
                    {lease.leaseType === 'BY_UNIT' && lease.occupants?.some(o => o.user.userId === user?.userId && o.occupantType === 'LEASE_HOLDER') && (
                      <TableCell className="text-right">
                        {occ.user.userId !== user?.userId && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveOccupant(occ.user.userId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Termination Request Dialog */}
      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Early Lease Termination</DialogTitle>
            <DialogDescription>
              Are you sure you want to end your lease early? This request will be sent to management for approval. Early termination fees may apply.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Termination</label>
              <Textarea 
                placeholder="Please explain why you need to end your lease..." 
                value={termReason} 
                onChange={e => setTermReason(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleTerminationRequest} disabled={requestingTerm || !termReason.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {requestingTerm ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
