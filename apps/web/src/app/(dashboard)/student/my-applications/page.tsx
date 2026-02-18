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

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.userId) {
      fetchApplications();
    }
  }, [user]);

  async function fetchApplications() {
    if (!user?.userId) return;
    
    try {
      // Pass userId as query parameter
      const res = await fetch(`http://localhost:3009/housing/my-applications?userId=${user.userId}`);
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      DRAFT: { variant: "outline", icon: FileText },
      SUBMITTED: { variant: "default", icon: Clock },
      UNDER_REVIEW: { variant: "secondary", icon: Clock },
      APPROVED: { variant: "default", icon: CheckCircle2 },
      REJECTED: { variant: "destructive", icon: XCircle },
    };
    
    const { variant, icon: Icon } = config[status] || { variant: "default", icon: FileText };
    
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading your applications...</div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>You haven't submitted any housing applications yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/student/application">
              <Button>Apply for Housing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-muted-foreground mt-2">
          Track the status of your housing applications
        </p>
      </div>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.appId}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {app.term.replace("_", " ")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Application #{app.appId}
                  </CardDescription>
                </div>
                {getStatusBadge(app.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{app.preferredProperty?.name || "No preference"}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.preferredProperty?.address || ""}
                    </div>
                    {app.preferredProperty?.propertyType && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {app.preferredProperty.propertyType.replace("_", " ")}
                      </div>
                    )}
                  </div>
                </div>

                {app.submissionDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm">
                      Submitted on {new Date(app.submissionDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                )}

                {app.status === "APPROVED" && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      🎉 Congratulations! Your application has been approved. You will receive further instructions via email.
                    </p>
                  </div>
                )}

                {app.status === "REJECTED" && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Unfortunately, your application was not approved. Please contact housing services for more information.
                    </p>
                  </div>
                )}

                {app.status === "UNDER_REVIEW" && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Your application is currently under review. We'll notify you once a decision has been made.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/student/application">
          <Button variant="outline">Submit Another Application</Button>
        </Link>
      </div>
    </div>
  );
}
