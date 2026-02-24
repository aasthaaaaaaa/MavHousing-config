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
import { Loader2, Paperclip, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
    const [file, setFile] = useState<File | null>(null);

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

        if (file && file.size > 20 * 1024 * 1024) {
            toast.error("File size must be strictly less than 20MB.");
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
        if (file) {
            formData.append("file", file);
        }

        try {
            const res = await authApi.post("/announcements", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Announcement broadcasted successfully!");
            setHeading("");
            setMessage("");
            setScope("ALL");
            setScopeValue("");
            setFile(null);

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

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="attachment">File Attachment (Optional, max 20MB)</Label>
                                <div className="flex items-center gap-4">
                                    <Label
                                        htmlFor="attachment"
                                        className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        {file ? file.name : "Choose File"}
                                    </Label>
                                    <input
                                        id="attachment"
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Supported limits: &lt; 20MB</p>
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
                                                {ann.attachmentName ? (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Paperclip className="w-3 h-3" />
                                                        {ann.attachmentName}
                                                    </span>
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
