"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Building2 } from "lucide-react";

interface Lease {
    leaseId: number;
}

export default function StudentChatPage() {
    const [lease, setLease] = useState<Lease | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.userId) fetchLease();
    }, [user]);

    async function fetchLease() {
        try {
            const res = await fetch(`http://localhost:3009/lease/my-lease?userId=${user!.userId}`);
            if (!res.ok) throw new Error("Not found");
            const data = await res.json();
            setLease(data);
        } catch {
            setLease(null);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="h-10 w-48 bg-muted animate-pulse rounded-xl" />
                <div className="flex-1 bg-muted animate-pulse rounded-2xl min-h-[400px]" />
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center pt-20">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Active Lease</h2>
                <p className="text-muted-foreground">
                    You need an active lease to access the member chat.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
                <h1 className="text-2xl font-bold tracking-tight">Lease Chat</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Chat with other members on your lease</p>
            </div>
            <div className="flex-1 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both" style={{ animationDelay: "80ms" }}>
                {lease?.leaseId && user?.userId && (
                    <ChatRoom
                        leaseId={lease.leaseId}
                        userId={user.userId}
                        userName={`${user.fName} ${user.lName}`}
                    />
                )}
            </div>
        </div>
    );
}
