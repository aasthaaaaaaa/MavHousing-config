"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat, Message } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Send, CheckCheck, Paperclip, X, Image as ImageIcon, Film, Download, Eye, FileText } from "lucide-react";

interface ChatRoomProps {
    leaseId: number;
    userId: number;
    userName: string;
}

export function ChatRoom({ leaseId, userId, userName }: ChatRoomProps) {
    const { messages, isConnected, sendMessage } = useChat(leaseId, userId);
    const [inputValue, setInputValue] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);

    // Viewer State
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerType, setViewerType] = useState<"image" | "video" | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        fetch(`http://localhost:3009/chat/documents/${leaseId}`)
            .then(res => res.json())
            .then(data => setDocuments(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, [leaseId]);

    const handleSend = async () => {
        if (!inputValue.trim() && !attachment) return;

        let contentObj = inputValue.trim();

        if (attachment) {
            if (attachment.size > 10 * 1024 * 1024) {
                alert("File must be under 10MB");
                return;
            }
            setUploading(true);
            const formData = new FormData();
            formData.append("file", attachment);
            formData.append("leaseId", leaseId.toString());
            formData.append("senderId", userId.toString());

            try {
                const uploadRes = await fetch("http://localhost:3009/chat/upload", {
                    method: "POST",
                    body: formData,
                });
                if (uploadRes.ok) {
                    const docData = await uploadRes.json();
                    setDocuments(prev => [docData, ...prev]);
                    contentObj = `[FILE]::<${docData.url}>||<${docData.fileName}>||<${docData.fileType}>`;
                } else {
                    alert("Failed to upload attachment");
                    setUploading(false);
                    return;
                }
            } catch (err) {
                alert("Upload error.");
                setUploading(false);
                return;
            }
        }

        if (contentObj) {
            sendMessage(contentObj);
        }
        setInputValue("");
        setAttachment(null);
        setUploading(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    const renderMessageContent = (content: string) => {
        if (content.startsWith("[FILE]::<") && content.includes(">||<")) {
            const urlMatch = content.match(/\[FILE\]::<([^>]+)>/);
            const nameMatch = content.match(/>\|\|<([^>]+)>/);
            if (urlMatch && nameMatch) {
                const fileUrl = urlMatch[1];
                const fileName = nameMatch[1];
                const isImage = !!fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i);
                const isVideo = !!fileUrl.match(/\.(mp4|webm|ogg)/i);
                return (
                    <div className="flex flex-col gap-2 mt-1 min-w-[200px]">
                        <div className="flex flex-col gap-2 bg-background/20 p-2 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2">
                                {isImage ? <ImageIcon className="h-4 w-4 shrink-0" /> : isVideo ? <Film className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                                <span className="text-xs truncate max-w-[150px] font-medium" title={fileName}>{fileName}</span>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                {(isImage || isVideo) && (
                                    <Button type="button" variant="secondary" size="sm" className="h-6 flex-1 text-[10px]" onClick={() => {
                                        setViewerType(isImage ? "image" : "video");
                                        setViewerUrl(fileUrl);
                                    }}>
                                        <Eye className="h-3 w-3 mr-1" /> View
                                    </Button>
                                )}
                                <Button variant="secondary" size="sm" asChild className="h-6 flex-1 text-[10px]">
                                    <a href={fileUrl} target="_blank" download rel="noopener noreferrer">
                                        <Download className="h-3 w-3 mr-1" /> Save
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            }
        }
        return <span>{content}</span>;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-[650px] w-full max-w-5xl mx-auto">
            {/* Main Chat Area */}
            <Card className="flex flex-col flex-1 border-none shadow-lg bg-background/50 backdrop-blur-sm h-full">
                <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            Lease Member Chat
                            {isConnected ? (
                                <span className="flex h-2 w-2 rounded-full bg-green-500" title="Connected" />
                            ) : (
                                <span className="flex h-2 w-2 rounded-full bg-red-500" title="Disconnected" />
                            )}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground">
                            Lease #{leaseId}
                        </div>
                    </div>
                </CardHeader>
                <CardContent
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                    ref={scrollRef}
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === userId;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="text-[10px] bg-primary/10">
                                            {getInitials(`${msg.sender.fName} ${msg.sender.lName}`)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-muted-foreground px-1">
                                                {isMe ? "You" : `${msg.sender.fName} ${msg.sender.lName}`}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm shadow-sm transition-all duration-200 ${isMe
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-muted text-muted-foreground rounded-tl-none"
                                                }`}
                                        >
                                            {renderMessageContent(msg.content)}
                                        </div>
                                        {isMe && (
                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                {msg.readReceipts.map((rr) => (
                                                    <span
                                                        key={rr.userId}
                                                        title={`Seen by ${rr.user.fName} ${rr.user.lName}`}
                                                        className="text-[8px] bg-muted px-1 rounded-full text-muted-foreground border border-border/50"
                                                    >
                                                        {getInitials(`${rr.user.fName} ${rr.user.lName}`)}
                                                    </span>
                                                ))}
                                                {msg.readReceipts.length > 0 && (
                                                    <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
                <CardFooter className="p-4 border-t bg-muted/20 flex-col gap-2 relative">
                    {attachment && (
                        <div className="w-full flex items-center justify-between bg-background p-2 pr-3 rounded-lg border text-sm animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[200px] text-xs font-medium">{attachment.name}</span>
                                <span className="text-[10px] text-muted-foreground">({(attachment.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setAttachment(null)} disabled={uploading}>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex w-full gap-2 items-center"
                    >
                        <Button variant="outline" size="icon" className="rounded-full shrink-0 relative overflow-hidden h-10 w-10">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={e => e.target.files?.[0] && setAttachment(e.target.files[0])}
                                disabled={uploading}
                            />
                        </Button>
                        <Input
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20"
                            autoComplete="off"
                            disabled={uploading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-full shrink-0 shadow-md hover:scale-105 transition-transform h-10 w-10"
                            disabled={(!inputValue.trim() && !attachment) || uploading}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>

            {/* Right Sidebar: Chat Documents */}
            <Card className="flex flex-col w-full lg:w-80 border-none shadow-lg bg-background/50 backdrop-blur-sm h-full shrink-0 hidden md:flex">
                <CardHeader className="border-b bg-muted/30 p-4 py-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Chat Documents
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {documents.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground pt-10 italic">No documents shared yet.</div>
                    ) : (
                        documents.map((doc, idx) => {
                            const isImage = !!doc.url?.match(/\.(jpeg|jpg|gif|png|webp)/i);
                            const isVideo = !!doc.url?.match(/\.(mp4|webm|ogg)/i);
                            return (
                                <div key={idx} className="flex flex-col gap-2 p-3 bg-muted/30 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        {isImage ? (
                                            <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-black/10 border relative">
                                                <img src={doc.url} alt="thumbnail" className="object-cover w-full h-full" />
                                            </div>
                                        ) : isVideo ? (
                                            <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-black/10 border relative flex items-center justify-center">
                                                <Film className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-black/10 border relative flex items-center justify-center">
                                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <p className="text-xs font-medium truncate" title={doc.fileName}>{doc.fileName}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {(isImage || isVideo) && (
                                            <Button type="button" variant="ghost" size="sm" className="h-6 flex-1 text-[10px] bg-background" onClick={() => {
                                                setViewerType(isImage ? "image" : "video");
                                                setViewerUrl(doc.url);
                                            }}>
                                                <Eye className="h-3 w-3 mr-1" /> View
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" asChild className="h-6 flex-1 text-[10px] bg-background">
                                            <a href={doc.url} target="_blank" download rel="noopener noreferrer">
                                                <Download className="h-3 w-3 mr-1" /> Save
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* Media Viewer Dialog */}
            <Dialog open={!!viewerUrl} onOpenChange={(open) => !open && setViewerUrl(null)}>
                <DialogContent className="max-w-4xl p-1 bg-black/95 border-none">
                    <DialogTitle className="sr-only">Media Viewer</DialogTitle>
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
