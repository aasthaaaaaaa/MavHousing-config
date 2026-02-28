"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Paperclip, Send, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export function AnnouncementsPanel({ roleScope }: { roleScope: "ADMIN" | "STAFF" }) {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [heading, setHeading] = useState("");
    const [message, setMessage] = useState("");
    const [scope, setScope] = useState("ALL");
    const [scopeValue, setScopeValue] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        fetchAnnouncements();
    }, [roleScope]);

    const fetchAnnouncements = async () => {
        try {
            // The internal-api runs on 3009, so we might need to use internalApi if it's exported, or authApi depending on the setup. 
            // AssumingauthApi is configured to proxy or hit the correct backend.
            // Wait, housing stats used `authApi.get('/housing/occupancy-stats')`. We will use authApi.
            const response = await authApi.get(`/announcements?role=${roleScope}`);
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
            toast.error("Failed to load previous announcements");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!heading || !message) {
            toast.error("Please provide a heading and a message.");
            return;
        }
        if (["PROPERTY", "UNIT", "ROOM", "BED", "INDIVIDUAL"].includes(scope) && !scopeValue) {
            toast.error("Please provide a specific identifier for the selected scope.");
            return;
        }

        if (files.some(f => f.size > 10 * 1024 * 1024)) {
            toast.error("Each file size must be strictly less than 10MB.");
            return;
        }

        if (files.length > 5) {
            toast.error("Maximum 5 attachments allowed.");
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append("heading", heading);
        formData.append("message", message);
        formData.append("scope", scope);
        formData.append("scopeValue", scopeValue);
        formData.append("senderRole", roleScope);
        formData.append("senderId", user?.userId?.toString() || "0");
        files.forEach((f) => {
            formData.append("files", f);
        });

        try {
            const res = await authApi.post("/announcements", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Announcement broadcasted successfully!");
            setHeading("");
            setMessage("");
            setScope("ALL");
            setScopeValue("");
            setFiles([]);

            // Update local state without waiting for a re-fetch
            setAnnouncements((prev) => [res.data, ...prev]);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to broadcast the announcement.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 lg:max-w-5xl">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Announcement</CardTitle>
                    <CardDescription>Send an email broadcast to residents or staff.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="heading">Heading / Subject</Label>
                                <Input
                                    id="heading"
                                    placeholder="e.g. Important Maintenance Notice"
                                    value={heading}
                                    onChange={(e) => setHeading(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="message">Message Body</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Provide the full details here..."
                                    className="min-h-[150px]"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Recipient Scope</Label>
                                <Select value={scope} onValueChange={setScope}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Users</SelectItem>
                                        <SelectItem value="ALL_STUDENTS">All Students</SelectItem>
                                        <SelectItem value="ALL_STAFF">All Staff</SelectItem>
                                        <SelectItem value="PROPERTY">Specific Property</SelectItem>
                                        <SelectItem value="UNIT">Specific Unit</SelectItem>
                                        <SelectItem value="ROOM">Specific Room</SelectItem>
                                        <SelectItem value="BED">Specific Bed</SelectItem>
                                        <SelectItem value="INDIVIDUAL">Individual (NetID or Email)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {["PROPERTY", "UNIT", "ROOM", "BED", "INDIVIDUAL"].includes(scope) && (
                                <div className="space-y-2">
                                    <Label htmlFor="scopeValue">
                                        {scope === "INDIVIDUAL" ? "NetID / Email" : `${scope} ID`}
                                    </Label>
                                    <Input
                                        id="scopeValue"
                                        placeholder={`Enter ${scope === "INDIVIDUAL" ? "identifier" : "ID"}`}
                                        value={scopeValue}
                                        onChange={(e) => setScopeValue(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-4 col-span-1 md:col-span-2">
                                <Label className="text-xs font-bold text-muted-foreground">Attachments (Max 5, &lt; 10MB each)</Label>
                                <div className="flex flex-col gap-3 p-4 bg-muted/20 rounded-xl border border-dashed">
                                    <div className="flex flex-wrap gap-2">
                                        {files.map((f, idx) => (
                                            <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 rounded-lg flex items-center gap-2">
                                                <Paperclip className="w-3 h-3" />
                                                <span className="text-[10px] max-w-[150px] truncate">{f.name}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-md"
                                                >
                                                    <XCircle className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {files.length === 0 && (
                                            <p className="text-[10px] text-muted-foreground italic">No files selected</p>
                                        )}
                                    </div>
                                    
                                    {files.length < 5 && (
                                        <div className="flex items-center gap-4">
                                            <Label
                                                htmlFor="attachment"
                                                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted text-xs"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                                Add File
                                            </Label>
                                            <input
                                                id="attachment"
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                    const newFiles = Array.from(e.target.files || []);
                                                    if (files.length + newFiles.length > 5) {
                                                        toast.error("Maximum 5 files allowed");
                                                        return;
                                                    }
                                                    setFiles(prev => [...prev, ...newFiles]);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            {submitting ? "Broadcasting..." : "Broadcast Announcement"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Broadcast History</CardTitle>
                    <CardDescription>Past announcements created by the {roleScope} tier.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading history...</div>
                    ) : announcements.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">No announcements found.</div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Heading</TableHead>
                                        <TableHead>Scope</TableHead>
                                        <TableHead>Attachment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {announcements.map((ann, idx) => (
                                        <TableRow key={ann._id || idx}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell className="font-medium">{ann.heading}</TableCell>
                                            <TableCell>
                                                {ann.scope} {ann.scopeValue ? `(${ann.scopeValue})` : ""}
                                            </TableCell>
                                            <TableCell>
                                                {ann.attachmentNames && ann.attachmentNames.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {ann.attachmentNames.map((name: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                                <Paperclip className="w-2.5 h-2.5" />
                                                                {name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
