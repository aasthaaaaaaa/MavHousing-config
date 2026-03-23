"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat, Message } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Send, CheckCheck, Paperclip, X, Image as ImageIcon, Film, Download, Eye, FileText, MessageSquare } from "lucide-react";

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
            const nameMatch = content.match(/>\\|\\|<([^>]+)>/);
            if (urlMatch && nameMatch) {
                const fileUrl = urlMatch[1];
                const fileName = nameMatch[1];
                const isImage = !!fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i);
                const isVideo = !!fileUrl.match(/\.(mp4|webm|ogg)/i);
                return (
                    <div className="flex flex-col gap-2 mt-1 min-w-[200px]">
                        <div
                            className={`flex items-center justify-between gap-3 bg-background/20 p-2.5 rounded-xl border border-white/10 ${(isImage || isVideo) ? "cursor-pointer hover:bg-background/30 transition-colors" : ""
                                }`}
                            onClick={() => {
                                if (isImage || isVideo) {
                                    setViewerType(isImage ? "image" : "video");
                                    setViewerUrl(fileUrl);
                                }
                            }}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-8 w-8 shrink-0 rounded-lg bg-background/30 flex items-center justify-center">
                                    {isImage ? <ImageIcon className="h-4 w-4" /> : isVideo ? <Film className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                </div>
                                <span className="text-xs truncate max-w-[140px] font-medium" title={fileName}>{fileName}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <a href={fileUrl} target="_blank" download rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                );
            }
        }
        return <span>{content}</span>;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
            {/* Main Chat Area */}
            <Card className="flex flex-col flex-1 rounded-2xl h-full min-h-0 p-0 gap-0 overflow-hidden">
                <div className="flex items-center justify-between border-b px-5 py-3.5 shrink-0 bg-muted/10">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-semibold leading-none">Lease Member Chat</h3>
                            <p className="text-xs text-muted-foreground leading-none">Lease #{leaseId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-1">
                        <span className={`flex h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                </div>
                <CardContent
                    className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
                    ref={scrollRef}
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                                <MessageSquare className="h-7 w-7" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">No messages yet</p>
                                <p className="text-xs mt-0.5">Start the conversation with your roommates!</p>
                            </div>
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
                                        <AvatarFallback className="text-[10px] bg-primary/10 font-medium">
                                            {getInitials(`${msg.sender.fName} ${msg.sender.lName}`)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-muted-foreground px-1">
                                                {isMe ? "You" : `${msg.sender.fName} ${msg.sender.lName}`}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMe
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-muted rounded-tl-sm"
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
                                                        className="text-[8px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground border"
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
                <CardFooter className="p-4 border-t flex-col gap-2">
                    {attachment && (
                        <div className="w-full flex items-center justify-between bg-muted/50 p-2.5 pr-3 rounded-xl border text-sm animate-in fade-in slide-in-from-bottom-2">
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
                        <Button variant="outline" size="icon" className="rounded-xl shrink-0 relative overflow-hidden h-10 w-10">
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
                            className="flex-1 rounded-xl"
                            autoComplete="off"
                            disabled={uploading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-xl shrink-0 h-10 w-10"
                            disabled={(!inputValue.trim() && !attachment) || uploading}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>

            {/* Right Sidebar: Chat Documents */}
            <Card className="hidden lg:flex flex-col w-80 rounded-2xl h-full shrink-0 min-h-0 p-0 gap-0 overflow-hidden">
                <div className="flex items-center gap-2 border-b px-5 py-4 shrink-0 bg-muted/10">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold leading-none">Shared Documents</h3>
                </div>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground pt-12 gap-3">
                            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                                <FileText className="h-5 w-5" />
                            </div>
                            <p className="text-xs text-center">No documents shared yet.</p>
                        </div>
                    ) : (
                        documents.map((doc, idx) => {
                            const isImage = !!doc.url?.match(/\.(jpeg|jpg|gif|png|webp)/i);
                            const isVideo = !!doc.url?.match(/\.(mp4|webm|ogg)/i);
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border hover:bg-muted/40 transition-colors ${(isImage || isVideo) ? "cursor-pointer" : ""
                                        }`}
                                    onClick={() => {
                                        if (isImage || isVideo) {
                                            setViewerType(isImage ? "image" : "video");
                                            setViewerUrl(doc.url);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {isImage ? (
                                            <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted border">
                                                <img src={doc.url} alt="thumbnail" className="object-cover w-full h-full" />
                                            </div>
                                        ) : isVideo ? (
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-muted border flex items-center justify-center">
                                                <Film className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-muted border flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <p className="text-xs font-medium truncate" title={doc.fileName}>{doc.fileName}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted/60"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <a href={doc.url} target="_blank" download rel="noopener noreferrer">
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
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
