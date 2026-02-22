"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Calendar, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
}

const STATUS_CONFIG: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  DRAFT:        { variant: "outline",     icon: FileText },
  SUBMITTED:    { variant: "default",     icon: Clock },
  UNDER_REVIEW: { variant: "secondary",   icon: Clock },
  APPROVED:     { variant: "default",     icon: CheckCircle2 },
  REJECTED:     { variant: "destructive", icon: XCircle },
};

function getStatusBadge(status: string) {
  const { variant, icon: Icon } = STATUS_CONFIG[status] ?? { variant: "default", icon: FileText };
  return (
    <Badge variant={variant} className="flex items-center gap-1 w-fit">
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading your applications...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Track the status of your housing applications</p>
        </div>
        <Button asChild>
          <Link href="/student/application">+ Apply for Housing</Link>
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card>
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
          {applications.map((app) => (
            <Card key={app.appId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{app.term.replace("_", " ")}</CardTitle>
                    <CardDescription>Application #{app.appId}</CardDescription>
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
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-100 dark:border-green-900">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Congratulations! Your application has been approved. You will receive further instructions via email.
                    </p>
                  </div>
                )}
                {app.status === "REJECTED" && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-100 dark:border-red-900">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Unfortunately, your application was not approved. Please contact housing services for more information.
                    </p>
                  </div>
                )}
                {app.status === "UNDER_REVIEW" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-100 dark:border-blue-900">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Your application is currently under review. We&apos;ll notify you once a decision has been made.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
