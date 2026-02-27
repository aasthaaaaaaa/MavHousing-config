"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CheckCircle2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface PropertyAvailability {
  totalUnits: number;
  availableUnits: number;
  totalRooms: number;
  availableRooms: number;
  totalBeds: number;
  availableBeds: number;
}
interface Property {
  propertyId: number;
  name: string;
  address: string;
  propertyType: string;
  leaseType: string;
  availability?: PropertyAvailability;
}

interface Term {
  value: string;
  label: string;
}

export function HousingApplicationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    term: "",
    propertyType: "",
    leaseType: "",
    preferredPropertyId: "",
    idFile: null as File | null,
    fullName: "",
    utaId: "",
    email: "",
    phone: "",
    gender: "",
    isAdaRequired: false,
    docUrl: "",
    profilePicUrl: "",
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

  useEffect(() => {
    fetchProperties();
    fetchTerms();
  }, []);

  useEffect(() => {
    if ((user as any)?.netId) {
      fetchUserFromAuth();
    }
  }, [user]);

  async function fetchUserFromAuth() {
    try {
      const res = await fetch(`http://localhost:3008/auth/find-user?netId=${(user as any)?.netId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const u = data[0];
          setFormData(prev => ({
            ...prev,
            fullName: prev.fullName || `${u.fName} ${u.lName}`.trim(),
            utaId: prev.utaId || u.utaId || "",
            email: prev.email || u.email || "",
            phone: prev.phone || u.phone || ""
          }));
        }
      }
    } catch(e) {
      console.error("Failed to fetch user data for prefill");
    }
  }

  async function fetchProperties() {
    try {
      const res = await fetch("http://localhost:3009/housing/properties/availability");
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load properties", variant: "destructive" });
    }
  }

  async function fetchTerms() {
    try {
      const res = await fetch("http://localhost:3009/housing/terms");
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load terms", variant: "destructive" });
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, idFile: file }));
    
    setUploadingId(true);
    const data = new FormData();
    data.append('file', file);
    data.append('netId', (user as any)?.netId || (user as any)?.email || 'unknown');

    try {
      const res = await fetch("http://localhost:3009/housing/upload-id", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        
        if (result.studentId) {
          try {
            const userRes = await fetch(`http://localhost:3009/housing/user-by-utaid/${result.studentId}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              setFormData(prev => ({
                ...prev,
                fullName: result.fullName || `${userData.fName} ${userData.lName}`.trim(),
                utaId: result.studentId || userData.utaId || "",
                email: userData.email || result.email || prev.email || "",
                phone: userData.phone || result.phone || prev.phone || "",
                gender: userData.gender || prev.gender || "",
                isAdaRequired: userData.requiresAdaAccess || prev.isAdaRequired || false,
                docUrl: result.docUrl || "",
                profilePicUrl: result.profilePicUrl || "",
              }));
              toast({ title: "Success", description: `Student profile found and pre-filled for ${userData.fName}` });
            } else {
              setFormData(prev => ({
                ...prev,
                fullName: result.fullName || "",
                utaId: result.studentId || "",
                email: result.email || prev.email || "",
                phone: result.phone || prev.phone || "",
                docUrl: result.docUrl || "",
                profilePicUrl: result.profilePicUrl || "",
              }));
              toast({ title: "Success", description: "Student ID processed successfully" });
            }
          } catch (e) {
            console.error("Failed to fetch user by utaId", e);
          }
        } else {
          toast({ title: "Success", description: "Student ID processed successfully" });
        }
      } else {
        throw new Error("Failed to process ID");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to process ID card", variant: "destructive" });
    } finally {
      setUploadingId(false);
    }
  }

  async function handleSubmit() {
    if (!user?.userId) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
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
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelation: formData.emergencyContactRelation,
          sleepSchedule: formData.sleepSchedule,
          cleanliness: formData.cleanliness,
          noiseLevel: formData.noiseLevel,
          smokingPreference: formData.smokingPreference,
          dietaryRestrictions: formData.dietaryRestrictions,
          specialAccommodations: formData.specialAccommodations,
          idCardUrl: formData.docUrl,
        }),
      });

      if (res.ok) {
        toast({ title: "Success!", description: "Your housing application has been submitted." });
        setStep(11); // Success step
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit application", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const filteredProperties = properties.filter(p => {
    if (formData.propertyType && p.propertyType !== formData.propertyType) return false;
    if (formData.leaseType && p.leaseType !== formData.leaseType) return false;
    return true;
  });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(phone);
  const validateUtaId = (id: string) => /^\d{10}$/.test(id);

  const canProceed = () => {
    switch (step) {
      case 1: return formData.term !== "";
      case 2: return formData.propertyType !== "";
      case 3: return formData.leaseType !== "";
      case 4: return formData.preferredPropertyId !== "";
      case 5: return formData.docUrl !== "" && formData.fullName !== "" && formData.utaId !== "";
      case 6: return (
        formData.fullName.trim() !== "" && 
        validateUtaId(formData.utaId) && 
        validateEmail(formData.email) && 
        validatePhone(formData.phone)
      ); 
      case 7: return (
        formData.emergencyContactName.trim() !== "" && 
        validatePhone(formData.emergencyContactPhone) && 
        formData.emergencyContactRelation.trim() !== ""
      );
      case 8: return formData.sleepSchedule !== "" && formData.cleanliness !== "" && formData.noiseLevel !== "" && formData.smokingPreference !== "";
      case 9: return true; 
      default: return true;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Select Term";
      case 2: return "Property Type";
      case 3: return "Lease Type";
      case 4: return "Choose Property";
      case 5: return "Upload Student ID";
      case 6: return "Personal Information";
      case 7: return "Emergency Contact";
      case 8: return "Roommate Matching";
      case 9: return "Accommodations";
      case 10: return "Review & Submit";
      default: return "";
    }
  }

  const handleNext = () => {
    if (step === 2 && formData.propertyType === "RESIDENCE_HALL") {
      setFormData(prev => ({ ...prev, leaseType: "BY_BED" }));
      setStep(4);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 4 && formData.propertyType === "RESIDENCE_HALL") {
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Housing Application</CardTitle>
          <CardDescription>Step {step < 11 ? step : 10} of 10 - {getStepTitle()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label>Select Application Term</Label>
              <Select value={formData.term} onValueChange={(val) => setFormData({ ...formData, term: val })}>
                <SelectTrigger><SelectValue placeholder="Choose a term" /></SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Choose Residence Hall or Apartment</Label>
              <RadioGroup value={formData.propertyType} onValueChange={(val) => setFormData({ ...formData, propertyType: val })}>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFormData({ ...formData, propertyType: 'RESIDENCE_HALL' })}>
                  <RadioGroupItem value="RESIDENCE_HALL" id="type-rh" />
                  <Label htmlFor="type-rh" className="flex-1 cursor-pointer">Residence Hall</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFormData({ ...formData, propertyType: 'APARTMENT' })}>
                  <RadioGroupItem value="APARTMENT" id="type-apt" />
                  <Label htmlFor="type-apt" className="flex-1 cursor-pointer">Apartment</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Select Lease Type</Label>
              <RadioGroup value={formData.leaseType} onValueChange={(val) => setFormData({ ...formData, leaseType: val })}>
                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer" onClick={() => setFormData({ ...formData, leaseType: 'BY_UNIT' })}>
                  <RadioGroupItem value="BY_UNIT" id="lease-unit" />
                  <Label htmlFor="lease-unit" className="cursor-pointer">By Unit (Entire Apartment)</Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer" onClick={() => setFormData({ ...formData, leaseType: 'BY_ROOM' })}>
                  <RadioGroupItem value="BY_ROOM" id="lease-room" />
                  <Label htmlFor="lease-room" className="cursor-pointer">By Room (Private Room)</Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer" onClick={() => setFormData({ ...formData, leaseType: 'BY_BED' })}>
                  <RadioGroupItem value="BY_BED" id="lease-bed" />
                  <Label htmlFor="lease-bed" className="cursor-pointer">By Bed (Shared Room)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Label>Preferred Property</Label>
              <RadioGroup value={formData.preferredPropertyId} onValueChange={(val) => setFormData({ ...formData, preferredPropertyId: val })}>
                {filteredProperties.length === 0 && <p className="text-sm text-muted-foreground">No properties match your criteria.</p>}
                {filteredProperties.map((property) => {
                  let available = 0;
                  let total = 0;
                  if (property.availability) {
                    if (formData.leaseType === 'BY_UNIT') { available = property.availability.availableUnits; total = property.availability.totalUnits; }
                    else if (formData.leaseType === 'BY_ROOM') { available = property.availability.availableRooms; total = property.availability.totalRooms; }
                    else { available = property.availability.availableBeds; total = property.availability.totalBeds; }
                  }
                  return (
                    <div key={property.propertyId} className="flex flex-col border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFormData({ ...formData, preferredPropertyId: property.propertyId.toString() })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={property.propertyId.toString()} id={`prop-${property.propertyId}`} />
                        <Label htmlFor={`prop-${property.propertyId}`} className="flex-1 cursor-pointer font-semibold">{property.name}</Label>
                      </div>
                      <div className="ml-6 mt-2 text-sm text-muted-foreground">
                        <p>{property.address}</p>
                        {property.availability && (
                          <p className={`mt-1 font-medium ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            Available {formData.leaseType.replace('BY_', '').toLowerCase()}s: {available} / {total}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <Label>Upload your Student ID</Label>
              <p className="text-sm text-muted-foreground mb-4">We will extract your name, ID, and profile picture automatically.</p>
              
              <div className="border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4">
                <UploadCloud className="w-12 h-12 text-muted-foreground" />
                <div>
                  <Button variant="outline" asChild disabled={uploadingId}>
                    <label className="cursor-pointer">
                      {uploadingId ? 'Processing...' : 'Browse Files'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  </Button>
                </div>
                {formData.idFile && <p className="text-sm text-muted-foreground">{formData.idFile.name}</p>}
              </div>

              {formData.docUrl && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/30 flex space-x-4 items-center">
                  {formData.profilePicUrl && (
                    <img src={formData.profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">Extracted Information:</p>
                    <p className="text-sm">Name: {formData.fullName}</p>
                    <p className="text-sm">Student ID: {formData.utaId}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Please verify your personal information.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Student ID (10 digit)</Label>
                  <Input value={formData.utaId} onChange={e => setFormData({...formData, utaId: e.target.value})} maxLength={10} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
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

          {step === 8 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">This helps us match you with compatible roommates.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sleep Schedule</Label>
                  <Select value={formData.sleepSchedule} onValueChange={(val) => setFormData({ ...formData, sleepSchedule: val })}>
                    <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Early Bird (Before 10 PM)">Early Bird</SelectItem>
                      <SelectItem value="Average (10 PM - 12 AM)">Average</SelectItem>
                      <SelectItem value="Night Owl (After 12 AM)">Night Owl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cleanliness</Label>
                  <Select value={formData.cleanliness} onValueChange={(val) => setFormData({ ...formData, cleanliness: val })}>
                    <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Very Neat">Very Neat</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
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
                      <SelectItem value="Lively">Lively</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Smoking Preference</Label>
                  <Select value={formData.smokingPreference} onValueChange={(val) => setFormData({ ...formData, smokingPreference: val })}>
                    <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Non-Smoker">Non-Smoker</SelectItem>
                      <SelectItem value="Don't Mind">Don't Mind</SelectItem>
                      <SelectItem value="Smoker">Smoker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border p-4 rounded-lg">
                <input 
                  type="checkbox" 
                  id="ada-access" 
                  checked={formData.isAdaRequired} 
                  onChange={e => setFormData({...formData, isAdaRequired: e.target.checked})}
                  className="w-5 h-5"
                />
                <Label htmlFor="ada-access" className="font-semibold cursor-pointer">I require ADA Accessible Housing</Label>
              </div>
              <div className="space-y-2">
                <Label>Dietary Restrictions / Kitchen Needs (Optional)</Label>
                <Textarea placeholder="e.g. Vegetarian, Halal..." value={formData.dietaryRestrictions} onChange={e => setFormData({...formData, dietaryRestrictions: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Special Accommodations (Optional)</Label>
                <Textarea placeholder="Describe any physical or medical accommodations needed..." value={formData.specialAccommodations} onChange={e => setFormData({...formData, specialAccommodations: e.target.value})} />
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div>
                  <h4 className="font-semibold text-primary mb-1">Application Information</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Term:</span> {terms.find((t) => t.value === formData.term)?.label}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Lease Type:</span> {formData.leaseType.replace('_', ' ')}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Property:</span> {properties.find((p) => p.propertyId.toString() === formData.preferredPropertyId)?.name}</p>
                </div>
                
                <div className="border-t pt-3 flex items-center space-x-4">
                  {formData.profilePicUrl && <img src={formData.profilePicUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover" />}
                  <div>
                    <h4 className="font-semibold text-primary mb-1">Identity & Contact</h4>
                    <p className="text-sm">{formData.fullName} • {formData.utaId}</p>
                    <p className="text-sm text-muted-foreground">Emergency: {formData.emergencyContactName} ({formData.emergencyContactPhone})</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold text-primary mb-1">Lifestyle Profile</h4>
                  <p className="text-sm">{formData.sleepSchedule} • {formData.cleanliness} • {formData.noiseLevel} • {formData.smokingPreference}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Review your application details. You cannot edit this after submission.</p>
            </div>
          )}

          {step === 11 && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-semibold">Application Submitted!</h3>
              <p className="text-muted-foreground">Your housing application has been successfully submitted. You will receive updates via email.</p>
            </div>
          )}

          {step < 11 && (
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} disabled={step === 1 || uploadingId}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              {step < 10 ? (
                <Button onClick={handleNext} disabled={!canProceed() || uploadingId}>
                  Next <ChevronRight className="w-4 h-4 ml-2" />
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
