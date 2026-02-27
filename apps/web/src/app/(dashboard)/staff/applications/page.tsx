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
import { useRouter } from "next/navigation";
import { User, MapPin, Calendar, FileText, Clock, CheckCircle2, XCircle, Search, FilterX, ChevronDown } from "lucide-react";
import { CreateLeaseDialog } from "@/components/create-lease-dialog";
import { getApplicationStatusClass } from "@/lib/status-colors";
import { Input } from "@/components/ui/input";

interface Application {
  appId: number;
  term: string;
  status: string;
  submissionDate: string;
  user: { userId: number; netId: string; fName: string; lName: string; email: string; profilePicUrl?: string };
  preferredProperty: { propertyId: number; name: string; address: string; propertyType?: string };
}

function fmtDate(d?: string) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function StaffApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced Filter state
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [selected, setSelected] = useState<Application | null>(null);
  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("http://localhost:3009/housing/applications");
      const data = await res.json();
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => 
        new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
      );
      setApplications(sorted);
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
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  }

  function openDetail(app: Application) {
    router.push(`/staff/applications/${app.appId}`);
  }

  const clearFilters = () => {
    setSearchTerm("");
    setSearchQuery("");
    setFilterProperty("all");
    setFilterTerm("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  const properties = Array.from(new Set(applications.map(a => a.preferredProperty?.name).filter(Boolean)));
  const terms = Array.from(new Set(applications.map(a => a.term).filter(Boolean)));

  const filteredApplications = applications.filter(app => {
    // 1. Text Search
    const q = searchQuery.toLowerCase();
    if (q) {
      const matchesText = (
        app.user.netId.toLowerCase().includes(q) ||
        `${app.user.fName} ${app.user.lName}`.toLowerCase().includes(q) ||
        (app.preferredProperty?.name || "").toLowerCase().includes(q) ||
        (app.preferredProperty?.propertyType || "").toLowerCase().includes(q) ||
        app.term.toLowerCase().includes(q) ||
        app.status.toLowerCase().includes(q)
      );
      if (!matchesText) return false;
    }

    // 2. Property Filter
    if (filterProperty !== "all" && app.preferredProperty?.name !== filterProperty) return false;

    // 3. Term Filter
    if (filterTerm !== "all" && app.term !== filterTerm) return false;

    // 4. Status Filter
    if (filterStatus !== "all" && app.status !== filterStatus) return false;

    // 5. Date Filter
    if (dateFrom || dateTo) {
      const subDate = new Date(app.submissionDate).getTime();
      if (dateFrom && subDate < new Date(dateFrom).getTime()) return false;
      if (dateTo) {
        // End of day for dateTo
        const endDay = new Date(dateTo);
        endDay.setHours(23, 59, 59, 999);
        if (subDate > endDay.getTime()) return false;
      }
    }

    return true;
  });

  if (loading) return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-12 w-72 bg-muted animate-pulse rounded-xl" />
      <div className="h-96 bg-muted animate-pulse rounded-2xl" />
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Housing Applications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review and manage student housing applications ({applications.length} total)</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Quick search..."
              className="pl-10 h-11 rounded-2xl border-none shadow-sm bg-card hover:shadow-md focus:shadow-md transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchTerm)}
            />
          </div>
          <Button 
            className="rounded-2xl h-11 px-8 font-bold shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            onClick={() => setSearchQuery(searchTerm)}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Property</Label>
          <Select value={filterProperty} onValueChange={setFilterProperty}>
            <SelectTrigger className="h-10 rounded-xl bg-card border-none shadow-sm hover:shadow-md transition-all text-sm font-medium">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Academic Term</Label>
          <Select value={filterTerm} onValueChange={setFilterTerm}>
            <SelectTrigger className="h-10 rounded-xl bg-card border-none shadow-sm hover:shadow-md transition-all text-sm font-medium">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">All Terms</SelectItem>
              {terms.map(t => (
                <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-10 rounded-xl bg-card border-none shadow-sm hover:shadow-md transition-all text-sm font-medium">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Submission Range</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="date"
              className="h-10 w-[140px] rounded-xl bg-card border-none shadow-sm text-xs py-1"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-muted-foreground text-xs font-bold">to</span>
            <Input 
              type="date"
              className="h-10 w-[140px] rounded-xl bg-card border-none shadow-sm text-xs py-1"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-end h-full pt-5">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-10 px-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors text-xs font-bold gap-2"
            onClick={clearFilters}
          >
            <FilterX className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl py-0 gap-0 overflow-hidden" style={{ animationDelay: "80ms" }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 h-12">Student</TableHead>
                <TableHead>NetID</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Preferred Property</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                  <TableRow
                    key={app.appId}
                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => openDetail(app)}
                  >
                    <TableCell className="font-semibold pl-6">{app.user.fName} {app.user.lName}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{app.user.netId}</TableCell>
                    <TableCell>{app.term.replace("_", " ")}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{app.preferredProperty?.name || "N/A"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{app.preferredProperty?.propertyType || ""}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {app.submissionDate ? new Date(app.submissionDate).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge
                        variant="outline"
                        className={`${getApplicationStatusClass(app.status)} rounded-full px-3 py-0.5 text-[11px] font-bold border-2`}
                      >
                        {app.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No applications found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selected && (
        <CreateLeaseDialog 
          open={leaseDialogOpen} 
          onOpenChange={setLeaseDialogOpen} 
          application={selected}
          onLeaseCreated={() => {
              toast({ title: "Lease Sent", description: "The lease has been dispatched to the student." });
          }}
        />
      )}
    </div>
  );
}
