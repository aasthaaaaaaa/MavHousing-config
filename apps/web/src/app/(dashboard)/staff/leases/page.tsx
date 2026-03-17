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
import { User, Building2, Calendar, DollarSign, MapPin, AlertTriangle, RefreshCcw } from "lucide-react";
import { getLeaseStatusClass } from "@/lib/status-colors";
import { Input } from "@/components/ui/input";

interface Lease {
  leaseId: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  totalDue: string;
  dueThisMonth: string;
  status: string;
  terminationFee?: string;
  terminationReason?: string;
  user: { userId: number; netId: string; fName: string; lName: string; email: string };
  unit?: { unitNumber: string; property: { name: string; address: string } };
  room?: { roomLetter: string };
  bed?: { bedLetter: string };
  payments: any[];
}

const STATUSES = ["DRAFT", "PENDING_SIGNATURE", "SIGNED", "ACTIVE", "TERMINATION_REQUESTED", "TERMINATED", "COMPLETED"];

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

export default function StaffLeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lease | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [termFeeInput, setTermFeeInput] = useState("");
  const [finishingTerm, setFinishingTerm] = useState(false);

  useEffect(() => { fetchLeases(); }, []);

  async function fetchLeases() {
    try {
      const res = await fetch("http://localhost:3009/lease/leases");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setLeases(list);
      
      // Also update selected if it's open
      if (selected) {
        const updated = list.find(l => l.leaseId === selected.leaseId);
        if (updated) setSelected(updated);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(leaseId: number, status: string) {
    setUpdating(leaseId);
    try {
      const res = await fetch(`http://localhost:3009/lease/leases/${leaseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updatedLease = await res.json();
      setLeases(prev => prev.map(l => l.leaseId === leaseId ? updatedLease : l));
      if (selected?.leaseId === leaseId) setSelected(updatedLease);
    } finally {
      setUpdating(null);
    }
  }

  async function handleSetTerminationFee() {
    if (!selected || !termFeeInput) return;
    setUpdating(selected.leaseId);
    try {
      const res = await fetch(`http://localhost:3009/lease/${selected.leaseId}/termination-fee`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(termFeeInput) }),
      });
      const updatedLease = await res.json();
      setSelected(updatedLease);
      setLeases(prev => prev.map(l => l.leaseId === selected.leaseId ? updatedLease : l));
      setTermFeeInput("");
    } finally {
      setUpdating(null);
    }
  }

  async function handleApproveTermination() {
    if (!selected) return;
    setFinishingTerm(true);
    try {
      const res = await fetch(`http://localhost:3009/lease/${selected.leaseId}/approve-termination`, {
        method: "PATCH",
      });
      const updated = await res.json();
      setSelected(updated);
      setLeases(prev => prev.map(l => l.leaseId === selected.leaseId ? updated : l));
      setSheetOpen(false);
    } finally {
      setFinishingTerm(false);
    }
  }

  function open(l: Lease) { setSelected(l); setSheetOpen(true); }

  if (loading) return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-12 w-64 bg-muted animate-pulse rounded-xl" />
      <div className="h-96 bg-muted animate-pulse rounded-2xl" />
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-2xl font-bold tracking-tight">Lease Management</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{leases.length} lease{leases.length !== 1 ? "s" : ""} on record</p>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl py-0 gap-0" style={{ animationDelay: "80ms" }}>
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
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => open(lease)}
                >
                  <TableCell className="pl-6">
                    <p className="font-medium">{lease.user?.fName ?? "Unknown"} {lease.user?.lName ?? "Tenant"}</p>
                    <p className="text-xs text-muted-foreground">{lease.user?.netId ?? "—"}</p>
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
                    <Badge variant="outline" className={`${getLeaseStatusClass(lease.status)} rounded-full px-2.5`}>
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
                <Badge variant="outline" className={`${getLeaseStatusClass(selected.status)} text-sm px-3 py-1`}>
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
                   <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">Total Due (Full Term)</span>
                      </div>
                      <span className="font-semibold">{fmtMoney(selected.totalDue)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-4 w-4" />
                        <span className="text-sm">Monthly Rent</span>
                      </div>
                      <span className="font-medium text-sm">{fmtMoney(selected.dueThisMonth)}</span>
                    </div>

                    {selected.terminationFee && parseFloat(selected.terminationFee) > 0 && (
                      <div className="flex items-center justify-between text-destructive">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4" />
                          <span className="text-sm font-medium">Extra Fees / Term. Fee</span>
                        </div>
                        <span className="font-semibold text-sm">{fmtMoney(selected.terminationFee)}</span>
                      </div>
                    )}

                    {(() => {
                      const stats = calcLeaseStats(selected);
                      return (
                        <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-dashed">
                          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <span>Monthly Summary</span>
                            <span className="normal-case font-normal">{new Date().toLocaleDateString("en-US", { month: "long" })}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Obligation (Rent + Fees)</span>
                              <span>{fmtMoney(String(stats.totalDueThisMonth))}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600">
                              <span className="">Paid This Month</span>
                              <span>- {fmtMoney(String(stats.paidThisMonth))}</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-xs font-bold uppercase">Current Balance</span>
                              <span className={`text-xl font-bold ${stats.isClear ? 'text-green-600' : 'text-primary'}`}>
                                {fmtMoney(String(stats.balanceThisMonth))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {['SIGNED', 'ACTIVE', 'TERMINATION_REQUESTED'].includes(selected.status) && (
                      <div className="space-y-2 pt-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Extra Fee to Account</Label>
                        <div className="flex gap-2">
                          <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={termFeeInput} 
                              onChange={e => setTermFeeInput(e.target.value)}
                              className="bg-white dark:bg-black h-8 text-sm"
                          />
                          <Button variant="outline" size="sm" className="h-8" onClick={handleSetTerminationFee} disabled={updating === selected.leaseId}>Add Fee</Button>
                        </div>
                      </div>
                    )}
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

                {selected.status === 'TERMINATION_REQUESTED' && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-amber-600 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      Early Termination Requested
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm italic">&quot;{selected.terminationReason || "No reason provided."}&quot;</p>
                    </div>
                    
                    <Separator className="bg-amber-500/10" />
                    
                    {(() => {
                      const stats = calcLeaseStats(selected);

                      return (
                        <div className="pt-2">
                           <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium uppercase text-muted-foreground">Balance Check</p>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchLeases} disabled={updating === selected.leaseId}>
                                <RefreshCcw className={`h-3 w-3 ${updating === selected.leaseId ? 'animate-spin' : ''}`} />
                              </Button>
                           </div>
                           
                           <div className="flex items-center justify-between mt-1 p-3 bg-white dark:bg-black border rounded-lg">
                             <div className="space-y-0.5">
                               <p className="text-[10px] text-muted-foreground uppercase">Remaining for Termination</p>
                               <p className={`text-lg font-bold ${stats.isClear ? 'text-green-600' : 'text-destructive'}`}>
                                 {fmtMoney(String(stats.balanceThisMonth))}
                               </p>
                             </div>
                             <Badge variant="outline" className={stats.isClear ? "text-green-600 bg-green-50 border-green-200" : "text-amber-600 bg-amber-50 border-amber-200"}>
                               {stats.isClear ? "CLEAR" : "DUE"}
                             </Badge>
                           </div>
                           
                           <Button 
                              className={`w-full mt-4 ${stats.isClear ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} text-white transition-all`}
                              onClick={handleApproveTermination}
                              disabled={finishingTerm || !stats.isClear}
                           >
                              {finishingTerm ? "Terminating..." : stats.isClear ? "Finalize Termination" : "Waiting for Payment..."}
                           </Button>
                           {!stats.isClear && <p className="text-[10px] text-center text-muted-foreground mt-2">Lease cannot be ended until balance is $0.00</p>}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
