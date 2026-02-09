"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import {
  COOLING_OPTIONS,
  FOUNDATION_OPTIONS,
  GARAGE_OPTIONS,
  HEATING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  RESIDENTIAL_PROPERTY_TYPES,
  ROOF_OPTIONS,
} from "@inspectos/shared/constants/property-options";

export type PropertyFormState = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt: string;
  squareFeet: string;
  notes: string;
  clientId: string;
  bedrooms: string;
  bathrooms: string;
  stories: string;
  foundation: string;
  garage: string;
  pool: boolean;
  basement: string;
  lotSizeAcres: string;
  heatingType: string;
  coolingType: string;
  roofType: string;
  buildingClass: string;
  loadingDocks: string;
  zoning: string;
  occupancyType: string;
  ceilingHeight: string;
  numberOfUnits: string;
  unitMix: string;
  laundryType: string;
  parkingSpaces: string;
  elevator: boolean;
};

export type PropertyFormErrors = Partial<Record<keyof PropertyFormState, string>>;

export type ClientOption = {
  clientId: string;
  name: string;
};

export function createEmptyPropertyFormState(): PropertyFormState {
  return {
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
    bedrooms: "",
    bathrooms: "",
    stories: "",
    foundation: "",
    garage: "",
    pool: false,
    basement: "",
    lotSizeAcres: "",
    heatingType: "",
    coolingType: "",
    roofType: "",
    buildingClass: "",
    loadingDocks: "",
    zoning: "",
    occupancyType: "",
    ceilingHeight: "",
    numberOfUnits: "",
    unitMix: "",
    laundryType: "",
    parkingSpaces: "",
    elevator: false,
  };
}

export function validatePropertyForm(form: PropertyFormState): PropertyFormErrors {
  const errors: PropertyFormErrors = {};

  if (!form.addressLine1.trim()) {
    errors.addressLine1 = "Address is required";
  }
  if (!form.city.trim()) {
    errors.city = "City is required";
  }
  if (!form.state.trim()) {
    errors.state = "State is required";
  }
  if (!form.zipCode.trim()) {
    errors.zipCode = "Zip code is required";
  }

  return errors;
}

type PropertyFormSectionsProps = {
  form: PropertyFormState;
  setForm: Dispatch<SetStateAction<PropertyFormState>>;
  errors: PropertyFormErrors;
  setErrors?: Dispatch<SetStateAction<PropertyFormErrors>>;
  clients?: ClientOption[];
  onOpenClientDialog?: () => void;
  showOwnerSection?: boolean;
};

export function PropertyFormSections({
  form,
  setForm,
  errors,
  setErrors,
  clients = [],
  onOpenClientDialog,
  showOwnerSection = true,
}: PropertyFormSectionsProps) {
  const residentialTypes = new Set<string>(RESIDENTIAL_PROPERTY_TYPES);

  return (
    <>
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
                const value = e.target.value;
                setForm((prev) => ({ ...prev, addressLine1: value }));
                setErrors?.((prev) => ({ ...prev, addressLine1: "" }));
              }}
              placeholder="123 Main Street"
              className={errors.addressLine1 ? "border-destructive" : ""}
            />
            {errors.addressLine1 && <p className="text-sm text-destructive">{errors.addressLine1}</p>}
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
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, city: value }));
                  setErrors?.((prev) => ({ ...prev, city: "" }));
                }}
                placeholder="San Francisco"
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, state: value }));
                  setErrors?.((prev) => ({ ...prev, state: "" }));
                }}
                placeholder="CA"
                maxLength={2}
                className={errors.state ? "border-destructive" : ""}
              />
              {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
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
                const value = e.target.value;
                setForm((prev) => ({ ...prev, zipCode: value }));
                setErrors?.((prev) => ({ ...prev, zipCode: "" }));
              }}
              placeholder="94102"
              className={errors.zipCode ? "border-destructive" : ""}
            />
            {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property-type">Property Type</Label>
            <Select value={form.propertyType} onValueChange={(value) => setForm((prev) => ({ ...prev, propertyType: value }))}>
              <SelectTrigger id="property-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stories">Stories/Floors</Label>
                <Input id="stories" value={form.stories} onChange={(e) => setForm((prev) => ({ ...prev, stories: e.target.value }))} placeholder="2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="garage">Garage</Label>
                <Select value={form.garage || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, garage: value }))}>
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
                <Select value={form.foundation || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, foundation: value }))}>
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
                <Checkbox id="pool" checked={form.pool} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, pool: !!checked }))} />
                <Label htmlFor="pool" className="font-normal cursor-pointer">
                  Has Pool
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {residentialTypes.has(form.propertyType) && (
        <Card>
          <CardHeader>
            <CardTitle>Residential Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basement">Basement</Label>
                <Select value={form.basement || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, basement: value }))}>
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
                <Select value={form.heatingType || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, heatingType: value }))}>
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
                <Select value={form.coolingType || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, coolingType: value }))}>
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
              <Select value={form.roofType || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, roofType: value }))}>
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

      {form.propertyType === "commercial" && (
        <Card>
          <CardHeader>
            <CardTitle>Commercial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building-class">Building Class</Label>
                <Select value={form.buildingClass || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, buildingClass: value }))}>
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
              <Checkbox id="elevator-commercial" checked={form.elevator} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, elevator: !!checked }))} />
              <Label htmlFor="elevator-commercial" className="font-normal cursor-pointer">
                Has Elevator
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Select value={form.laundryType || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, laundryType: value }))}>
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
                <Checkbox id="elevator" checked={form.elevator} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, elevator: !!checked }))} />
                <Label htmlFor="elevator" className="font-normal cursor-pointer">
                  Has Elevator
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showOwnerSection && (
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
                {form.clientId ? (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setForm((prev) => ({ ...prev, clientId: "" }))} className="shrink-0">
                    <span className="sr-only">Clear client</span>×
                  </Button>
                ) : null}
              </div>
            </div>
            {onOpenClientDialog ? (
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={onOpenClientDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Client
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}
    </>
  );
}
