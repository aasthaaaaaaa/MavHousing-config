"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, Wrench, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "PLUMBING", label: "🔧 Plumbing" },
  { value: "HVAC", label: "❄️ HVAC / Heating & Cooling" },
  { value: "ELECTRICAL", label: "⚡ Electrical" },
  { value: "INTERNET", label: "🌐 Internet / Cable" },
  { value: "APPLIANCE", label: "🍳 Appliance" },
  { value: "STRUCTURAL", label: "🏗️ Structural" },
  { value: "OTHER", label: "📋 Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low — Can wait a few days", color: "text-green-600" },
  { value: "MEDIUM", label: "Medium — Needs attention soon", color: "text-yellow-600" },
  { value: "HIGH", label: "High — Urgent issue", color: "text-orange-600" },
  { value: "EMERGENCY", label: "Emergency — Immediate safety risk", color: "text-red-600" },
];

export default function MaintenancePage() {
  const { user } = useAuth();
  const [leaseId, setLeaseId] = useState<number | null>(null);
  const [noLease, setNoLease] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.userId) fetchActiveLease();
  }, [user]);

  async function fetchActiveLease() {
    try {
      const res = await fetch(`http://localhost:3009/maintenance/active-lease?userId=${user!.userId}`);
      const data = await res.json();
      if (data?.leaseId) {
        setLeaseId(data.leaseId);
      } else {
        setNoLease(true);
      }
    } catch {
      setNoLease(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !description.trim() || !leaseId || !user?.userId) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3009/maintenance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          leaseId,
          category,
          priority,
          description: description.trim(),
        }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (noLease) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Lease Found</h2>
        <p className="text-muted-foreground mb-4">
          You need an active lease to submit maintenance requests. Please contact housing staff.
        </p>
        <Button variant="outline" asChild>
          <Link href="/student/my-lease">View My Lease</Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-12">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Request Submitted!</h2>
        <p className="text-muted-foreground mb-6">
          Your maintenance request has been received. Staff will be in touch soon.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setSubmitted(false); setCategory(""); setDescription(""); }}>
            Submit Another
          </Button>
          <Button asChild>
            <Link href="/student/maintenance/my-requests">View My Requests</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Submit Maintenance Request</h1>
        </div>
        <p className="text-muted-foreground">Describe the issue in your unit and we'll get it resolved.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>Fill out the form below to report an issue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                      priority === p.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className={`mt-0.5 h-3 w-3 rounded-full flex-shrink-0 ${
                      p.value === "LOW" ? "bg-green-500" :
                      p.value === "MEDIUM" ? "bg-yellow-500" :
                      p.value === "HIGH" ? "bg-orange-500" : "bg-red-500"
                    }`} />
                    <div>
                      <p className={`text-sm font-semibold ${p.color}`}>{p.value}</p>
                      <p className="text-xs text-muted-foreground">{p.label.split(" — ")[1]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail — when it started, where it is, how severe it is..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !category || !description.trim()}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/student/maintenance/my-requests" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
          View my existing requests →
        </Link>
      </div>
    </div>
  );
}
