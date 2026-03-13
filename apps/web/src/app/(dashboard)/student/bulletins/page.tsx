/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { authApi } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CalendarDays, FileText, Image as ImageIcon } from "lucide-react"

export default function ResidentBulletinsPage() {
    const [bulletins, setBulletins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeBulletin, setActiveBulletin] = useState<any | null>(null)

    useEffect(() => {
        const fetchBulletins = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                const res = await authApi.get('/bulletin', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                })
                setBulletins(res.data)
            } catch (error) {
                console.error("Failed to load resident bulletins", error)
            } finally {
                setLoading(false)
            }
        }
        fetchBulletins()
    }, [])

    return (
        <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Notice Board</h1>
                <p className="text-muted-foreground text-base">Important updates and information from housing management.</p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                    ))
                ) : bulletins.length === 0 ? (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-foreground">You&apos;re all caught up!</h3>
                        <p className="text-muted-foreground">No active notices for your property right now.</p>
                    </div>
                ) : (
                    bulletins.map((b) => (
                        <Card 
                            key={b._id} 
                            className="flex flex-col overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group bg-background relative"
                            onClick={() => setActiveBulletin(b)}
                        >
                            {/* Card Media or Text Preview Area */}
                            <div className="h-48 w-full bg-muted/30 relative border-b border-border/50">
                                {b.type === "PHOTO" ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={b.content} 
                                        alt={b.title || "Image content"} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                                    />
                                ) : (
                                    <div className="w-full h-full p-6 flex flex-col relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90 z-10" />
                                        <div 
                                            className="prose prose-sm dark:prose-invert text-muted-foreground line-clamp-6"
                                            dangerouslySetInnerHTML={{ __html: b.content }}
                                        />
                                    </div>
                                )}

                                {/* Floating Icon Badge */}
                                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-border/50 z-20">
                                    {b.type === "PHOTO" ? <ImageIcon className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-blue-500" />}
                                </div>
                            </div>

                            <CardContent className="p-4 flex-1 flex flex-col gap-2">
                                <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                    {b.title || "Read Notice"}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-auto text-xs text-muted-foreground">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    <span>{new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span className="mx-1.5">•</span>
                                    <span>{b.author?.fName}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Read/View Modal */}
            <Dialog open={!!activeBulletin} onOpenChange={(open) => !open && setActiveBulletin(null)}>
                <DialogContent className={activeBulletin?.type === 'PHOTO' ? "max-w-4xl p-1 bg-black/95 border-none" : "max-w-3xl"}>
                    <DialogTitle className="sr-only">Notice Details</DialogTitle>
                    {activeBulletin?.type === 'PHOTO' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                            src={activeBulletin.content} 
                            alt={activeBulletin.title || "Full image"} 
                            className="w-full h-auto max-h-[90vh] object-contain rounded-md" 
                        />
                    ) : (
                        <div className="flex flex-col max-h-[85vh]">
                            <div className="p-6 border-b border-border bg-muted/10">
                                <h2 className="text-2xl font-bold">{activeBulletin?.title || "Notice"}</h2>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <span>{new Date(activeBulletin?.createdAt || "").toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    <span>•</span>
                                    <span>From: {activeBulletin?.author?.fName} {activeBulletin?.author?.lName}</span>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <div 
                                    className="prose dark:prose-invert max-w-none text-foreground prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline"
                                    dangerouslySetInnerHTML={{ __html: activeBulletin?.content || "" }} 
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
