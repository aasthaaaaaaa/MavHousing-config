"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, Wrench, Loader2, UploadCloud, X, Image as ImageIcon, Video } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "HVAC", label: "HVAC / Heating & Cooling" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "INTERNET", label: "Internet / Cable" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "OTHER", label: "Other" },
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
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
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

  // Very fast client-side image compression before upload
  async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              }));
            } else {
              resolve(file); // fallback
            }
          }, file.type, 0.85); // 85% quality
        };
      };
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    if (attachments.length + selectedFiles.length > 5) {
      toast.error("You can only attach a maximum of 5 files.");
      return;
    }

    const validFiles = selectedFiles.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File ${f.name} is too large (> 10MB)`);
        return false;
      }
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        toast.error(`File ${f.name} is not an image or video`);
        return false;
      }
      return true;
    });

    // Compress images before storing in state
    const compressedFiles = await Promise.all(validFiles.map(f => compressImage(f)));
    setAttachments(prev => [...prev, ...compressedFiles]);

    // reset input
    e.target.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !description.trim() || !leaseId || !user?.userId) return;
    setLoading(true);
    let uploadedUrls: string[] = [];

    try {
      // 1. Upload attachments first if they exist
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(file => {
          formData.append('files', file);
        });
        formData.append('userId', user.userId.toString());

        const uploadRes = await fetch("http://localhost:3009/housing/maintenance/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload attachments");
        uploadedUrls = await uploadRes.json();
      }

      // 2. Submit the maintenance request JSON block
      const res = await fetch("http://localhost:3009/maintenance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          leaseId,
          category,
          priority,
          location: location.trim() || undefined,
          description: description.trim(),
          attachments: uploadedUrls,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setAttachments([]);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to submit request.");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (noLease) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
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
      <div className="p-6 max-w-xl mx-auto text-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Request Submitted!</h2>
        <p className="text-muted-foreground mb-6">
          Your maintenance request has been received. Staff will be in touch soon.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => {
            setSubmitted(false);
            setCategory("");
            setLocation("");
            setDescription("");
            setAttachments([]);
          }}>
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
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Submit Maintenance Request</h1>
        </div>
        <p className="text-muted-foreground text-sm">Describe the issue in your unit and we'll get it resolved.</p>
      </div>

      <Card className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both" style={{ animationDelay: "80ms" }}>
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
                    className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${priority === p.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                      }`}
                  >
                    <div className={`mt-0.5 h-3 w-3 rounded-full flex-shrink-0 ${p.value === "LOW" ? "bg-green-500" :
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

            {/* Specific Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Specific Location</Label>
              <Input
                id="location"
                placeholder="e.g. Kitchen sink, Bedroom 2 window, Hallway..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
              />
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

            {/* Attachments */}
            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <div className="text-xs text-muted-foreground mb-2">Attach photos or short videos demonstrating the issue. Limit 5 files, under 10MB each.</div>

              <div
                className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors relative"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UploadCloud className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">Supported: JPEG, PNG, MP4, WEBM</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={attachments.length >= 5 || loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="relative group overflow-hidden rounded-lg border bg-background flex items-center gap-2 p-2">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                        {file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <Video className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate pr-6">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute right-1 top-1 bottom-1 px-2 text-muted-foreground hover:text-destructive bg-background/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
