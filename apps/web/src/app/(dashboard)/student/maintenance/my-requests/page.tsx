"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface MaintenanceRequest {
  requestId: number;
  category: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  assignedStaff?: { fName: string; lName: string };
  lease?: { unit?: { unitNumber: string; property: { name: string } }; room?: { roomLetter: string } };
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OPEN: { label: "Open", icon: <Clock className="h-3 w-3" />, variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", icon: <Wrench className="h-3 w-3" />, variant: "default" },
  RESOLVED: { label: "Resolved", icon: <CheckCircle2 className="h-3 w-3" />, variant: "outline" },
  CLOSED: { label: "Closed", icon: <XCircle className="h-3 w-3" />, variant: "outline" },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  EMERGENCY: "bg-red-100 text-red-800 border-red-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getCategoryIcon(cat: string) {
  const icons: Record<string, string> = {
    PLUMBING: "🔧", HVAC: "❄️", ELECTRICAL: "⚡",
    INTERNET: "🌐", APPLIANCE: "🍳", STRUCTURAL: "🏗️", OTHER: "📋",
  };
  return icons[cat] ?? "📋";
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) fetchRequests();
  }, [user]);

  async function fetchRequests() {
    try {
      const res = await fetch(`http://localhost:3009/maintenance/my-requests?userId=${user!.userId}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading your requests...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Maintenance Requests</h1>
          <p className="text-muted-foreground">{requests.length} request{requests.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <Button asChild>
          <Link href="/student/maintenance">+ New Request</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg mb-1">No requests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't submitted any maintenance requests.</p>
            <Button asChild>
              <Link href="/student/maintenance">Submit a Request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.OPEN;
            return (
              <Card key={req.requestId}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(req.category)}</span>
                      <div>
                        <CardTitle className="text-base">
                          {req.category.charAt(0) + req.category.slice(1).toLowerCase()} Issue
                        </CardTitle>
                        {req.lease?.unit && (
                          <CardDescription>
                            {req.lease.unit.property.name} — Unit {req.lease.unit.unitNumber}
                            {req.lease.room ? `, Room ${req.lease.room.roomLetter}` : ""}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${PRIORITY_COLORS[req.priority]}`}>
                        {req.priority}
                      </span>
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        {status.icon} {status.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{req.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>Submitted {formatDate(req.createdAt)}</span>
                    {req.assignedStaff ? (
                      <span>Assigned to {req.assignedStaff.fName} {req.assignedStaff.lName}</span>
                    ) : req.status === "OPEN" ? (
                      <span className="text-yellow-600">⏳ Awaiting assignment</span>
                    ) : null}
                    {req.resolvedAt && (
                      <span className="text-green-600">✓ Resolved {formatDate(req.resolvedAt)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
