/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/bulletin/rich-text-editor"
import { authApi } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, ImagePlus } from "lucide-react"

export function CreateBulletinDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<"TEXT" | "PHOTO">("TEXT")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [uploadingImage, setUploadingImage] = useState(false)
    
    // Targeting State
    const [targetType, setTargetType] = useState<"ALL" | "PROPERTY" | "LEASE" | "PROPERTY_TYPE">("ALL")
    const [selectedProperties, setSelectedProperties] = useState<string>("")
    const [selectedLeases, setSelectedLeases] = useState<string>("")
    const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string>("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>("")

    const handleSubmit = async () => {
        try {
            // Basic validation
            if (type === "PHOTO" && (!title || !selectedFile)) {
                toast.error("Title and Photo are required for Photo bulletins.")
                return
            }
            if (type === "TEXT" && !content) {
                toast.error("Content is required.")
                return
            }

            setLoading(true)

            const formData = new FormData()
            formData.append('type', type)
            if (title) formData.append('title', title)
            formData.append('targetType', targetType)

            if (type === "TEXT") {
                formData.append('content', content)
            } else if (type === "PHOTO" && selectedFile) {
                formData.append('file', selectedFile)
            }

            if (targetType === "PROPERTY" && selectedProperties) formData.append('targetPropertyIds', selectedProperties)
            if (targetType === "LEASE" && selectedLeases) formData.append('targetLeaseIds', selectedLeases)
            if (targetType === "PROPERTY_TYPE" && selectedPropertyTypes) formData.append('targetPropertyTypes', selectedPropertyTypes)

            await authApi.post('/bulletin', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success("Bulletin published successfully!")
            onSuccess()
            onOpenChange(false)
            resetForm()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to publish bulletin")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setType("TEXT")
        setTitle("")
        setContent("")
        setTargetType("ALL")
        setSelectedProperties("")
        setSelectedLeases("")
        setSelectedPropertyTypes("")
        setSelectedFile(null)
        setPreviewUrl("")
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        const file = e.target.files[0]
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val) }}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Bulletin</DialogTitle>
                    <DialogDescription>
                        Publish a notice or photo to the resident bulletin board.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="space-y-2 flex-1">
                            <Label>Bulletin Type</Label>
                            <Select value={type} onValueChange={(val: "TEXT" | "PHOTO") => { setType(val); setContent("") }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEXT">Text Notice</SelectItem>
                                    <SelectItem value="PHOTO">Photo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label>Target Audience</Label>
                            <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Who can see this?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Properties & Leases</SelectItem>
                                    <SelectItem value="PROPERTY">Specific Properties</SelectItem>
                                    <SelectItem value="LEASE">Specific Leases</SelectItem>
                                    <SelectItem value="PROPERTY_TYPE">Specific Property Type</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dynamic Targeting Fields */}
                    {targetType === "PROPERTY" && (
                        <div className="space-y-2">
                            <Label>Property IDs (Comma Separated)</Label>
                            <Input placeholder="e.g. 1, 4, 12" value={selectedProperties} onChange={e => setSelectedProperties(e.target.value)} />
                        </div>
                    )}
                    {targetType === "LEASE" && (
                        <div className="space-y-2">
                            <Label>Lease IDs (Comma Separated)</Label>
                            <Input placeholder="e.g. 101, 102" value={selectedLeases} onChange={e => setSelectedLeases(e.target.value)} />
                        </div>
                    )}
                    {targetType === "PROPERTY_TYPE" && (
                        <div className="space-y-2">
                            <Label>Property Types (Comma Separated Enum)</Label>
                            <Input placeholder="e.g. RESIDENCE_HALL, APARTMENT" value={selectedPropertyTypes} onChange={e => setSelectedPropertyTypes(e.target.value)} />
                        </div>
                    )}

                    {type === "PHOTO" && (
                        <div className="space-y-2">
                            <Label>Photo Title / Caption</Label>
                            <Input placeholder="Movie night at the quad!" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                    )}
                    {type === "TEXT" && (
                        <div className="space-y-2">
                            <Label>Title (Optional)</Label>
                            <Input placeholder="Important Notice: Scheduled Maintenance" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>{type === "TEXT" ? "Notice Content" : "Upload Photo"}</Label>
                        {type === "TEXT" ? (
                            <RichTextEditor content={content} onChange={setContent} />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {selectedFile ? (
                                    <div className="relative group rounded-md border border-border overflow-hidden h-48 bg-muted w-full max-w-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                             <Button variant="destructive" size="sm" onClick={() => { setSelectedFile(null); setPreviewUrl(""); }}>Remove</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center w-full max-w-sm h-32 border-2 border-dashed border-border rounded-lg bg-muted/20">
                                        <Label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50 transition-colors">
                                           <ImagePlus className="w-6 h-6 text-muted-foreground" />
                                           <span className="mt-2 text-sm text-muted-foreground font-medium">Click to upload image</span>
                                           <Input id="photo-upload" type="file" accept="image/*" className="hidden" disabled={loading} onChange={handleImageUpload} />
                                        </Label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || (!content && !uploadingImage)}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Publish Bulletin
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
