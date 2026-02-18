"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Application {
  appId: number;
  term: string;
  status: string;
  submissionDate: string;
  user: {
    netId: string;
    fName: string;
    lName: string;
    email: string;
  };
  preferredProperty: {
    name: string;
    address: string;
  };
}

export default function StaffApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("http://localhost:3009/housing/applications");
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "Application status updated",
      });

      fetchApplications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "outline",
      SUBMITTED: "default",
      UNDER_REVIEW: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

  if (loading) {
    return <div className="p-8">Loading applications...</div>;
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Housing Applications</CardTitle>
          <CardDescription>
            Review and manage student housing applications ({applications.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>NetID</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Preferred Property</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.appId}>
                  <TableCell className="font-medium">
                    {app.user.fName} {app.user.lName}
                  </TableCell>
                  <TableCell>{app.user.netId}</TableCell>
                  <TableCell>{app.term.replace("_", " ")}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{app.preferredProperty?.name || "N/A"}</div>
                      <div className="text-muted-foreground text-xs">
                        {app.preferredProperty?.address || ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {app.submissionDate
                      ? new Date(app.submissionDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={app.status}
                      onValueChange={(val: string) => updateStatus(app.appId, val)}
                    >
                      <SelectTrigger className="w-[140px]">
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
    </div>
  );
}
