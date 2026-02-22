"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";

export function CreateLeaseDialog({
  open,
  onOpenChange,
  application,
  onLeaseCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  onLeaseCreated: () => void;
}) {
  const [beds, setBeds] = useState<any[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [selectedBedId, setSelectedBedId] = useState("");
  const [totalDue, setTotalDue] = useState("9000");
  const [dueThisMonth, setDueThisMonth] = useState("900");
  
  // Default dates for Academic Year 2025-2026
  const [startDate, setStartDate] = useState("2025-08-15");
  const [endDate, setEndDate] = useState("2026-05-15");

  const { toast } = useToast();

  useEffect(() => {
    if (open && application?.preferredProperty?.propertyId) {
      fetchBeds(application.preferredProperty.propertyId);
    }
  }, [open, application]);

  async function fetchBeds(propertyId: number) {
    setLoadingBeds(true);
    try {
      const res = await fetch(`http://localhost:3009/housing/properties/${propertyId}/available-beds`);
      const data = await res.json();
      setBeds(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "Failed to load available beds", variant: "destructive" });
    } finally {
      setLoadingBeds(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBedId) {
      toast({ title: "Validation Error", description: "Please select a bed", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const bed = beds.find(b => b.bedId === parseInt(selectedBedId));

    try {
      const res = await fetch("http://localhost:3009/lease/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: application.user.userId,
          propertyId: application.preferredProperty.propertyId,
          unitId: bed.room.unit.unitId,
          roomId: bed.roomId,
          bedId: bed.bedId,
          startDate,
          endDate,
          totalDue: parseFloat(totalDue),
          dueThisMonth: parseFloat(dueThisMonth)
        }),
      });

      if (!res.ok) throw new Error("Failed to create lease");

      toast({ title: "Success", description: "Lease offer created successfully!" });
      onOpenChange(false);
      onLeaseCreated();
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to create lease offer", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Lease Offer</DialogTitle>
          <DialogDescription>
            Assign a bed to {application?.user?.fName} {application?.user?.lName} and specify the lease terms.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Available Beds at {application?.preferredProperty?.name}</Label>
            <Select value={selectedBedId} onValueChange={setSelectedBedId} disabled={loadingBeds || beds.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loadingBeds ? "Loading beds..." : beds.length === 0 ? "No beds available" : "Select a bed"} />
              </SelectTrigger>
              <SelectContent>
                {beds.map(b => (
                  <SelectItem key={b.bedId} value={String(b.bedId)}>
                    Unit {b.room.unit.unitNumber} - Room {b.room.roomLetter} - Bed {b.bedLetter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Due ($)</Label>
              <Input type="number" step="0.01" value={totalDue} onChange={e => setTotalDue(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Due This Month ($)</Label>
              <Input type="number" step="0.01" value={dueThisMonth} onChange={e => setDueThisMonth(e.target.value)} required />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || beds.length === 0 || !selectedBedId}>
              {submitting ? "Creating..." : "Create Lease"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
