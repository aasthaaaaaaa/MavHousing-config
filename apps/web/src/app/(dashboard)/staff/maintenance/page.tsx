"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wrench, MapPin, User, Calendar, AlertTriangle, Paperclip, Send, Download, ExternalLink, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Wrench, MapPin, User, Calendar, AlertTriangle } from "lucide-react";
import { getMaintenanceStatusClass, getPriorityClass } from "@/lib/status-colors";

interface MaintenanceRequest {
  requestId: number;
  category: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionReason?: string;
  createdBy: { netId: string; fName: string; lName: string; email: string };
  assignedStaff?: { userId: number; fName: string; lName: string };
  lease?: { unit?: { unitNumber: string; property: { name: string; address: string } }; room?: { roomLetter: string } };
}

interface MaintenanceComment {
  id: string;
  content?: string;
  attachmentUrl?: string;
  createdAt: string;
  user: { fName: string; lName: string };
}

interface StaffMember { userId: number; fName: string; lName: string; netId: string }

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function getLocation(r: MaintenanceRequest) {
  if (!r.lease?.unit) return "—";
  return `${r.lease.unit.property.name} / Unit ${r.lease.unit.unitNumber}${r.lease.room ? ` / Rm ${r.lease.room.roomLetter}` : ""}`;
}

export default function StaffMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [resolutionPrompt, setResolutionPrompt] = useState<{ requestId: number } | null>(null);
  const [resolutionReason, setResolutionReason] = useState("");
  const [comments, setComments] = useState<MaintenanceComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [reqRes, staffRes] = await Promise.all([
      fetch("http://localhost:3009/maintenance/requests").then(r => r.json()).catch(() => []),
      fetch("http://localhost:3009/maintenance/staff").then(r => r.json()).catch(() => []),
    ]);
    setRequests(Array.isArray(reqRes) ? reqRes : []);
    setStaffList(Array.isArray(staffRes) ? staffRes : []);
    setLoading(false);
  }

  async function handleStatusChange(requestId: number, status: string, reason?: string) {
    if (status === "RESOLVED" && !reason) {
      setResolutionPrompt({ requestId });
      return;
    }
    setUpdating(requestId);
    try {
      await fetch(`http://localhost:3009/maintenance/requests/${requestId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionReason: reason }),
      });
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status, resolutionReason: reason } : r));
      if (selected?.requestId === requestId) setSelected(prev => prev ? { ...prev, status, resolutionReason: reason } : null);
      if (status === "RESOLVED") {
        setResolutionPrompt(null);
        setResolutionReason("");
      }
    } finally { setUpdating(null); }
  }

  async function handleAssignStaff(requestId: number, staffId: number) {
    setUpdating(requestId);
    try {
      await fetch(`http://localhost:3009/maintenance/requests/${requestId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS", staffId }),
      });
      const assigned = staffList.find(s => s.userId === staffId);
      setRequests(prev => prev.map(r =>
        r.requestId === requestId
          ? { ...r, status: "IN_PROGRESS", assignedStaff: assigned ? { userId: assigned.userId, fName: assigned.fName, lName: assigned.lName } : r.assignedStaff }
          : r
      ));
      if (selected?.requestId === requestId && assigned) {
        setSelected(prev => prev ? { ...prev, status: "IN_PROGRESS", assignedStaff: { userId: assigned.userId, fName: assigned.fName, lName: assigned.lName } } : null);
      }
    } finally { setUpdating(null); }
  }

  async function fetchComments(reqId: number) {
    const res = await fetch(`http://localhost:3009/maintenance/requests/${reqId}/comments`);
    if (res.ok) setComments(await res.json());
  }

  async function handlePostComment() {
    if (!selected) return;
    if (!newComment.trim() && !attachment) return;
    setPostingComment(true);
    let attachmentUrl = undefined;

    if (attachment) {
      const formData = new FormData();
      formData.append("file", attachment);
      try {
        const uploadRes = await fetch("http://localhost:3009/maintenance/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          attachmentUrl = uploadData.url;
        } else {
          const errData = await uploadRes.json();
          alert(`File upload failed: ${errData.message?.message || errData.message || 'Server error'}`);
          setPostingComment(false);
          return;
        }
      } catch (err) {
        alert("An error occurred while uploading. Please check server logs.");
        setPostingComment(false);
        return;
      }
    }

    await fetch(`http://localhost:3009/maintenance/requests/${selected.requestId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 1, content: newComment, attachmentUrl }),
    });

    setNewComment("");
    setAttachment(null);
    fetchComments(selected.requestId);
    setPostingComment(false);
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`http://localhost:3009/maintenance/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        alert("Failed to delete comment");
      }
    } catch {
      alert("An error occurred while deleting the comment.");
    }
  }

  function open(r: MaintenanceRequest) {
    setSelected(r);
    setIsDetailsOpen(true);
    fetchComments(r.requestId);
  }

  const sortedRequests = [...requests].sort((a, b) => {
    const aIsDone = a.status === "RESOLVED" || a.status === "CLOSED";
    const bIsDone = b.status === "RESOLVED" || b.status === "CLOSED";
    if (aIsDone && !bIsDone) return 1;
    if (!aIsDone && bIsDone) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filtered = sortedRequests.filter(r =>
    (filterStatus === "ALL" || r.status === filterStatus) &&
    (filterPriority === "ALL" || r.priority === filterPriority)
  );

  const stats = {
    open: requests.filter(r => r.status === "OPEN").length,
    inProgress: requests.filter(r => r.status === "IN_PROGRESS").length,
    resolved: requests.filter(r => r.status === "RESOLVED").length,
    emergency: requests.filter(r => r.priority === "EMERGENCY" && !["RESOLVED", "CLOSED"].includes(r.status)).length,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Review and manage all incoming maintenance requests</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Open", value: stats.open, color: "text-blue-600" },
          { label: "In Progress", value: stats.inProgress, color: "text-yellow-600" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600" },
          { label: "Emergency", value: stats.emergency, color: "text-red-600" },
        ].map((s, idx) => (
          <Card
            key={s.label}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 py-0 gap-0"
            style={{ animationDelay: `${80 + idx * 70}ms` }}
          >
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap items-center animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both" style={{ animationDelay: "360ms" }}>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            {["LOW", "MEDIUM", "HIGH", "EMERGENCY"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl py-0 gap-0" style={{ animationDelay: "440ms" }}>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading requests...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No requests match the selected filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Tenant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(req => (
                  <TableRow key={req.requestId} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => open(req)}>
                    <TableCell className="pl-6">
                      <p className="font-medium">{req.createdBy.fName} {req.createdBy.lName}</p>
                      <p className="text-xs text-muted-foreground">{req.createdBy.netId}</p>
                    </TableCell>
                    <TableCell className="text-sm">{req.category}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getPriorityClass(req.priority)}`}>
                        {req.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(req.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getMaintenanceStatusClass(req.status)} rounded-full px-2.5`}>{req.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                      <Select value={req.status} onValueChange={val => handleStatusChange(req.requestId, val)} disabled={updating === req.requestId}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[70vw] w-[90vw] max-h-[90vh] overflow-y-auto sm:p-0 p-0 gap-0">
          {selected && (
            <div className="py-6">
              <DialogHeader className="pb-4 px-6 pt-2">
                <DialogTitle>Request #{selected.requestId}</DialogTitle>
                <DialogDescription>{selected.category} · {fmtDate(selected.createdAt)}</DialogDescription>
              </DialogHeader>

              <div className="px-6 mb-6 flex items-center gap-2">
                <Badge variant="outline" className={`${getMaintenanceStatusClass(selected.status)} text-sm px-3 py-1`}>
                  {selected.status.replace("_", " ")}
                </Badge>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getPriorityClass(selected.priority)}`}>
                  {selected.priority}
                </span>
              </div>

              <div className="space-y-6 px-6">
                {/* 2x2 Grid for Core Details */}
                <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                  {/* Submitter */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Submitted By</h3>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{selected.createdBy.fName} {selected.createdBy.lName}</span></div>
                      <div className="flex items-center gap-2"><span className="h-4 w-4" /><span className="text-sm text-muted-foreground">{selected.createdBy.netId}</span></div>
                      <div className="flex items-center gap-2"><span className="h-4 w-4" /><span className="text-sm text-muted-foreground">{selected.createdBy.email}</span></div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location</h3>
                    <div className="flex items-start gap-2 h-[68px]">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{getLocation(selected)}</span>
                    </div>
                  </div>

                  {/* Assign staff */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Assigned To</h3>
                    <div className="flex flex-col justify-end h-[68px]">
                      {selected.assignedStaff ? (
                        <p className="text-sm font-medium mb-2">{selected.assignedStaff.fName} {selected.assignedStaff.lName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-2">Not yet assigned</p>
                      )}
                      <Select
                        value={selected.assignedStaff ? String(selected.assignedStaff.userId) : "none"}
                        onValueChange={val => val !== "none" && handleAssignStaff(selected.requestId, parseInt(val))}
                        disabled={updating === selected.requestId}
                      >
                        <SelectTrigger><SelectValue placeholder="Assign staff..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {staffList.map(s => <SelectItem key={s.userId} value={String(s.userId)}>{s.fName} {s.lName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Status</h3>
                    <div className="flex flex-col justify-end h-[68px]">
                      <Select
                        value={selected.status}
                        onValueChange={val => handleStatusChange(selected.requestId, val)}
                        disabled={updating === selected.requestId}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                </div>

                {selected.resolvedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-green-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Resolved {fmtDate(selected.resolvedAt)}</span>
                    </div>
                  </>
                )}

                {/* Resolution Reason */}
                {selected.status === "RESOLVED" && selected.resolutionReason && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resolution Reason</h3>
                      <p className="text-sm border-l-2 border-green-500 pl-3 py-1 bg-green-50/50 rounded-r-md text-muted-foreground">{selected.resolutionReason}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Comments Section */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Comments & Updates</h3>

                  <div className="space-y-4 mb-4">
                    {comments.map(c => (
                      <div key={c.id} className="bg-muted/30 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{c.user.fName} {c.user.lName}</span>
                            <span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteComment(c.id)}
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {c.content && <p className="text-muted-foreground whitespace-pre-wrap">{c.content}</p>}
                        {c.attachmentUrl && (
                          <div className="mt-2">
                            {c.attachmentUrl.match(/\\.(jpeg|jpg|gif|png)$/i) ? (
                              <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <img src={c.attachmentUrl} alt="Attachment" className="h-20 w-auto rounded border hover:opacity-80 transition-opacity" />
                              </a>
                            ) : (
                              <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                <ExternalLink className="h-4 w-4" /> Download Attachment
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {comments.length === 0 && <p className="text-sm text-muted-foreground italic">No comments yet.</p>}
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type a comment..."
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      className="text-sm min-h-[60px]"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 relative overflow-hidden" disabled={postingComment}>
                          <Paperclip className="h-4 w-4 mr-1" />
                          <span className="text-xs">{attachment ? attachment.name : "Attach"}</span>
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => setAttachment(e.target.files?.[0] || null)}
                            disabled={postingComment}
                          />
                        </Button>
                        {attachment && (
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500" onClick={() => setAttachment(null)}>Clear</Button>
                        )}
                      </div>
                      <Button size="sm" className="h-8" onClick={handlePostComment} disabled={postingComment || (!newComment.trim() && !attachment)}>
                        <Send className="h-4 w-4 mr-1" />
                        <span className="text-xs">Send</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolutionPrompt} onOpenChange={(open) => !open && setResolutionPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Request</DialogTitle>
            <DialogDescription>Please provide a reason or summary for resolving this request.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Work performed, parts replaced, etc."
            value={resolutionReason}
            onChange={(e) => setResolutionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionPrompt(null)}>Cancel</Button>
            <Button onClick={() => resolutionPrompt && handleStatusChange(resolutionPrompt.requestId, "RESOLVED", resolutionReason)} disabled={!resolutionReason.trim()}>
              Save & Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
