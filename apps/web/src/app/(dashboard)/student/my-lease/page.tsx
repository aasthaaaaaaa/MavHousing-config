"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, CreditCard, BedDouble, DoorOpen, Key } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Lease {
  leaseId: number;
  leaseType: string;
  startDate: string;
  endDate: string;
  totalDue: string;
  dueThisMonth: string;
  status: string;
  signedAt: string;
  unit?: {
    unitNumber: string;
    floorLevel?: number;
    property: {
      name: string;
      address: string;
      propertyType: string;
    };
  };
  room?: { roomLetter: string };
  bed?: { bedLetter: string };
}

const STATUS_STYLES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  DRAFT: { variant: "outline", label: "Draft" },
  PENDING_SIGNATURE: { variant: "secondary", label: "Pending Signature" },
  SIGNED: { variant: "default", label: "Signed" },
  ACTIVE: { variant: "default", label: "Active" },
  COMPLETED: { variant: "secondary", label: "Completed" },
  TERMINATED: { variant: "destructive", label: "Terminated" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatMoney(val: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(val));
}

export default function MyLeasePage() {
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading your lease...
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

  const statusCfg = STATUS_STYLES[lease.status] || STATUS_STYLES.SIGNED;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Lease</h1>
        <p className="text-muted-foreground">Your current lease agreement details</p>
      </div>

      {lease.status === 'PENDING_SIGNATURE' && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Action Required: Sign Your Lease</CardTitle>
            <CardDescription className="text-base text-foreground mt-2">
              You have been offered a housing assignment! Please review the details below. 
              By clicking "Accept & Sign Lease", you agree to the terms and financial obligations of this lease.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleSignLease} disabled={signing}>
              {signing ? "Signing..." : "Accept & Sign Lease"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Property Card */}
      {lease.unit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>{lease.unit.property.name}</CardTitle>
              </div>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <CardDescription>{lease.unit.property.address}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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

      {/* Dates Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Lease Period</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
            <p className="font-medium">{formatDate(lease.startDate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">End Date</p>
            <p className="font-medium">{formatDate(lease.endDate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Key className="h-3 w-3" /> Signed
            </p>
            <p className="font-medium">{formatDate(lease.signedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Financials Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Financial Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Due (Full Term)</span>
            <span className="font-semibold text-lg">{formatMoney(lease.totalDue)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Due This Month</span>
            <span className="font-bold text-xl text-primary">{formatMoney(lease.dueThisMonth)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
