"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInlineForm } from "@/components/ui/client-inline-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { useServices } from "@/hooks/use-services";
type ServiceType = {
  serviceId: string;
  name: string;
  price?: number;
  isPackage?: boolean;
  includedServiceIds?: string[];
};

const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};

import { useGet } from "@/hooks/crud";
import { getClients } from "@/lib/mock/clients";
import { useInspectors } from "@/hooks/use-team";
import { inspections } from "@/lib/mock/inspections";

export default function EditInspectionPage(props: { isNew?: boolean } = {}) {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: services = [] } = useServices() as { data: ServiceType[]; isLoading: boolean };
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const { data: clientsData = [] } = useGet("clients", async () => getClients());
  const [clients, setClients] = useState(clientsData);
  const [showClientForm, setShowClientForm] = useState(false);
  const inspection = props.isNew ? undefined : inspections.find((i) => i.inspectionId === params.id);
  const [selectedClientId, setSelectedClientId] = useState<string>(inspection ? inspection.clientId : "");
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>(inspection ? inspection.inspectorId : "");
  const { data: inspectors = [] } = useInspectors();

  // All hooks must be called before any early returns
  useEffect(() => {
    if (!inspection) return;
    const types = Array.isArray(inspection.types) ? inspection.types : [];
    setSelectedTypeIds(types);
  }, [inspection]);

  useEffect(() => {
    if (!Array.isArray(services) || services.length === 0) {
      setCalculatedPrice(0);
      return;
    }
    const serviceMap = Object.fromEntries(services.map((s: ServiceType) => [s.serviceId, s]));
    let total = 0;
    const added = new Set<string>();
    for (const id of selectedTypeIds) {
      const service = serviceMap[id];
      if (!service || added.has(id)) continue;
      if (service.isPackage && service.includedServiceIds && service.includedServiceIds.length > 0) {
        if (typeof service.price === "number") {
          total += service.price;
          added.add(id);
        } else {
          for (const incId of service.includedServiceIds) {
            if (!added.has(incId)) {
              const inc = serviceMap[incId];
              if (inc && typeof inc.price === "number") {
                total += inc.price;
                added.add(incId);
              }
            }
          }
        }
      } else if (typeof service.price === "number") {
        total += service.price;
        added.add(id);
      }
    }
    setCalculatedPrice(total);
  }, [selectedTypeIds, services]);

  const getAddressParts = () => {
    if (!inspection) return { street: "", city: "", state: "", zip: "" };
    const addressParts = inspection.address.split(", ");
    const streetValue = addressParts[0] || "";
    const cityStateZip = addressParts[1] || "";
    const cityStateZipParts = cityStateZip.split(" ");
    const zipValue = cityStateZipParts.pop() || "";
    const stateValue = cityStateZipParts.pop() || "";
    const cityValue = cityStateZipParts.join(" ");
    return {
      street: streetValue,
      city: cityValue,
      state: stateValue,
      zip: zipValue,
    };
  };

  const { street, city, state, zip } = getAddressParts();

  // Early return after all hooks
  if (!inspection && !props.isNew) {
    return (
      <AdminShell user={mockUser}>
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/inspections">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Inspections
            </Link>
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Inspection Not Found</h1>
            <p className="text-muted-foreground">The inspection you are looking for does not exist.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData);
    // Find client name from selectedClientId
    const clientObj = clients.find((c) => c.clientId === selectedClientId);
    // Find inspector name from selectedInspectorId
    const inspectorObj = inspectors.find((i) => i.teamMemberId === selectedInspectorId);
    const payload = {
      ...raw,
      types: selectedTypeIds,
      client: clientObj ? clientObj.name : "",
      clientId: selectedClientId,
      inspector: inspectorObj ? inspectorObj.name : "",
      inspectorId: inspectorObj ? inspectorObj.id : "",
      sqft: raw.sqft ? Number(raw.sqft) : undefined,
      yearBuilt: raw.yearBuilt ? Number(raw.yearBuilt) : undefined,
      bedrooms: raw.bedrooms ? Number(raw.bedrooms) : undefined,
      bathrooms: raw.bathrooms ? Number(raw.bathrooms) : undefined,
      stories: raw.stories ? String(raw.stories) : undefined,
      propertyType: raw.propertyType ? String(raw.propertyType) : undefined,
      foundation: raw.foundation ? String(raw.foundation) : undefined,
      garage: raw.garage ? String(raw.garage) : undefined,
      pool: raw.pool === "yes" ? true : raw.pool === "no" ? false : undefined,
      notes: raw.notes ? String(raw.notes) : undefined,
    };
    // idx removed (unused)
    if (inspection) {
      console.log("Updating inspection:", inspection.inspectionId, payload);
      const idx = inspections.findIndex((i) => i.inspectionId === inspection.inspectionId);
      if (idx > -1) {
        const existing = inspections[idx];
        if (existing) {
          inspections[idx] = { ...existing, ...payload };
        }
      }
      router.push(`/admin/inspections/${inspection.inspectionId}`);
    } else {
      // New inspection creation logic
      // ...existing code for new inspection...
    }
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const poolDefaultValue = inspection && typeof inspection.pool === "boolean" ? (inspection.pool ? "yes" : "no") : undefined;
  const storiesDefaultValue = inspection?.stories ? String(inspection.stories) : undefined;
  const garageDefaultValue = inspection?.garage ? String(inspection.garage) : undefined;
  const foundationDefaultValue = inspection?.foundation ? String(inspection.foundation) : undefined;

  return (
    <AdminShell user={mockUser}>
      <div className="space-y-4 w-full max-w-4xl">
        <Button variant="ghost" asChild>
          {inspection ? (
            <Link href={`/admin/inspections/${inspection.inspectionId}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Inspection
            </Link>
          ) : (
            <Link href="/admin/inspections">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Inspections
            </Link>
          )}
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{inspection ? "Edit Inspection" : "New Inspection"}</h1>
          <p className="text-muted-foreground">{inspection ? `Update inspection ${inspection.inspectionId}` : "Create a new inspection appointment"}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
                <CardDescription>Enter the property address and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ...existing code... */}
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" name="street" placeholder="123 Main Street" defaultValue={street} required />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Austin" defaultValue={city} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" placeholder="TX" maxLength={2} defaultValue={state} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" name="zip" placeholder="78701" maxLength={5} defaultValue={zip} required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Square Footage (optional)</Label>
                    <Input id="sqft" name="sqft" type="number" placeholder="2400" defaultValue={inspection ? inspection.sqft : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built (optional)</Label>
                    <Input
                      id="yearBuilt"
                      name="yearBuilt"
                      type="number"
                      placeholder="1985"
                      min="1800"
                      max={new Date().getFullYear()}
                      defaultValue={inspection ? inspection.yearBuilt : ""}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Input id="propertyType" name="propertyType" placeholder="Single Family" defaultValue={inspection ? inspection.propertyType : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="4"
                      defaultValue={inspection ? inspection.bedrooms : ""}
                      onFocus={(event) => {
                        if (!event.currentTarget.value) {
                          event.currentTarget.value = "1";
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder="2.5"
                      defaultValue={inspection ? inspection.bathrooms : ""}
                      onChange={(event) => {
                        const numeric = Number(event.currentTarget.value);
                        if (!Number.isNaN(numeric) && numeric > 4) {
                          event.currentTarget.value = String(Math.round(numeric));
                        }
                      }}
                      onFocus={(event) => {
                        if (!event.currentTarget.value) {
                          event.currentTarget.value = "1";
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stories">Stories</Label>
                    <Select name="stories" defaultValue={storiesDefaultValue}>
                      <SelectTrigger id="stories">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4+">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="foundation">Foundation</Label>
                    <Select name="foundation" defaultValue={foundationDefaultValue}>
                      <SelectTrigger id="foundation">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Slab">Slab</SelectItem>
                        <SelectItem value="Crawl Space">Crawl Space</SelectItem>
                        <SelectItem value="Basement">Basement</SelectItem>
                        <SelectItem value="Pier & Beam">Pier & Beam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="garage">Garage</Label>
                    <Select name="garage" defaultValue={garageDefaultValue}>
                      <SelectTrigger id="garage">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="1-car">1-car</SelectItem>
                        <SelectItem value="2-car">2-car</SelectItem>
                        <SelectItem value="3-car">3-car</SelectItem>
                        <SelectItem value="4-car">4-car</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pool">Pool</Label>
                  <Select name="pool" defaultValue={poolDefaultValue}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Client & Inspector */}
            <Card>
              <CardHeader>
                <CardTitle>Client & Inspector</CardTitle>
                <CardDescription>Assign the client and inspector</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  {showClientForm ? (
                    <ClientInlineForm
                      onCreate={(client) => {
                        // Simulate ID generation and fill required fields
                        const newClient = {
                          clientId: Math.random().toString(36).slice(2),
                          name: client.name,
                          email: client.email,
                          phone: "",
                          type: "Homebuyer",
                          inspections: 0,
                          lastInspection: "",
                          totalSpent: 0,
                          archived: false,
                        };
                        setClients((prev) => [...prev, newClient]);
                        setSelectedClientId(newClient.clientId);
                        setShowClientForm(false);
                      }}
                      onCancel={() => setShowClientForm(false)}
                    />
                  ) : (
                    <Select
                      name="client"
                      value={selectedClientId}
                      required
                      onValueChange={(value) => {
                        if (value === "__add_new_client__") {
                          setShowClientForm(true);
                        } else {
                          setSelectedClientId(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.clientId} value={client.clientId}>
                            {client.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__add_new_client__" className="text-blue-600 font-semibold">
                          + Add New Client
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspector">Inspector</Label>
                  <Select name="inspector" value={selectedInspectorId} required onValueChange={(value) => setSelectedInspectorId(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an inspector" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.teamMemberId} value={inspector.teamMemberId}>
                          {inspector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Inspection Details */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Details</CardTitle>
                <div className="text-muted-foreground text-sm mb-2">Set the inspection type, date, and time</div>
                <div className="space-y-2">
                  <Label>Services</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.isArray(services) &&
                      services.map((service: ServiceType) => {
                        const checked = selectedTypeIds.includes(service.serviceId);
                        return (
                          <label key={service.serviceId} className="flex items-center gap-2">
                            <Checkbox
                              name="types"
                              value={service.serviceId}
                              checked={checked}
                              onCheckedChange={(checked) => {
                                setSelectedTypeIds((ids) => (checked ? [...ids, service.serviceId] : ids.filter((id) => id !== service.serviceId)));
                              }}
                            />
                            <span>{service.name}</span>
                            {service.isPackage && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                Package
                              </Badge>
                            )}
                            {typeof service.price === "number" && <span className="ml-1 text-xs text-muted-foreground">${service.price.toFixed(2)}</span>}
                          </label>
                        );
                      })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" defaultValue={inspection ? inspection.date : ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" name="time" type="time" defaultValue={inspection ? inspection.time : ""} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={inspection ? inspection.status : ""}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending_report">Pending Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" name="price" type="number" step="0.01" value={calculatedPrice} readOnly required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any special instructions or notes..."
                    rows={4}
                    defaultValue={inspection ? inspection.notes : ""}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>

              <Button type="button" variant="outline" asChild>
                <Link href={inspection ? `/admin/inspections/${inspection.inspectionId}` : "/admin/inspections"}>Cancel</Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
