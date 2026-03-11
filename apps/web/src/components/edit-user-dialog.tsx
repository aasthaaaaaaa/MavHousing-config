"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { type UserData } from "@/lib/types"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Lock, Unlock, UserCog, Building2, Shield,
  FileText, MapPin, Users, AlertTriangle, Key,
} from "lucide-react"

/* ─── Types ─── */
interface LeaseInfo {
  leaseId: number
  leaseType: string
  startDate: string
  endDate: string
  status: string
  totalDue: string
  dueThisMonth: string
  unit?: { unitNumber: string; maxOccupancy?: number; property: { name: string; address: string } }
  room?: { roomLetter: string }
  bed?: { bedLetter: string }
  occupants: { occupantId: number; occupantType: string; user: { userId: number; fName: string; lName: string; netId: string } }[]
}

interface EditUserDialogProps {
  user: UserData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

/* ─── Helpers ─── */
function fmtDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/* ═══════════════════════════════════════════════════════ */
export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  // ── Profile Form State ──
  const [formData, setFormData] = useState({
    fName: "", lName: "", email: "", phone: "",
    role: "student", gender: "",
    studentStatus: "" as string | null,
    staffPosition: "" as string | null,
    requiresAdaAccess: false,
    newPassword: "",
  })
  const [saving, setSaving] = useState(false)

  // ── Lease State ──
  const [lease, setLease] = useState<LeaseInfo | null>(null)
  const [leaseLoading, setLeaseLoading] = useState(false)
  const [targetLeaseId, setTargetLeaseId] = useState("")
  const [asLeaseHolder, setAsLeaseHolder] = useState(false)
  const [reassignLoading, setReassignLoading] = useState(false)
  const [endingLease, setEndingLease] = useState(false)

  // ── Lock State ──
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [lockReason, setLockReason] = useState("")
  const [locking, setLocking] = useState(false)

  // ── Initialize form data when dialog opens ──
  useEffect(() => {
    if (open && user) {
      setFormData({
        fName: user.fName || "",
        lName: user.lName || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "student",
        gender: user.gender || "",
        studentStatus: user.studentStatus || null,
        staffPosition: user.staffPosition || null,
        requiresAdaAccess: user.requiresAdaAccess ?? false,
        newPassword: "",
      })
      setLockReason("")
      setTargetLeaseId("")
      setAsLeaseHolder(false)
      fetchLease(user.userId)
    }
    if (!open) {
      setLease(null)
    }
  }, [open, user])

  async function fetchLease(userId?: number) {
    if (!userId) return
    setLeaseLoading(true)
    try {
      const res = await fetch(`http://localhost:3009/lease/user-lease/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setLease(data)
      } else {
        setLease(null)
      }
    } catch {
      setLease(null)
    } finally {
      setLeaseLoading(false)
    }
  }

  /* ── Save Profile ── */
  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      const payload: any = { ...formData }
      if (!payload.newPassword) delete payload.newPassword
      await authApi.patch(`/auth/users/${user.netId}`, payload)
      toast.success(`User ${user.netId} updated successfully`)
      onUserUpdated()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  /* ── Reassign Lease ── */
  async function handleReassign() {
    if (!user || !targetLeaseId) {
      toast.error("Please enter a Lease ID")
      return
    }
    setReassignLoading(true)
    try {
      await authApi.patch("/lease/reassign", {
        userId: user.userId,
        leaseId: parseInt(targetLeaseId),
        asHolder: asLeaseHolder,
      })
      toast.success(`Reassigned to lease ${targetLeaseId}`)
      onUserUpdated()
      fetchLease(user.userId)
      setTargetLeaseId("")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reassign. Check if lease holder exists or unit is full.")
    } finally {
      setReassignLoading(false)
    }
  }

  /* ── End Lease ── */
  async function handleEndLease() {
    if (!lease) return
    setEndingLease(true)
    try {
      await fetch(`http://localhost:3009/lease/end/${lease.leaseId}`, { method: "PATCH" })
      toast.success("Lease ended")
      onUserUpdated()
      fetchLease(user?.userId)
    } catch {
      toast.error("Failed to end lease")
    } finally {
      setEndingLease(false)
    }
  }

  /* ── Lock / Unlock Account ── */
  async function handleLock() {
    if (!user) return
    setLocking(true)
    try {
      await authApi.patch(`/auth/users/${user.netId}`, {
        isLocked: true,
        lockReason: lockReason || "Account locked by administrator.",
      })
      toast.success(`Account ${user.netId} locked`)
      setLockDialogOpen(false)
      setLockReason("")
      onUserUpdated()
    } catch {
      toast.error("Failed to lock account")
    } finally {
      setLocking(false)
    }
  }

  async function handleUnlock() {
    if (!user) return
    setLocking(true)
    try {
      await authApi.patch(`/auth/users/${user.netId}`, {
        isLocked: false,
        lockReason: null,
      })
      toast.success(`Account ${user.netId} unlocked`)
      onUserUpdated()
    } catch {
      toast.error("Failed to unlock account")
    } finally {
      setLocking(false)
    }
  }

  if (!user) return null

  const isLocked = user.isLocked ?? false

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {user.fName?.[0]}{user.lName?.[0]}
              </div>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {user.fName} {user.lName}
                  {isLocked && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Lock className="h-3 w-3" /> Locked
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{user.netId} · {user.email}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="profile" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-1.5">
                <UserCog className="h-3.5 w-3.5" /> Profile
              </TabsTrigger>
              <TabsTrigger value="lease" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Lease
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Account
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: Profile ── */}
            <TabsContent value="profile" className="space-y-5 mt-4">
              {/* Immutable Details */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Immutable Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">UTA ID</Label>
                    <Input value={user.utaId || "N/A"} className="bg-muted/50 cursor-not-allowed mt-1" readOnly tabIndex={-1} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">NetID</Label>
                    <Input value={user.netId} className="bg-muted/50 cursor-not-allowed mt-1" readOnly tabIndex={-1} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Editable Details */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Editable Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fName" className="text-xs">First Name</Label>
                    <Input id="fName" value={formData.fName} onChange={e => setFormData({ ...formData, fName: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lName" className="text-xs">Last Name</Label>
                    <Input id="lName" value={formData.lName} onChange={e => setFormData({ ...formData, lName: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input id="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1" placeholder="e.g. 8175551234" />
                  </div>
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Gender</Label>
                    <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Student Status</Label>
                    <Select value={formData.studentStatus || "NOT_APPLICABLE"} onValueChange={v => setFormData({ ...formData, studentStatus: v === "NOT_APPLICABLE" ? null : v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                        <SelectItem value="APPLICANT">Applicant</SelectItem>
                        <SelectItem value="RESIDENT">Resident</SelectItem>
                        <SelectItem value="PAST_RESIDENT">Past Resident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Staff Position</Label>
                    <Select value={formData.staffPosition || "NOT_APPLICABLE"} onValueChange={v => setFormData({ ...formData, staffPosition: v === "NOT_APPLICABLE" ? null : v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                  <div>
                    <Label className="text-xs">ADA Access</Label>
                    <Select value={formData.requiresAdaAccess ? "yes" : "no"} onValueChange={v => setFormData({ ...formData, requiresAdaAccess: v === "yes" })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-xs flex items-center gap-1"><Key className="h-3 w-3" /> New Password</Label>
                    <Input id="newPassword" type="password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} className="mt-1" placeholder="Leave blank to keep current" />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}> Cancel </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── TAB 2: Lease Management ── */}
            <TabsContent value="lease" className="space-y-5 mt-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Current Lease
                </h4>
                {leaseLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                ) : lease ? (
                  <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{lease.unit?.property.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs rounded-full capitalize">{lease.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{lease.unit?.property.address}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Unit {lease.unit?.unitNumber}
                      {lease.room ? ` · Room ${lease.room.roomLetter}` : ""}
                      {lease.bed ? ` · Bed ${lease.bed.bedLetter}` : ""}
                      {" · "}{lease.leaseType.replace("_", " ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(lease.startDate)} → {fmtDate(lease.endDate)}
                    </div>
                    {lease.occupants.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Occupants ({lease.occupants.length})
                        </p>
                        <div className="space-y-1">
                          {lease.occupants.map(o => (
                            <div key={o.occupantId} className="flex items-center justify-between text-xs">
                              <span>{o.user.fName} {o.user.lName} ({o.user.netId})</span>
                              <Badge variant="outline" className="text-[10px] rounded-full capitalize">{o.occupantType.replace("_", " ")}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button variant="destructive" size="sm" onClick={handleEndLease} disabled={endingLease || lease.status === "COMPLETED"}>
                        {endingLease ? "Ending..." : lease.status === "COMPLETED" ? "Lease Already Ended" : "End Lease"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                    <FileText className="h-4 w-4" /> No active lease found for this user.
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Reassign Lease
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Target Lease ID</Label>
                    <Input placeholder="e.g. 5" value={targetLeaseId} onChange={e => setTargetLeaseId(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Assign As</Label>
                    <Select value={asLeaseHolder ? "holder" : "occupant"} onValueChange={v => setAsLeaseHolder(v === "holder")}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="occupant">Regular Occupant</SelectItem>
                        <SelectItem value="holder">Lease Holder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="mt-3" onClick={handleReassign} disabled={reassignLoading || !targetLeaseId}>
                  {reassignLoading ? "Reassigning..." : "Reassign to Lease"}
                </Button>
              </div>
            </TabsContent>

            {/* ── TAB 3: Account ── */}
            <TabsContent value="account" className="space-y-5 mt-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Account Status
                </h4>
                <div className={`p-4 rounded-xl border ${isLocked ? "border-destructive/30 bg-destructive/5" : "border-green-500/30 bg-green-500/5"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isLocked ? "bg-destructive/10" : "bg-green-500/10"}`}>
                      {isLocked
                        ? <Lock className="h-5 w-5 text-destructive" />
                        : <Unlock className="h-5 w-5 text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {isLocked ? "Account Locked" : "Account Active"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isLocked
                          ? "This user cannot log in."
                          : "This user has full access to their account."}
                      </p>
                    </div>
                  </div>
                  {isLocked && user.lockReason && (
                    <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-xs font-medium text-destructive mb-0.5">Lock Reason</p>
                      <p className="text-sm">{user.lockReason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isLocked ? (
                  <Button onClick={handleUnlock} disabled={locking} className="gap-1.5">
                    <Unlock className="h-4 w-4" />
                    {locking ? "Unlocking..." : "Unlock Account"}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => setLockDialogOpen(true)} className="gap-1.5">
                    <Lock className="h-4 w-4" />
                    Lock Account
                  </Button>
                )}
              </div>

              {!isLocked && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Locking an account will prevent the user from logging in. They will see a message to contact the Housing Department.</span>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Lock Reason Dialog ── */}
      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive" /> Lock Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent <strong>{user.fName} {user.lName}</strong> ({user.netId}) from logging in. You can unlock the account later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="lockReason" className="text-sm">Reason for locking</Label>
            <Textarea
              id="lockReason"
              placeholder="e.g. Violation of housing policy, unpaid balance..."
              value={lockReason}
              onChange={e => setLockReason(e.target.value)}
              className="mt-1.5 min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLock} disabled={locking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {locking ? "Locking..." : "Lock Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
