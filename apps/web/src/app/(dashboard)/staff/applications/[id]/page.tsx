"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, MapPin, Calendar, FileText, Phone, Mail, 
  ArrowLeft, CheckCircle2, XCircle, Clock, ShieldAlert,
  Home, CreditCard, Users
} from "lucide-react";
import { getApplicationStatusClass } from "@/lib/status-colors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateLeaseDialog } from "@/components/create-lease-dialog";

interface ApplicationDetail {
  appId: number;
  term: string;
  status: string;
  submissionDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  cleanliness: string;
  noiseLevel: string;
  sleepSchedule: string;
  smokingPreference: string;
  dietaryRestrictions: string;
  specialAccommodations: string;
  idCardUrl: string;
  user: {
    userId: number;
    netId: string;
    utaId: string;
    fName: string;
    lName: string;
    email: string;
    phone: string;
    gender: string;
    profilePicUrl: string;
    requiresAdaAccess: boolean;
    leases: Array<{
      leaseId: number;
      leaseType: string;
      startDate: string;
      endDate: string;
      status: string;
      unit?: { unitNumber: string };
      room?: { roomNumber: string };
      bed?: { bedCode: string };
    }>;
  };
  preferredProperty: {
    propertyId: number;
    name: string;
    address: string;
    propertyType: string;
  };
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  async function fetchApplication() {
    try {
      const res = await fetch(`http://localhost:3009/housing/applications/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setApp(data);
    } catch {
      toast({ title: "Error", description: "Failed to load application details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!app) return;
    try {
      await fetch(`http://localhost:3009/housing/applications/${app.appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast({ title: "Status updated" });
      setApp({ ...app, status: newStatus });
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  }

  if (loading) return (
    <div className="p-8 space-y-6">
      <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-96 bg-muted animate-pulse rounded-xl col-span-1" />
        <div className="h-96 bg-muted animate-pulse rounded-xl col-span-2" />
      </div>
    </div>
  );

  if (!app) return <div className="p-8 text-center">Application not found.</div>;

  const currentLease = app.user.leases.find(l => l.status === 'SIGNED' || l.status === 'ACTIVE');

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Detail</h1>
            <p className="text-muted-foreground">ID: #{app.appId} • Submitted on {new Date(app.submissionDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${getApplicationStatusClass(app.status)} px-3 py-1 text-sm rounded-full variant-outline bg-opacity-10 border-2`}>
            {app.status.replace("_", " ")}
          </Badge>
          <Select value={app.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Student Profile */}
        <div className="space-y-8">
          <Card className="rounded-2xl overflow-hidden border-none shadow-premium bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto relative group">
                {app.user.profilePicUrl ? (
                  <img 
                    src={app.user.profilePicUrl} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-xl mb-4 transition-transform group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-xl">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {app.user.requiresAdaAccess && (
                  <div className="absolute top-0 right-0 p-1.5 bg-destructive rounded-full border-2 border-background shadow-lg" title="ADA Accommodations Required">
                    <ShieldAlert className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">{app.user.fName} {app.user.lName}</CardTitle>
              <CardDescription className="font-mono text-sm">{app.user.netId} • {app.user.utaId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator className="opacity-50" />
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{app.user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{app.user.phone || "No phone provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Gender: {app.user.gender || "Not specified"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ID Card Display */}
          <Card className="rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Submitted ID Card
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {app.idCardUrl ? (
                <div className="relative group rounded-xl overflow-hidden border">
                  <img 
                    src={app.idCardUrl} 
                    alt="ID Card" 
                    className="w-full h-auto object-cover transition-transform group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(app.idCardUrl, '_blank')}>
                      View Full Size
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-40 bg-muted rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No ID card image found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-medium">{app.emergencyContactName}</p>
              <p className="text-sm text-muted-foreground">{app.emergencyContactRelation}</p>
              <p className="text-sm flex items-center gap-1.5 mt-2">
                <Phone className="h-3.5 w-3.5" />
                {app.emergencyContactPhone}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Application Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card text-card-foreground flex flex-col gap-6 py-6 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Term Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{app.term.replace("_", " ")}</p>
              </CardContent>
            </Card>
            <Card className="bg-card text-card-foreground flex flex-col gap-6 py-6 rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Preferred Property</CardTitle>
              </CardHeader>
              <CardContent className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-bold">{app.preferredProperty?.name || "No Preference"}</p>
                  <p className="text-sm text-muted-foreground truncate">{app.preferredProperty?.address}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Matching Preferences</CardTitle>
              <CardDescription>Lifestyle choices for roommate matching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Cleanliness</Label>
                  <p className="font-medium mt-1">{app.cleanliness}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Noise Level</Label>
                  <p className="font-medium mt-1">{app.noiseLevel}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Sleep Schedule</Label>
                  <p className="font-medium mt-1">{app.sleepSchedule}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Smoking</Label>
                  <p className="font-medium mt-1">{app.smokingPreference}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Dietary Restrictions</Label>
                  <p className="font-medium mt-1">{app.dietaryRestrictions || "None"}</p>
                </div>
              </div>
              
              {app.specialAccommodations && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <Label className="text-xs text-primary uppercase font-bold">Special Accommodations Requested</Label>
                  <p className="text-sm mt-1">{app.specialAccommodations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Lease Info */}
          <Card className="rounded-2xl shadow-premium border-none bg-gradient-to-r from-blue-600/5 to-purple-600/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                Current Lease Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLease ? (
                <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Lease ID</p>
                        <p className="text-xl font-mono font-bold tracking-tighter">LEA-{currentLease.leaseId.toString().padStart(6, '0')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Starts: {new Date(currentLease.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Ends: {new Date(currentLease.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-full w-px bg-border hidden md:block" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-bold text-lg">Unit {currentLease.unit?.unitNumber || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">Room {currentLease.room?.roomNumber || "N/A"} · Bed {currentLease.bed?.bedCode || "N/A"}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-4 py-1 rounded-full font-bold">
                       {currentLease.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-lg">No Active Lease</h3>
                  <p className="text-muted-foreground text-sm">This student does not have an active or signed lease record.</p>
                  {app.status === 'APPROVED' && (
                    <Button className="mt-4" onClick={() => setLeaseDialogOpen(true)}>
                      Issue Lease Offer
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateLeaseDialog 
        open={leaseDialogOpen} 
        onOpenChange={setLeaseDialogOpen} 
        application={app as any}
        onLeaseCreated={() => {
            toast({ title: "Lease Sent", description: "The lease has been dispatched to the student." });
            fetchApplication();
        }}
      />
    </div>
  );
}

function Label({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={className}>{children}</span>;
}
