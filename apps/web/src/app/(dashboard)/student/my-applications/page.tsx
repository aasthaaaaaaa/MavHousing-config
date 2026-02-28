"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Calendar, MapPin, CheckCircle2, Clock, XCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApplicationStatusClass } from "@/lib/status-colors";
import { toast } from "sonner";
import { formatTerm } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Application {
  appId: number;
  term: string;
  status: string;
  submissionDate: string;
  preferredProperty: {
    name: string;
    address: string;
    propertyType: string;
  };
  specialAccommodations?: string;
}

function getStatusBadge(status: string) {
  const iconMap: Record<string, any> = {
    DRAFT: FileText, SUBMITTED: Clock, UNDER_REVIEW: Clock, APPROVED: CheckCircle2, REJECTED: XCircle,
  };
  const Icon = iconMap[status] ?? FileText;
  return (
    <Badge variant="outline" className={`${getApplicationStatusClass(status)} flex items-center gap-1 w-fit rounded-full px-2.5`}>
      <Icon className="w-3 h-3" />
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.userId) fetchApplications();
  }, [user]);

  async function fetchApplications() {
    try {
      const res = await fetch(`http://localhost:3009/housing/my-applications?userId=${user!.userId}`);
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(appId: number) {
    try {
      const res = await fetch(`http://localhost:3009/housing/applications/${appId}?userId=${user!.userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setApplications(prev => prev.filter(app => app.appId !== appId));
        toast.success("Application removed successfully.");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to remove the application. Please try again later.");
      }
    } catch (error) {
      console.error("Failed to remove application:", error);
      toast.error("An error occurred while trying to remove the application.");
    }
  }

  async function handleAcceptInvite(appId: number) {
    try {
      // Approving the invite application triggers the lease creation/occupant logic implicitly
      const res = await fetch(`http://localhost:3009/housing/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (res.ok) {
        toast.success("Invitation accepted! You are now an occupant on the lease.");
        fetchApplications();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to accept invitation.");
      }
    } catch {
      toast.error("An error occurred accepting the invitation.");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track the status of your housing applications</p>
        </div>
        <Button asChild>
          <Link href="/student/application">+ Apply for Housing</Link>
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "80ms" }}>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven&apos;t submitted any housing applications yet.</p>
            <Button asChild>
              <Link href="/student/application">Apply for Housing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {applications.map((app, idx) => (
            <Card
              key={app.appId}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ animationDelay: `${80 + idx * 70}ms` }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {app.specialAccommodations?.startsWith("INVITE_LEASE:") ? "Lease Invitation" : formatTerm(app.term)}
                    </CardTitle>
                    <CardDescription>
                      {app.specialAccommodations?.startsWith("INVITE_LEASE:")
                        ? "You have been invited to join a lease"
                        : `Application #${app.appId}`
                      }
                    </CardDescription>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{app.preferredProperty?.name || "No preference"}</p>
                    <p className="text-xs text-muted-foreground">{app.preferredProperty?.address || ""}</p>
                    {app.preferredProperty?.propertyType && (
                      <p className="text-xs text-muted-foreground">{app.preferredProperty.propertyType.replace("_", " ")}</p>
                    )}
                  </div>
                </div>

                {app.submissionDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Submitted {new Date(app.submissionDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                )}

                {app.status === "APPROVED" && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-xl border border-green-100 dark:border-green-900">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Congratulations! Your application has been approved. You will receive further instructions via email.
                    </p>
                  </div>
                )}
                {app.status === "REJECTED" && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-xl border border-red-100 dark:border-red-900">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Unfortunately, your application was not approved. Please contact housing services for more information.
                    </p>
                  </div>
                )}
                {app.status === "UNDER_REVIEW" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Your application is currently under review. We&apos;ll notify you once a decision has been made.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end pt-0 pb-5 gap-2">

                {app.specialAccommodations?.startsWith("INVITE_LEASE:") && app.status !== "APPROVED" ? (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-colors">
                          Decline
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to decline this lease invitation? This will permanently remove the application.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemove(app.appId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Decline
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm">
                          Accept Invite
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Accept Lease Invitation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to accept this invitation? You will be officially added as an occupant to this lease.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleAcceptInvite(app.appId)}>
                            Accept and Join
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-colors gap-2">
                        <Trash2 className="w-4 h-4" />
                        Remove Application
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently remove your housing application for {formatTerm(app.term)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemove(app.appId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
