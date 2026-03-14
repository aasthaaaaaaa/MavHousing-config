"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [totalDue, setTotalDue] = useState("0");
  const [dueThisMonth, setDueThisMonth] = useState("0");
  const [duration, setDuration] = useState(application?.term?.includes("3") ? "3" : application?.term?.includes("12") ? "12" : "6");

  const { toast } = useToast();

  // Calculate Dates
  const { startDate, endDate, monthsCount } = useMemo(() => {
    const now = new Date();
    // Lease starts on the 1st of the next month
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(start);
    const m = parseInt(duration);
    end.setMonth(start.getMonth() + m);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      monthsCount: m,
    };
  }, [duration]);

  // Handle auto-calculations
  useEffect(() => {
    if (open && application?.preferredProperty) {
      fetchBeds(application.preferredProperty.propertyId);
      
      const rate = application.preferredProperty.baseRate 
        ? parseFloat(application.preferredProperty.baseRate)
        : (application.preferredProperty.propertyType === 'APARTMENT' ? 520 : 400);

      setDueThisMonth(String(rate));
      setTotalDue(String(rate * monthsCount));
    }
  }, [open, application, monthsCount]);

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
          dueThisMonth: parseFloat(dueThisMonth),
          leaseType: application.preferredProperty.leaseType || 'BY_BED'
        }),
      });

      if (!res.ok) throw new Error("Failed to create lease");

      // Update application status to APPROVED
      await fetch(`http://localhost:3009/housing/applications/${application.appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

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
        <style>{`
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}</style>
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

          <div className="space-y-2">
            <Label>Lease Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              Starts: <span className="font-bold text-primary">{startDate}</span> • 
              Ends: <span className="font-bold text-primary">{endDate}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due This Month ($)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={dueThisMonth} 
                onChange={e => {
                  const val = e.target.value;
                  setDueThisMonth(val);
                  if (!isNaN(parseFloat(val))) {
                    setTotalDue(String(parseFloat(val) * monthsCount));
                  }
                }} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Total Due ($)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={totalDue} 
                onChange={e => {
                  const val = e.target.value;
                  setTotalDue(val);
                  if (!isNaN(parseFloat(val)) && monthsCount > 0) {
                    setDueThisMonth(String((parseFloat(val) / monthsCount).toFixed(2)));
                  }
                }} 
                required 
              />
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
