"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InspectorShell } from "@/components/layout/inspector-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Home,
  FileText,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { mockServices, mockInspector } from "@/lib/mock-data";
import { impactLight, impactMedium, notificationSuccess } from "@/services/haptics";
import { cn } from "@/lib/utils";

type Step = "client" | "property" | "services" | "schedule";

const steps: { id: Step; title: string; icon: React.ReactNode }[] = [
  { id: "client", title: "Client", icon: <User className="h-4 w-4" /> },
  { id: "property", title: "Property", icon: <Home className="h-4 w-4" /> },
  { id: "services", title: "Services", icon: <FileText className="h-4 w-4" /> },
  { id: "schedule", title: "Schedule", icon: <Calendar className="h-4 w-4" /> },
];

interface FormData {
  // Client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  // Property
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  sqft: string;
  yearBuilt: string;
  bedrooms: string;
  bathrooms: string;
  stories: string;
  foundation: string;
  garage: string;
  pool: boolean;
  // Services
  selectedServices: string[];
  // Schedule
  date: string;
  time: string;
  notes: string;
}

const initialFormData: FormData = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  address: "",
  city: "",
  state: "TX",
  zipCode: "",
  propertyType: "single_family",
  sqft: "",
  yearBuilt: "",
  bedrooms: "3",
  bathrooms: "2",
  stories: "1",
  foundation: "slab",
  garage: "attached",
  pool: false,
  selectedServices: [],
  date: "",
  time: "09:00",
  notes: "",
};

export default function NewInspectionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("client");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const goToStep = (step: Step) => {
    impactLight();
    setCurrentStep(step);
  };

  const goNext = () => {
    impactLight();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goPrev = () => {
    impactLight();
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    impactMedium();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    notificationSuccess();
    setIsSubmitting(false);

    // Navigate to jobs list
    router.push("/inspector/jobs");
  };

  const calculateTotal = () => {
    return formData.selectedServices.reduce((sum, serviceId) => {
      const service = mockServices.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);
  };

  return (
    <InspectorShell
      title="New Inspection"
      user={mockInspector}
      showBackButton
      onBack={() => router.push("/inspector/jobs")}
    >
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors",
                    isActive && "text-primary",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-green-600 bg-green-600 text-white",
                    !isActive && !isCompleted && "border-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : step.icon}
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStepIndex].title} Information</CardTitle>
            <CardDescription>
              {currentStep === "client" && "Enter the client's contact details"}
              {currentStep === "property" && "Describe the property to be inspected"}
              {currentStep === "services" && "Select the inspection services needed"}
              {currentStep === "schedule" && "Choose a date and time for the inspection"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Step */}
            {currentStep === "client" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clientName"
                      placeholder="John Smith"
                      value={formData.clientName}
                      onChange={(e) => updateFormData("clientName", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => updateFormData("clientEmail", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clientPhone"
                      type="tel"
                      placeholder="(512) 555-0123"
                      value={formData.clientPhone}
                      onChange={(e) => updateFormData("clientPhone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Property Step */}
            {currentStep === "property" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Austin"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select value={formData.state} onValueChange={(v) => updateFormData("state", v)}>
                      <SelectTrigger id="state">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TX">TX</SelectItem>
                        <SelectItem value="CA">CA</SelectItem>
                        <SelectItem value="FL">FL</SelectItem>
                        <SelectItem value="NY">NY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      placeholder="78701"
                      value={formData.zipCode}
                      onChange={(e) => updateFormData("zipCode", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Select value={formData.propertyType} onValueChange={(v) => updateFormData("propertyType", v)}>
                      <SelectTrigger id="propertyType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single Family</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="multi_family">Multi-Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Sq. Ft.</Label>
                    <Input
                      id="sqft"
                      type="number"
                      placeholder="2000"
                      value={formData.sqft}
                      onChange={(e) => updateFormData("sqft", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      placeholder="1990"
                      value={formData.yearBuilt}
                      onChange={(e) => updateFormData("yearBuilt", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stories">Stories</Label>
                    <Select value={formData.stories} onValueChange={(v) => updateFormData("stories", v)}>
                      <SelectTrigger id="stories">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Select value={formData.bedrooms} onValueChange={(v) => updateFormData("bedrooms", v)}>
                      <SelectTrigger id="bedrooms">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Select value={formData.bathrooms} onValueChange={(v) => updateFormData("bathrooms", v)}>
                      <SelectTrigger id="bathrooms">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["1", "1.5", "2", "2.5", "3", "3.5", "4"].map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Services Step */}
            {currentStep === "services" && (
              <>
                <div className="space-y-3">
                  {mockServices.map((service) => {
                    const isSelected = formData.selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          impactLight();
                          const newServices = isSelected
                            ? formData.selectedServices.filter(id => id !== service.id)
                            : [...formData.selectedServices, service.id];
                          updateFormData("selectedServices", newServices);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <span className="font-semibold">${service.price}</span>
                      </div>
                    );
                  })}
                </div>
                {formData.selectedServices.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">${calculateTotal()}</span>
                  </div>
                )}
              </>
            )}

            {/* Schedule Step */}
            {currentStep === "schedule" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateFormData("date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Select value={formData.time} onValueChange={(v) => updateFormData("time", v)}>
                      <SelectTrigger id="time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or access details..."
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-semibold">Inspection Summary</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Client:</span> {formData.clientName || "—"}</p>
                    <p><span className="text-muted-foreground">Address:</span> {formData.address || "—"}, {formData.city || "—"}</p>
                    <p><span className="text-muted-foreground">Services:</span> {formData.selectedServices.length} selected</p>
                    <p><span className="text-muted-foreground">Total:</span> ${calculateTotal()}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button variant="outline" size="lg" className="flex-1 h-12" onClick={goPrev}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {currentStepIndex < steps.length - 1 ? (
            <Button size="lg" className="flex-1 h-12" onClick={goNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1 h-12"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.date || formData.selectedServices.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Inspection"}
            </Button>
          )}
        </div>
      </div>
    </InspectorShell>
  );
}
