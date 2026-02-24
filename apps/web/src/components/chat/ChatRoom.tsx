"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat, Message } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCheck } from "lucide-react";

interface ChatRoomProps {
    leaseId: number;
    userId: number;
    userName: string;
}

export function ChatRoom({ leaseId, userId, userName }: ChatRoomProps) {
    const { messages, isConnected, sendMessage } = useChat(leaseId, userId);
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (inputValue.trim()) {
            sendMessage(inputValue);
            setInputValue("");
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <Card className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border-none shadow-lg bg-background/50 backdrop-blur-sm">
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
                                                ? "bg-primary text-primary-foreground rounded-tr-none hover:bg-primary/90"
                                                : "bg-muted text-muted-foreground rounded-tl-none hover:bg-muted/80"
                                            }`}
                                    >
                                        {msg.content}
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
            <CardFooter className="p-4 border-t bg-muted/20">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex w-full gap-2 items-center"
                >
                    <Input
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20"
                        autoComplete="off"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full shrink-0 shadow-md hover:scale-105 transition-transform"
                        disabled={!inputValue.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
