"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Calendar, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { CreateLeaseDialog } from "@/components/create-lease-dialog";
import { getApplicationStatusClass } from "@/lib/status-colors";

interface Application {
  appId: number;
  term: string;
  status: string;
  submissionDate: string;
  user: { userId: number; netId: string; fName: string; lName: string; email: string };
  preferredProperty: { propertyId: number; name: string; address: string; propertyType?: string };
}

function fmtDate(d?: string) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function StaffApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("http://localhost:3009/housing/applications");
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(appId: number, newStatus: string) {
    try {
      await fetch(`http://localhost:3009/housing/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast({ title: "Status updated" });
      setApplications(prev => prev.map(a => a.appId === appId ? { ...a, status: newStatus } : a));
      if (selected?.appId === appId) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  }

  function openDetail(app: Application) {
    setSelected(app);
    setSheetOpen(true);
  }

  if (loading) return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-12 w-72 bg-muted animate-pulse rounded-xl" />
      <div className="h-96 bg-muted animate-pulse rounded-2xl" />
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-2xl font-bold tracking-tight">Housing Applications</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Review and manage student housing applications ({applications.length} total)</p>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl py-0 gap-0" style={{ animationDelay: "80ms" }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Student</TableHead>
                <TableHead>NetID</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Preferred Property</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow
                  key={app.appId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openDetail(app)}
                >
                  <TableCell className="font-medium pl-6">{app.user.fName} {app.user.lName}</TableCell>
                  <TableCell className="text-muted-foreground">{app.user.netId}</TableCell>
                  <TableCell>{app.term.replace("_", " ")}</TableCell>
                  <TableCell>
                    <p className="text-sm">{app.preferredProperty?.name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{app.preferredProperty?.address}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {app.submissionDate ? new Date(app.submissionDate).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${getApplicationStatusClass(app.status)} rounded-full px-2.5`}
                    >
                      {app.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6" onClick={e => e.stopPropagation()}>
                    <Select value={app.status} onValueChange={val => updateStatus(app.appId, val)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
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
                <SheetTitle>Application #{selected.appId}</SheetTitle>
                <SheetDescription>{selected.term.replace("_", " ")} · {fmtDate(selected.submissionDate)}</SheetDescription>
              </SheetHeader>

              {/* Status badge */}
              <div className="mb-6 px-6">
                <Badge
                  variant="outline"
                  className={`${getApplicationStatusClass(selected.status)} text-sm px-3 py-1`}
                >
                  {selected.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-6 px-6">
                {/* Student info */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Student</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{selected.user.fName} {selected.user.lName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{selected.user.netId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{selected.user.email}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Property */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preferred Property</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{selected.preferredProperty?.name || "No preference"}</p>
                        <p className="text-sm text-muted-foreground">{selected.preferredProperty?.address}</p>
                        {selected.preferredProperty?.propertyType && (
                          <p className="text-xs text-muted-foreground mt-0.5">{selected.preferredProperty.propertyType.replace("_", " ")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Timeline</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">Submitted {fmtDate(selected.submissionDate)}</span>
                  </div>
                </div>

                <Separator />

                {/* Status update */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Status</h3>
                  <div className="flex items-center gap-2">
                    <Select value={selected.status} onValueChange={val => updateStatus(selected.appId, val)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    {selected.status === 'APPROVED' && (
                      <Button onClick={() => setLeaseDialogOpen(true)}>Create Lease Offer</Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      
      <CreateLeaseDialog 
        open={leaseDialogOpen} 
        onOpenChange={setLeaseDialogOpen} 
        application={selected}
        onLeaseCreated={() => {
            // Can add logic to refresh or notify
            toast({ title: "Lease Sent", description: "The lease has been dispatched to the student." });
            setSheetOpen(false);
        }}
      />
    </div>
  );
}
