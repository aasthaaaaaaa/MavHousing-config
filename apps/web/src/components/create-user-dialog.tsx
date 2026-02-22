"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onUserCreated,
}: CreateUserDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fName: "",
    lName: "",
    netId: "",
    utaId: "",
    email: "",
    passwordHash: "",
    role: "student",
    gender: "MALE",
    dob: "",
    studentStatus: "",
    staffPosition: "",
    requiresAdaAccess: false,
  });

  const resetForm = () => {
    setFormData({
      fName: "",
      lName: "",
      netId: "",
      utaId: "",
      email: "",
      passwordHash: "",
      role: "student",
      gender: "MALE",
      dob: "",
      studentStatus: "",
      staffPosition: "",
      requiresAdaAccess: false,
    });
  };

  const validatePassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/.test(password);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validatePassword(formData.passwordHash)) {
      toast.error("Password must be at least 10 chars with uppercase, lowercase, number, and special character.");
      return;
    }

    setSubmitting(true);
    try {
      // Build payload — only include optional fields if they have values
      const payload: any = {
        fName: formData.fName,
        lName: formData.lName,
        netId: formData.netId,
        utaId: formData.utaId,
        email: formData.email,
        passwordHash: formData.passwordHash,
        role: formData.role,
        gender: formData.gender,
        dob: formData.dob,
        requiresAdaAccess: formData.requiresAdaAccess,
      };

      if (formData.role === "student" && formData.studentStatus) {
        payload.studentStatus = formData.studentStatus;
      }
      if (formData.role === "staff" && formData.staffPosition) {
        payload.staffPosition = formData.staffPosition;
      }

      await authApi.post("/auth/create-new", payload);
      toast.success(`User ${formData.netId} created successfully!`);
      resetForm();
      onOpenChange(false);
      onUserCreated();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const errorText =
        typeof msg === "string"
          ? msg
          : Array.isArray(msg)
            ? msg.join(", ")
            : "Failed to create user";
      toast.error(errorText);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new staff or student account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cu-fName">First Name</Label>
              <Input
                id="cu-fName"
                value={formData.fName}
                onChange={(e) => setFormData({ ...formData, fName: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-lName">Last Name</Label>
              <Input
                id="cu-lName"
                value={formData.lName}
                onChange={(e) => setFormData({ ...formData, lName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* NetID & UTA ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cu-netId">NetID</Label>
              <Input
                id="cu-netId"
                value={formData.netId}
                onChange={(e) => setFormData({ ...formData, netId: e.target.value })}
                placeholder="jxd1234"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-utaId">UTA ID</Label>
              <Input
                id="cu-utaId"
                value={formData.utaId}
                onChange={(e) => setFormData({ ...formData, utaId: e.target.value })}
                placeholder="1001234567"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jxd1234@mavs.uta.edu"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="cu-password">Password</Label>
            <Input
              id="cu-password"
              type="password"
              value={formData.passwordHash}
              onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Min 10 chars, uppercase, lowercase, number, and special character.
            </p>
          </div>

          {/* Role & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) =>
                  setFormData({ ...formData, role: v, studentStatus: "", staffPosition: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(v) => setFormData({ ...formData, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="cu-dob">Date of Birth</Label>
            <Input
              id="cu-dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              required
            />
          </div>

          {/* Conditional: Student Status */}
          {formData.role === "student" && (
            <div className="space-y-2">
              <Label>Student Status</Label>
              <Select
                value={formData.studentStatus}
                onValueChange={(v) => setFormData({ ...formData, studentStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPLICANT">Applicant</SelectItem>
                  <SelectItem value="RESIDENT">Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conditional: Staff Position */}
          {formData.role === "staff" && (
            <div className="space-y-2">
              <Label>Staff Position</Label>
              <Select
                value={formData.staffPosition}
                onValueChange={(v) => setFormData({ ...formData, staffPosition: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGEMENT">Management</SelectItem>
                  <SelectItem value="RESIDENT_A">Resident Assistant</SelectItem>
                  <SelectItem value="DESK_A">Desk Assistant</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ADA Access */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cu-ada"
              checked={formData.requiresAdaAccess}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requiresAdaAccess: checked === true })
              }
            />
            <Label htmlFor="cu-ada" className="text-sm font-normal cursor-pointer">
              Requires ADA Accessible Housing
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
