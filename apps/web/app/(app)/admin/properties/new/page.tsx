"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Plus, User } from "lucide-react";
import { useCreateProperty } from "@/hooks/use-properties";
import { useClients } from "@/hooks/use-clients";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import {
  FOUNDATION_OPTIONS,
  GARAGE_OPTIONS,
  HEATING_OPTIONS,
  COOLING_OPTIONS,
  ROOF_OPTIONS,
} from "@/lib/constants/property-options";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function NewPropertyPage() {
  const router = useRouter();
  const createProperty = useCreateProperty();
  const { data: clientsData } = useClients();
  const clients = clientsData ?? [];
  const residentialTypes = new Set(["single-family", "condo-townhome", "manufactured"]);
  type BasementOption = "none" | "unfinished" | "finished" | "partial";
  type BuildingClassOption = "A" | "B" | "C";
  type LaundryOption = "in-unit" | "shared" | "none";

  const [form, setForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "single-family",
    yearBuilt: "",
    squareFeet: "",
    notes: "",
    clientId: "",
    // Common details
    bedrooms: "",
    bathrooms: "",
    stories: "",
    foundation: "",
    garage: "",
    pool: false,
    // Residential specific
    basement: "",
    lotSizeAcres: "",
    heatingType: "",
    coolingType: "",
    roofType: "",
    // Commercial specific
    buildingClass: "",
    loadingDocks: "",
    zoning: "",
    occupancyType: "",
    ceilingHeight: "",
    // Multi-family specific
    numberOfUnits: "",
    unitMix: "",
    laundryType: "",
    // Shared
    parkingSpaces: "",
    elevator: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClientDialog, setShowClientDialog] = useState(false);

  const handleClientCreated = (clientId: string) => {
    setForm((prev) => ({ ...prev, clientId }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.addressLine1.trim()) {
      newErrors.addressLine1 = "Address is required";
    }
    if (!form.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!form.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!form.zipCode.trim()) {
      newErrors.zipCode = "Zip code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const result = await createProperty.mutateAsync({
        tenant_slug: "demo",
        address_line1: form.addressLine1.trim(),
        address_line2: form.addressLine2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zipCode.trim(),
        property_type: form.propertyType as any,
        year_built: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
        square_feet: form.squareFeet ? parseInt(form.squareFeet, 10) : null,
        notes: form.notes.trim() || null,
        client_id: form.clientId || null,
        // Common details
        bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
        stories: form.stories || null,
        foundation: form.foundation || null,
        garage: form.garage || null,
        pool: form.pool || null,
        // Residential specific
        basement: form.basement ? (form.basement as BasementOption) : null,
        lot_size_acres: form.lotSizeAcres ? parseFloat(form.lotSizeAcres) : null,
        heating_type: form.heatingType || null,
        cooling_type: form.coolingType || null,
        roof_type: form.roofType || null,
        // Commercial specific
        building_class: form.buildingClass ? (form.buildingClass as BuildingClassOption) : null,
        loading_docks: form.loadingDocks ? parseInt(form.loadingDocks, 10) : null,
        zoning: form.zoning || null,
        occupancy_type: form.occupancyType || null,
        ceiling_height: form.ceilingHeight ? parseFloat(form.ceilingHeight) : null,
        // Multi-family specific
        number_of_units: form.numberOfUnits ? parseInt(form.numberOfUnits, 10) : null,
        unit_mix: form.unitMix || null,
        laundry_type: form.laundryType ? (form.laundryType as LaundryOption) : null,
        // Shared
        parking_spaces: form.parkingSpaces ? parseInt(form.parkingSpaces, 10) : null,
        elevator: form.elevator || null,
      });

      router.push(`/admin/properties/${result.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/properties" className="hover:text-foreground">
                Properties
              </Link>
            </>
          }
          title="Add New Property"
          description="Create a new property record in your database"
          backHref="/admin/properties"
        />

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address-line1">
                      Street Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address-line1"
                      value={form.addressLine1}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, addressLine1: e.target.value }));
                        setErrors((prev) => ({ ...prev, addressLine1: "" }));
                      }}
                      placeholder="123 Main Street"
                      className={errors.addressLine1 ? "border-destructive" : ""}
                    />
                    {errors.addressLine1 && (
                      <p className="text-sm text-destructive">{errors.addressLine1}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address-line2">Address Line 2</Label>
                    <Input
                      id="address-line2"
                      value={form.addressLine2}
                      onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                      placeholder="Apt 4B, Suite 100, etc."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="city">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, city: e.target.value }));
                          setErrors((prev) => ({ ...prev, city: "" }));
                        }}
                        placeholder="San Francisco"
                        className={errors.city ? "border-destructive" : ""}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">
                        State <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="state"
                        value={form.state}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, state: e.target.value }));
                          setErrors((prev) => ({ ...prev, state: "" }));
                        }}
                        placeholder="CA"
                        maxLength={2}
                        className={errors.state ? "border-destructive" : ""}
                      />
                      {errors.state && (
                        <p className="text-sm text-destructive">{errors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip-code">
                      Zip Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="zip-code"
                      value={form.zipCode}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, zipCode: e.target.value }));
                        setErrors((prev) => ({ ...prev, zipCode: "" }));
                      }}
                      placeholder="94102"
                      className={errors.zipCode ? "border-destructive" : ""}
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive">{errors.zipCode}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property-type">Property Type</Label>
                    <Select
                      value={form.propertyType}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, propertyType: value }))}
                    >
                      <SelectTrigger id="property-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="single-family">Single-Family</SelectItem>
                      <SelectItem value="condo-townhome">Condo / Townhome</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="multi-family">Multi-Family</SelectItem>
                      <SelectItem value="manufactured">Manufactured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year-built">Year Built</Label>
                      <Input
                        id="year-built"
                        type="number"
                        value={form.yearBuilt}
                        onChange={(e) => setForm((prev) => ({ ...prev, yearBuilt: e.target.value }))}
                        placeholder="2020"
                        min="1800"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="square-feet">Square Feet</Label>
                      <Input
                        id="square-feet"
                        type="number"
                        value={form.squareFeet}
                        onChange={(e) => setForm((prev) => ({ ...prev, squareFeet: e.target.value }))}
                        placeholder="2000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional property details..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {(residentialTypes.has(form.propertyType) || form.propertyType === "multi-family") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Property Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="bedrooms">Bedrooms</Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            value={form.bedrooms}
                            onChange={(e) => setForm((prev) => ({ ...prev, bedrooms: e.target.value }))}
                            placeholder="3"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bathrooms">Bathrooms</Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            step="0.5"
                            value={form.bathrooms}
                            onChange={(e) => setForm((prev) => ({ ...prev, bathrooms: e.target.value }))}
                            placeholder="2.5"
                            min="0"
                          />
                        </div>
                      </>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stories">Stories/Floors</Label>
                        <Input
                          id="stories"
                          value={form.stories}
                          onChange={(e) => setForm((prev) => ({ ...prev, stories: e.target.value }))}
                          placeholder="2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="garage">Garage</Label>
                        <Select
                          value={form.garage || undefined}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, garage: value }))}
                        >
                          <SelectTrigger id="garage">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {GARAGE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="foundation">Foundation</Label>
                        <Select
                          value={form.foundation || undefined}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, foundation: value }))}
                        >
                          <SelectTrigger id="foundation">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {FOUNDATION_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Checkbox
                          id="pool"
                          checked={form.pool}
                          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, pool: !!checked }))}
                        />
                        <Label htmlFor="pool" className="font-normal cursor-pointer">Has Pool</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Residential-Specific Details */}
              {residentialTypes.has(form.propertyType) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Residential Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="basement">Basement</Label>
                        <Select
                          value={form.basement || undefined}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, basement: value }))}
                        >
                          <SelectTrigger id="basement">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="unfinished">Unfinished</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                            <SelectItem value="partial">Partially Finished</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lot-size">Lot Size (acres)</Label>
                        <Input
                          id="lot-size"
                          type="number"
                          step="0.01"
                          value={form.lotSizeAcres}
                          onChange={(e) => setForm((prev) => ({ ...prev, lotSizeAcres: e.target.value }))}
                          placeholder="0.25"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="heating">Heating Type</Label>
                        <Select
                          value={form.heatingType || undefined}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, heatingType: value }))}
                        >
                          <SelectTrigger id="heating">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {HEATING_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cooling">Cooling Type</Label>
                        <Select
                          value={form.coolingType || undefined}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, coolingType: value }))}
                        >
                          <SelectTrigger id="cooling">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COOLING_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roof">Roof Type</Label>
                      <Select
                        value={form.roofType || undefined}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, roofType: value }))}
                      >
                        <SelectTrigger id="roof">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOF_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Commercial-Specific Details */}
              {form.propertyType === "commercial" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Commercial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="building-class">Building Class</Label>
                        <Select
                          value={form.buildingClass || undefined}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, buildingClass: value }))}
                        >
                          <SelectTrigger id="building-class">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">Class A</SelectItem>
                            <SelectItem value="B">Class B</SelectItem>
                            <SelectItem value="C">Class C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ceiling-height">Ceiling Height (ft)</Label>
                        <Input
                          id="ceiling-height"
                          type="number"
                          step="0.5"
                          value={form.ceilingHeight}
                          onChange={(e) => setForm((prev) => ({ ...prev, ceilingHeight: e.target.value }))}
                          placeholder="12"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="parking-spaces">Parking Spaces</Label>
                        <Input
                          id="parking-spaces"
                          type="number"
                          value={form.parkingSpaces}
                          onChange={(e) => setForm((prev) => ({ ...prev, parkingSpaces: e.target.value }))}
                          placeholder="50"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loading-docks">Loading Docks</Label>
                        <Input
                          id="loading-docks"
                          type="number"
                          value={form.loadingDocks}
                          onChange={(e) => setForm((prev) => ({ ...prev, loadingDocks: e.target.value }))}
                          placeholder="2"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zoning">Zoning</Label>
                        <Input
                          id="zoning"
                          value={form.zoning}
                          onChange={(e) => setForm((prev) => ({ ...prev, zoning: e.target.value }))}
                          placeholder="C-2, Industrial, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occupancy">Occupancy Type</Label>
                        <Input
                          id="occupancy"
                          value={form.occupancyType}
                          onChange={(e) => setForm((prev) => ({ ...prev, occupancyType: e.target.value }))}
                          placeholder="Office, retail, warehouse, etc."
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="elevator-commercial"
                        checked={form.elevator}
                        onCheckedChange={(checked) => setForm((prev) => ({ ...prev, elevator: !!checked }))}
                      />
                      <Label htmlFor="elevator-commercial" className="font-normal cursor-pointer">
                        Has Elevator
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Multi-Family-Specific Details */}
              {form.propertyType === "multi-family" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Multi-Family Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="units">Number of Units</Label>
                        <Input
                          id="units"
                          type="number"
                          value={form.numberOfUnits}
                          onChange={(e) => setForm((prev) => ({ ...prev, numberOfUnits: e.target.value }))}
                          placeholder="8"
                          min="2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parking-spaces-mf">Parking Spaces</Label>
                        <Input
                          id="parking-spaces-mf"
                          type="number"
                          value={form.parkingSpaces}
                          onChange={(e) => setForm((prev) => ({ ...prev, parkingSpaces: e.target.value }))}
                          placeholder="16"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit-mix">Unit Mix</Label>
                      <Input
                        id="unit-mix"
                        value={form.unitMix}
                        onChange={(e) => setForm((prev) => ({ ...prev, unitMix: e.target.value }))}
                        placeholder="4x 2BR/2BA, 4x 1BR/1BA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="laundry">Laundry Type</Label>
                        <Select
                          value={form.laundryType || undefined}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, laundryType: value }))}
                        >
                          <SelectTrigger id="laundry">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in-unit">In-Unit</SelectItem>
                            <SelectItem value="shared">Shared Facility</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Checkbox
                          id="elevator"
                          checked={form.elevator}
                          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, elevator: !!checked }))}
                        />
                        <Label htmlFor="elevator" className="font-normal cursor-pointer">Has Elevator</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Owner/Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Owner/Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Select value={form.clientId || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, clientId: value }))}>
                        <SelectTrigger id="client" className="flex-1">
                          <SelectValue placeholder="Select a client..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.clientId} value={client.clientId}>
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {client.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.clientId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setForm((prev) => ({ ...prev, clientId: "" }))}
                          className="shrink-0"
                        >
                          <span className="sr-only">Clear client</span>
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowClientDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Client
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createProperty.isPending}
                  >
                    {createProperty.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Property
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/admin/properties")}
                    disabled={createProperty.isPending}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Required fields are marked with an asterisk (*)</p>
                  <p>• You can assign an owner/contact now or later</p>
                  <p>• Property details can be edited at any time</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        <InlineClientDialog
          open={showClientDialog}
          onOpenChange={setShowClientDialog}
          onClientCreated={handleClientCreated}
        />
      </div>
    </AdminShell>
  );
}
