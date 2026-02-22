"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Property {
  propertyId: number;
  name: string;
  address: string;
  propertyType: string;
  leaseType: string;
}

interface Term {
  value: string;
  label: string;
}

export function HousingApplicationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    term: "",
    preferredPropertyId: "",
  });

  // Fetch data on mount
  useState(() => {
    fetchProperties();
    fetchTerms();
  });

  async function fetchProperties() {
    try {
      const res = await fetch("http://localhost:3009/housing/properties");
      const data = await res.json();
      setProperties(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    }
  }

  async function fetchTerms() {
    try {
      const res = await fetch("http://localhost:3009/housing/terms");
      const data = await res.json();
      setTerms(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load terms",
        variant: "destructive",
      });
    }
  }

  async function handleSubmit() {
    if (!user?.userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3009/housing/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          term: formData.term,
          preferredPropertyId: parseInt(formData.preferredPropertyId),
        }),
      });

      if (res.ok) {
        toast({
          title: "Success!",
          description: "Your housing application has been submitted.",
        });
        setStep(4); // Success step
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const canProceed = () => {
    if (step === 1) return formData.term !== "";
    if (step === 2) return formData.preferredPropertyId !== "";
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Housing Application</CardTitle>
          <CardDescription>
            Step {step} of 3 - {step === 1 ? "Select Term" : step === 2 ? "Choose Property" : "Review & Submit"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Term Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>Select Application Term</Label>
              <Select value={formData.term} onValueChange={(val) => setFormData({ ...formData, term: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: Property Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Preferred Property</Label>
              <RadioGroup
                value={formData.preferredPropertyId}
                onValueChange={(val: string) => setFormData({ ...formData, preferredPropertyId: val })}
              >
                {properties.map((property) => (
                  <div key={property.propertyId} className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value={property.propertyId.toString()} id={`property-${property.propertyId}`} />
                    <Label htmlFor={`property-${property.propertyId}`} className="flex-1 cursor-pointer">
                      <div className="font-semibold">{property.name}</div>
                      <div className="text-sm text-muted-foreground">{property.address}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {property.propertyType} • {property.leaseType.replace("BY_", "By ")}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div>
                  <span className="font-semibold">Term:</span>{" "}
                  {terms.find((t) => t.value === formData.term)?.label}
                </div>
                <div>
                  <span className="font-semibold">Preferred Property:</span>{" "}
                  {properties.find((p) => p.propertyId.toString() === formData.preferredPropertyId)?.name}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Please review your application details before submitting.
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-semibold">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Your housing application has been successfully submitted. You will receive updates via email.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
