"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Clock, CheckCircle2, XCircle, MapPin, User, Calendar, Paperclip, Send, ExternalLink, Trash2, Eye, Film, Download } from "lucide-react";
import Link from "next/link";
import { getMaintenanceStatusClass, getPriorityClass } from "@/lib/status-colors";

interface MaintenanceRequest {
  requestId: number;
  category: string;
  priority: string;
  description: string;
  location?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionReason?: string;
  attachments?: string[];
  assignedStaff?: { fName: string; lName: string };
  lease?: { unit?: { unitNumber: string; property: { name: string; address?: string } }; room?: { roomLetter: string } };
}

interface MaintenanceComment {
  id: string;
  content?: string;
  attachmentUrl?: string;
  createdAt: string;
  user: { fName: string; lName: string };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getLocation(r: MaintenanceRequest) {
  if (!r.lease?.unit) return "—";
  return `${r.lease.unit.property.name} / Unit ${r.lease.unit.unitNumber}${r.lease.room ? ` / Rm ${r.lease.room.roomLetter}` : ""}`;
}



export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [comments, setComments] = useState<MaintenanceComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<"image" | "video" | null>(null);

  useEffect(() => {
    if (user?.userId) fetchRequests();
  }, [user]);

  async function fetchRequests() {
    try {
      const res = await fetch(`http://localhost:3009/maintenance/my-requests?userId=${user!.userId}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments(reqId: number) {
    const res = await fetch(`http://localhost:3009/maintenance/requests/${reqId}/comments`);
    if (res.ok) setComments(await res.json());
  }

  function openRequest(r: MaintenanceRequest) {
    setSelected(r);
    setIsDetailsOpen(true);
    fetchComments(r.requestId);
  }

  async function handlePostComment() {
    if (!selected || !user) return;
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
      body: JSON.stringify({ userId: user.userId, content: newComment, attachmentUrl }),
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

  function openViewer(url: string) {
    if (url.match(/\.(mp4|webm|ogg)/i)) {
      setViewerType("video");
    } else {
      setViewerType("image");
    }
    setViewerUrl(url);
  }

  function renderAttachment(url: string, label?: string) {
    const isVideo = !!url.match(/\.(mp4|webm|ogg)/i);
    const isImage = !!url.match(/\.(jpeg|jpg|gif|png|webp)/i);

    return (
      <div key={url} className="flex items-center gap-3 p-2 border rounded-md bg-muted/20">
        <div className="h-10 w-10 flex-shrink-0 bg-muted flex items-center justify-center rounded overflow-hidden">
          {isImage ? (
            <img src={url} alt="thumbnail" className="h-full w-full object-cover" />
          ) : isVideo ? (
            <Film className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{label || 'Attachment'}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {(isImage || isVideo) && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => openViewer(url)}>
              <Eye className="h-3 w-3 mr-1" /> View
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="h-6 text-[10px] px-2">
            <a href={url} target="_blank" rel="noopener noreferrer" download>
              <Download className="h-3 w-3 mr-1" /> Save
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{requests.length} request{requests.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <Button asChild>
          <Link href="/student/maintenance">+ New Request</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "80ms" }}>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg mb-1">No requests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't submitted any maintenance requests.</p>
            <Button asChild>
              <Link href="/student/maintenance">Submit a Request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {requests.map((req, idx) => {
            return (
              <Card
                key={req.requestId}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                style={{ animationDelay: `${80 + idx * 70}ms` }}
                onClick={() => openRequest(req)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {req.category.charAt(0) + req.category.slice(1).toLowerCase()} Issue
                        </CardTitle>
                        {req.lease?.unit && (
                          <CardDescription>
                            {req.lease.unit.property.name} — Unit {req.lease.unit.unitNumber}
                            {req.lease.room ? `, Room ${req.lease.room.roomLetter}` : ""}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${getPriorityClass(req.priority)}`}>
                        {req.priority}
                      </span>
                      <Badge variant="outline" className={`${getMaintenanceStatusClass(req.status)} flex items-center gap-1 rounded-full px-2.5`}>
                        {req.status === "OPEN" && <Clock className="h-3 w-3" />}
                        {req.status === "IN_PROGRESS" && <Wrench className="h-3 w-3" />}
                        {req.status === "RESOLVED" && <CheckCircle2 className="h-3 w-3" />}
                        {req.status === "CLOSED" && <XCircle className="h-3 w-3" />}
                        {req.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{req.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>Submitted {formatDate(req.createdAt)}</span>
                    {req.assignedStaff ? (
                      <span>Assigned to {req.assignedStaff.fName} {req.assignedStaff.lName}</span>
                    ) : req.status === "OPEN" ? (
                      <span className="text-yellow-600">⏳ Awaiting assignment</span>
                    ) : null}
                    {req.resolvedAt && (
                      <span className="text-green-600">✓ Resolved {formatDate(req.resolvedAt)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[70vw] w-[90vw] max-h-[90vh] overflow-y-auto sm:p-0 p-0 gap-0">
          {selected && (
            <div className="py-6">
              <DialogHeader className="pb-4 px-6 pt-2">
                <DialogTitle className="text-xl">Request #{selected.requestId}</DialogTitle>
                <DialogDescription className="text-sm">{selected.category} · {formatDate(selected.createdAt)}</DialogDescription>
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
                <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location</h3>
                    <div className="flex items-start gap-2 h-[48px]">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {getLocation(selected)}
                        {selected.location && (
                          <><br /><span className="text-muted-foreground">Specific: {selected.location}</span></>
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Assigned To</h3>
                    <div className="flex flex-col justify-end h-[48px]">
                      {selected.assignedStaff ? (
                        <p className="text-sm font-medium">{selected.assignedStaff.fName} {selected.assignedStaff.lName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not yet assigned</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Description</h3>
                  <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
                </div>

                {selected.attachments && selected.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Attachments & Media</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {selected.attachments.map((url, idx) => renderAttachment(url, `Attachment ${idx + 1}`))}
                      </div>
                    </div>
                  </>
                )}

                {selected.resolvedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-green-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Resolved on {formatDate(selected.resolvedAt)}</span>
                    </div>
                    {selected.resolutionReason && (
                      <div className="mt-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Resolution Note</h3>
                        <p className="text-sm border-l-2 border-green-500 pl-3 py-1 bg-green-50/50 rounded-r-md text-muted-foreground">
                          {selected.resolutionReason}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <Separator />

                {/* Comments Section */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Comments & Updates</h3>
                  <div className="space-y-4 mb-4">
                    {comments.map(c => (
                      <div key={c.id} className="bg-secondary/40 p-3 rounded-lg text-sm border">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{c.user.fName} {c.user.lName}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                          </div>
                          {c.user.fName === user?.fName && c.user.lName === user?.lName && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteComment(c.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {c.content && <p className="text-foreground whitespace-pre-wrap">{c.content}</p>}
                        {c.attachmentUrl && (
                          <div className="mt-3 max-w-[50%]">
                            {renderAttachment(c.attachmentUrl, "Comment Attachment")}
                          </div>
                        )}
                      </div>
                    ))}
                    {comments.length === 0 && <p className="text-sm text-muted-foreground italic">No comments yet.</p>}
                  </div>

                  {/* Add Comment Input */}
                  <div className="space-y-2 mt-4 bg-muted/20 p-3 rounded-lg border">
                    <Textarea
                      placeholder="Type your message here..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="text-sm min-h-[80px] bg-background resize-y"
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 relative overflow-hidden" disabled={postingComment}>
                          <Paperclip className="h-4 w-4 mr-1" />
                          <span className="text-xs">{attachment ? attachment.name : "Attach file"}</span>
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setAttachment(e.target.files?.[0] || null)} disabled={postingComment} />
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

      {/* Media Viewer Dialog */}
      <Dialog open={!!viewerUrl} onOpenChange={(open) => !open && setViewerUrl(null)}>
        <DialogContent className="max-w-4xl p-1 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[50vh]">
            {viewerType === "image" ? (
              <img src={viewerUrl!} alt="Viewer" className="max-h-[85vh] max-w-full object-contain rounded" />
            ) : viewerType === "video" ? (
              <video src={viewerUrl!} controls autoPlay className="max-h-[85vh] max-w-full rounded" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
