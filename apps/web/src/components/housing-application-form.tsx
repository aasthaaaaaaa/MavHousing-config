"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    classification: "",
    expectedGraduation: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    sleepSchedule: "",
    cleanliness: "",
    noiseLevel: "",
    smokingPreference: "",
    dietaryRestrictions: "",
    specialAccommodations: "",
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
          classification: formData.classification,
          expectedGraduation: formData.expectedGraduation,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelation: formData.emergencyContactRelation,
          sleepSchedule: formData.sleepSchedule,
          cleanliness: formData.cleanliness,
          noiseLevel: formData.noiseLevel,
          smokingPreference: formData.smokingPreference,
          dietaryRestrictions: formData.dietaryRestrictions,
          specialAccommodations: formData.specialAccommodations,
        }),
      });

      if (res.ok) {
        toast({
          title: "Success!",
          description: "Your housing application has been submitted.",
        });
        setStep(8); // Success step
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
    switch (step) {
      case 1: return formData.term !== "";
      case 2: return formData.classification !== "" && formData.expectedGraduation !== "";
      case 3: return formData.emergencyContactName !== "" && formData.emergencyContactPhone !== "" && formData.emergencyContactRelation !== "";
      case 4: return formData.sleepSchedule !== "" && formData.cleanliness !== "" && formData.noiseLevel !== "" && formData.smokingPreference !== "";
      case 5: return true; // optional
      case 6: return formData.preferredPropertyId !== "";
      default: return true;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Select Term";
      case 2: return "Personal Information";
      case 3: return "Emergency Contact";
      case 4: return "Roommate Matching";
      case 5: return "Accommodations";
      case 6: return "Choose Property";
      case 7: return "Review & Submit";
      default: return "";
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Housing Application</CardTitle>
          <CardDescription>
            Step {step} of 7 - {getStepTitle()}
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

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select value={formData.classification} onValueChange={(val) => setFormData({ ...formData, classification: val })}>
                  <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Freshman">Freshman</SelectItem>
                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Graduation</Label>
                <Input placeholder="e.g. Spring 2028" value={formData.expectedGraduation} onChange={e => setFormData({...formData, expectedGraduation: e.target.value})} />
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Emergency Contact Full Name</Label>
                <Input placeholder="Jane Doe" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="(555) 123-4567" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input placeholder="Mother, Father, Sibling..." value={formData.emergencyContactRelation} onChange={e => setFormData({...formData, emergencyContactRelation: e.target.value})} />
              </div>
            </div>
          )}

          {/* Step 4: Roommate Matching */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">This information helps us match you with compatible roommates.</p>
              
              <div className="space-y-2">
                <Label>Sleep Schedule</Label>
                <Select value={formData.sleepSchedule} onValueChange={(val) => setFormData({ ...formData, sleepSchedule: val })}>
                  <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Early Bird (Before 10 PM)">Early Bird (Before 10 PM)</SelectItem>
                    <SelectItem value="Average (10 PM - 12 AM)">Average (10 PM - 12 AM)</SelectItem>
                    <SelectItem value="Night Owl (After 12 AM)">Night Owl (After 12 AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cleanliness</Label>
                <Select value={formData.cleanliness} onValueChange={(val) => setFormData({ ...formData, cleanliness: val })}>
                  <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Very Neat">Very Neat (Always clean)</SelectItem>
                    <SelectItem value="Average">Average (Clean weekly)</SelectItem>
                    <SelectItem value="Casual">Casual (Messy but hygienic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Noise Level</Label>
                <Select value={formData.noiseLevel} onValueChange={(val) => setFormData({ ...formData, noiseLevel: val })}>
                  <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Very Quiet">Very Quiet</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Lively">Lively / Play Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Smoking Preference</Label>
                <Select value={formData.smokingPreference} onValueChange={(val) => setFormData({ ...formData, smokingPreference: val })}>
                  <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Non-Smoker">Non-Smoker (Strict)</SelectItem>
                    <SelectItem value="Don't Mind">I don't mind</SelectItem>
                    <SelectItem value="Smoker">Smoker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 5: Accommodations */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Please list any accommodations you need. (Optional)</p>
              <div className="space-y-2">
                <Label>Dietary Restrictions / Kitchen Needs</Label>
                <Textarea placeholder="e.g. Vegetarian, Halal..." value={formData.dietaryRestrictions} onChange={e => setFormData({...formData, dietaryRestrictions: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Special or ADA Accommodations</Label>
                <Textarea placeholder="Describe any physical or medical accommodations needed..." value={formData.specialAccommodations} onChange={e => setFormData({...formData, specialAccommodations: e.target.value})} />
              </div>
            </div>
          )}

          {/* Step 6: Property Selection */}
          {step === 6 && (
            <div className="space-y-4">
              <Label>Preferred Property</Label>
              <RadioGroup
                value={formData.preferredPropertyId}
                onValueChange={(val: string) => setFormData({ ...formData, preferredPropertyId: val })}
              >
                {properties.map((property) => (
                  <div key={property.propertyId} className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFormData({ ...formData, preferredPropertyId: property.propertyId.toString() })}>
                    <RadioGroupItem value={property.propertyId.toString()} id={`property-${property.propertyId}`} />
                    <Label htmlFor={`property-${property.propertyId}`} className="flex-1 cursor-pointer">
                      <div className="font-semibold">{property.name}</div>
                      <div className="text-sm text-muted-foreground">{property.address}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {property.propertyType.replace("_", " ")} • {property.leaseType.replace("BY_", "By ")}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div>
                  <h4 className="font-semibold text-primary mb-1">Academic Info</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Term:</span> {terms.find((t) => t.value === formData.term)?.label}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Classification:</span> {formData.classification} (Graduating {formData.expectedGraduation})</p>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-primary mb-1">Emergency Contact</h4>
                  <p className="text-sm">{formData.emergencyContactName} ({formData.emergencyContactRelation}) - {formData.emergencyContactPhone}</p>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold text-primary mb-1">Lifestyle Profile</h4>
                  <p className="text-sm">{formData.sleepSchedule} • {formData.cleanliness} • {formData.noiseLevel} • {formData.smokingPreference}</p>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold text-primary mb-1">Housing Preference</h4>
                  <p className="text-sm text-foreground font-medium">
                    {properties.find((p) => p.propertyId.toString() === formData.preferredPropertyId)?.name}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Please review your application details before submitting. You cannot edit this after submission.
              </p>
            </div>
          )}

          {/* Step 8: Success */}
          {step === 8 && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-semibold">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Your housing application has been successfully submitted. You will receive updates via email.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 8 && (
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {step < 7 ? (
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
