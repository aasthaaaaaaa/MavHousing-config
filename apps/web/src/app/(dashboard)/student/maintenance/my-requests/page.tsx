"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { getMaintenanceStatusClass, getPriorityClass } from "@/lib/status-colors";

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{requests.length} request{requests.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <Button asChild>
          <Link href="/student/maintenance">+ New Request</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "80ms" }}>
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
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {requests.map((req, idx) => {
            return (
              <Card
                key={req.requestId}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ animationDelay: `${80 + idx * 70}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
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
                      <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${getPriorityClass(req.priority)}`}>
                        {req.priority}
                      </span>
                      <Badge variant="outline" className={`${getMaintenanceStatusClass(req.status)} flex items-center gap-1 rounded-full px-2.5`}>
                        {req.status === "OPEN" && <Clock className="h-3 w-3" />}
                        {req.status === "IN_PROGRESS" && <Wrench className="h-3 w-3" />}
                        {req.status === "RESOLVED" && <CheckCircle2 className="h-3 w-3" />}
                        {req.status === "CLOSED" && <XCircle className="h-3 w-3" />}
                        {req.status.replace("_", " ")}
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
