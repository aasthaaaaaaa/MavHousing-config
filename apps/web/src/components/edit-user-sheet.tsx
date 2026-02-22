"use client"

import { useState } from "react"
import { toast } from "sonner"
import { type UserData } from "@/lib/types"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface EditUserSheetProps {
  user: UserData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function EditUserSheet({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: EditUserSheetProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fName: "",
    lName: "",
    role: "student",
  })
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  if (open && user && !initialDataLoaded) {
      setFormData({
            fName: user.fName || "",
            lName: user.lName || "",
            role: user.role || "student",
      });
      setInitialDataLoaded(true);
  }
  if (!open && initialDataLoaded) {
      setInitialDataLoaded(false);
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
        const netId = user.netId;
        
        await authApi.patch(`/auth/users/${netId}`, formData)
        toast.success(`User ${netId} updated successfully`)
        onUserUpdated()
        onOpenChange(false)
    } catch (error) {
        console.error("Failed to update user", error)
        toast.error("Failed to update user")
    } finally {
        setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>
            Make changes to the user profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fName" className="text-right">
              First Name
            </Label>
            <Input
              id="fName"
              value={formData.fName}
              onChange={(e) => setFormData({ ...formData, fName: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lName" className="text-right">
              Last Name
            </Label>
            <Input
              id="lName"
              value={formData.lName}
              onChange={(e) => setFormData({ ...formData, lName: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
