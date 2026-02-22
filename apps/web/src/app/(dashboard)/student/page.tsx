"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Wrench, CreditCard, FileText,
  ChevronRight, AlertTriangle, CheckCircle2,
  TrendingUp, Clock, CircleDot
} from "lucide-react";

interface LeaseData {
  leaseId: number;
  status: string;
  startDate: string;
  endDate: string;
  totalDue: string;
  dueThisMonth: string;
  unit?: { unitNumber: string; property: { name: string; address: string } };
  room?: { roomLetter: string };
  bed?: { bedLetter: string };
}

interface PaymentSummary {
  balance: number;
  dueThisMonth: number;
  totalPaid: number;
  totalDue: number;
}

interface MaintenanceRequest {
  requestId: number;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface Application {
  applicationId?: number;
  status: string;
  createdAt?: string;
}

function formatMoney(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default", SIGNED: "default",
  PENDING_SIGNATURE: "secondary", PENDING: "secondary",
  COMPLETED: "outline", TERMINATED: "destructive", REJECTED: "destructive", APPROVED: "default",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-green-500", MEDIUM: "text-yellow-500",
  HIGH: "text-orange-500", EMERGENCY: "text-red-500",
};



export default function StudentDashboard() {
  const { user } = useAuth();
  const [lease, setLease] = useState<LeaseData | null | undefined>(undefined);
  const [payments, setPayments] = useState<PaymentSummary | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (!user?.userId) return;
    const uid = user.userId;
    Promise.all([
      fetch(`http://localhost:3009/lease/my-lease?userId=${uid}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:3009/payment/summary?userId=${uid}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:3009/maintenance/my-requests?userId=${uid}`).then(r => r.json()).catch(() => []),
      fetch(`http://localhost:3009/housing/my-applications?userId=${uid}`).then(r => r.json()).catch(() => []),
    ]).then(([leaseData, payData, reqData, appData]) => {
      setLease(leaseData ?? null);
      setPayments(payData ?? null);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setApplications(Array.isArray(appData) ? appData : []);
    });
  }, [user]);

  const openRequests = requests.filter(r => r.status === "OPEN" || r.status === "IN_PROGRESS");
  const pendingApps = applications.filter(a => a.status === "PENDING");
  const balancePct = payments ? Math.min(100, (payments.totalPaid / payments.totalDue) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.fName ? `, ${user.fName}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your housing account.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid gap-4 grid-cols-2">
        {/* Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due This Month</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${payments && payments.balance > 0 ? "text-destructive" : "text-green-500"}`}>
              {payments ? formatMoney(payments.dueThisMonth) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {payments ? `${formatMoney(payments.totalPaid)} paid of ${formatMoney(payments.totalDue)}` : "No lease"}
            </p>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${openRequests.length > 0 ? "text-orange-500" : "text-green-500"}`}>
              {openRequests.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {openRequests.length === 0 ? "All clear" : `${openRequests.length} need${openRequests.length === 1 ? "s" : ""} attention`}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Main detail row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">

        {/* Lease detail — spans 1 col */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Lease Details</CardTitle>
              {lease && <Badge variant={STATUS_VARIANT[lease.status] ?? "secondary"}>{lease.status}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lease === undefined ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : lease ? (
              <>
                <div className="space-y-1">
                  <p className="font-semibold">{lease.unit?.property.name}</p>
                  <p className="text-sm text-muted-foreground">{lease.unit?.property.address}</p>
                  {lease.unit && (
                    <p className="text-sm text-muted-foreground">
                      Unit {lease.unit.unitNumber}
                      {lease.room ? ` · Room ${lease.room.roomLetter}` : ""}
                      {lease.bed ? ` · Bed ${lease.bed.bedLetter}` : ""}
                    </p>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Start</p>
                    <p className="font-medium">{formatDate(lease.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">End</p>
                    <p className="font-medium">{formatDate(lease.endDate)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/student/my-lease">View Lease <ChevronRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm">No active lease on file.</p>
                </div>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/student/application">Apply for Housing</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payments detail — spans 1 col */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
            <CardDescription>Current lease payment status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payments ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{balancePct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${balancePct}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-medium text-green-600">{formatMoney(payments.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-semibold ${payments.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                      {formatMoney(payments.balance)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due This Month</span>
                    <span className="font-bold">{formatMoney(payments.dueThisMonth)}</span>
                  </div>
                </div>
                <Button variant={payments.balance > 0 ? "default" : "outline"} size="sm" className="w-full" asChild>
                  <Link href="/student/payments">
                    {payments.balance > 0 ? "Make a Payment" : "View History"} <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground py-2">No payment data available.</p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/student/payments">Go to Payments</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Maintenance</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                  <Link href="/student/maintenance/my-requests">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm">No requests submitted.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.slice(0, 3).map(r => (
                    <div key={r.requestId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium leading-none">{r.category.toLowerCase().replace(/_/g, " ")}</p>
                          <p className={`text-xs ${PRIORITY_COLOR[r.priority] ?? "text-muted-foreground"}`}>{r.priority}</p>
                        </div>
                      </div>
                      <Badge
                        variant={r.status === "RESOLVED" ? "outline" : r.status === "IN_PROGRESS" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {r.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" className="w-full mt-1" asChild>
                <Link href="/student/maintenance">+ New Request</Link>
              </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
