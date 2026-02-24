"use client"

import { useState } from "react"
import { toast } from "sonner"
import { type UserData } from "@/lib/types"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
    email: "",
    role: "student",
    gender: "",
    studentStatus: "" as string | null,
    staffPosition: "" as string | null,
    requiresAdaAccess: false,
  })
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [targetLeaseId, setTargetLeaseId] = useState("");
  const [asLeaseHolder, setAsLeaseHolder] = useState(false);
  const [reassignLoading, setReassignLoading] = useState(false);

  if (open && user && !initialDataLoaded) {
    setFormData({
      email: user.email || "",
      role: user.role || "student",
      gender: user.gender || "",
      studentStatus: user.studentStatus || null,
      staffPosition: user.staffPosition || null,
      requiresAdaAccess: user.requiresAdaAccess ?? false,
    });
    setInitialDataLoaded(true);
    setTargetLeaseId("");
    setAsLeaseHolder(false);
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
    } catch (error) {
      console.error("Failed to update user", error)
      toast.error("Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = async () => {
    if (!user || !targetLeaseId) {
      toast.error("Please enter a Lease ID");
      return;
    }

    setReassignLoading(true);
    try {
      await authApi.patch('/lease/reassign', {
        userId: user.userId,
        leaseId: parseInt(targetLeaseId),
        asHolder: asLeaseHolder,
      });
      toast.success(`User ${user.netId} reassigned to lease ${targetLeaseId}`);
      onUserUpdated();
      setTargetLeaseId("");
    } catch (error: any) {
      console.error("Failed to reassign user", error);
      const errorMessage = error.response?.data?.message || "Failed to reassign user";
      toast.error(errorMessage);
    } finally {
      setReassignLoading(false);
    }
  };

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit User & Lease</SheetTitle>
          <SheetDescription>
            Modify profile details or reassign the user to a different lease.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          {/* Read-only Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Immutable Details</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">NetID</Label>
              <Input value={user.netId} className="col-span-3 bg-muted" readOnly />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">UTA ID</Label>
              <Input value={user.utaId || "N/A"} className="col-span-3 bg-muted" readOnly />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input
                value={`${user.fName} ${user.mName ? user.mName + ' ' : ''}${user.lName}`}
                className="col-span-3 bg-muted"
                readOnly
              />
            </div>
          </div>

          <Separator />

          {/* Lease Reassignment Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Lease Management</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaseId" className="text-right text-xs">Target Lease ID</Label>
              <Input
                id="leaseId"
                placeholder="e.g. 101"
                value={targetLeaseId}
                onChange={(e) => setTargetLeaseId(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asHolder" className="text-right text-xs">Assign As</Label>
              <Select
                value={asLeaseHolder ? "holder" : "occupant"}
                onValueChange={(value) => setAsLeaseHolder(value === "holder")}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="occupant">Regular Occupant</SelectItem>
                  <SelectItem value="holder">Lease Holder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReassign}
                disabled={reassignLoading || !targetLeaseId}
              >
                {reassignLoading ? "Reassigning..." : "Reassign to Lease"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Editable Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Editable Profile Details</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studentStatus" className="text-right text-xs">Student Status</Label>
              <Select
                value={formData.studentStatus || "NOT_APPLICABLE"}
                onValueChange={(value) => setFormData({ ...formData, studentStatus: value === "NOT_APPLICABLE" ? null : value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                  <SelectItem value="APPLICANT">Applicant</SelectItem>
                  <SelectItem value="RESIDENT">Resident</SelectItem>
                  <SelectItem value="PAST_RESIDENT">Past Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffPosition" className="text-right text-xs">Staff Position</Label>
              <Select
                value={formData.staffPosition || "NOT_APPLICABLE"}
                onValueChange={(value) => setFormData({ ...formData, staffPosition: value === "NOT_APPLICABLE" ? null : value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                  <SelectItem value="RESIDENT_A">Resident Assistant</SelectItem>
                  <SelectItem value="DESK_A">Desk Assistant</SelectItem>
                  <SelectItem value="MANAGEMENT">Management</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ada" className="text-right text-xs">ADA Access</Label>
              <Select
                value={formData.requiresAdaAccess ? "yes" : "no"}
                onValueChange={(value) => setFormData({ ...formData, requiresAdaAccess: value === "yes" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Requires ADA Access?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Profile Details"}
          </Button>
        </SheetFooter>



      </SheetContent>
    </Sheet>
  )
}
