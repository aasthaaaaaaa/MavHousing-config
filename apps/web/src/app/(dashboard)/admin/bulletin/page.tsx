/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, CalendarDays, Eye } from "lucide-react"
import { CreateBulletinDialog } from "@/components/bulletin/create-bulletin-dialog"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function AdminBulletinPage() {
    const [bulletins, setBulletins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [previewContent, setPreviewContent] = useState<string | null>(null)
    const [previewType, setPreviewType] = useState<"TEXT" | "PHOTO" | null>(null)

    const fetchBulletins = async () => {
        try {
            setLoading(true)
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const res = await authApi.get('/bulletin', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            setBulletins(res.data)
        } catch {
            toast.error("Failed to load bulletins")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBulletins()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bulletin?")) return
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            await authApi.delete(`/bulletin/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            toast.success("Bulletin deleted")
            fetchBulletins()
        } catch {
            toast.error("Failed to delete bulletin")
        }
    }

    const handlePreview = (b: any) => {
        setPreviewType(b.type)
        setPreviewContent(b.content)
    }

    return (
        <div className="flex-1 space-y-6 p-6 pb-20 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bulletin Board</h1>
                    <p className="text-muted-foreground text-sm">Manage announcements, notices, and photos for residents.</p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Bulletin
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                   Array.from({ length: 3 }).map((_, i) => (
                       <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                   ))
                ) : bulletins.length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground mb-4">No bulletins published yet</p>
                        <Button variant="outline" onClick={() => setCreateOpen(true)}>Create the first one</Button>
                    </div>
                ) : (
                    bulletins.map((b) => (
                        <Card key={b._id} className="flex flex-col overflow-hidden bg-background">
                            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base line-clamp-1">{b.title || "Untitled Notice"}</CardTitle>
                                        <CardDescription className="flex items-center gap-1.5 text-xs">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {new Date(b.createdAt).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={b.type === 'PHOTO' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                        {b.type}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 flex-1 flex flex-col justify-between gap-4">
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p><span className="font-semibold">Author:</span> {b.author?.fName} {b.author?.lName}</p>
                                    <p><span className="font-semibold">Targetting:</span> {b.targetType.replace('_', ' ')}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-auto">
                                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8" onClick={() => handlePreview(b)}>
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(b._id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <CreateBulletinDialog 
                open={createOpen} 
                onOpenChange={setCreateOpen} 
                onSuccess={fetchBulletins} 
            />

            {/* General Media/HTML Viewer */}
            <Dialog open={!!previewContent} onOpenChange={(open) => !open && setPreviewContent(null)}>
                <DialogContent className={previewType === 'PHOTO' ? "max-w-4xl p-1 bg-black/95 border-none" : "max-w-2xl"}>
                    <DialogTitle className="sr-only">Bulletin Preview</DialogTitle>
                    {previewType === 'PHOTO' && previewContent ? (
                       // eslint-disable-next-line @next/next/no-img-element
                       <img 
                          src={previewContent} 
                          alt="Bulletin Photo Preview" 
                          className="w-full h-auto max-h-[85vh] object-contain rounded-md" 
                        />
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none max-h-[80vh] overflow-y-auto px-1 py-4" dangerouslySetInnerHTML={{ __html: previewContent || "" }} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
