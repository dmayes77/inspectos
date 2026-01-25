/**
 * Property-related option constants
 * Shared across admin and booking forms
 */

export const GARAGE_OPTIONS = ["None", "1-car", "2-car", "3-car", "4-car"] as const;

export const FOUNDATION_OPTIONS = ["Slab", "Crawl Space", "Basement", "Pier & Beam"] as const;

export const STORY_OPTIONS = ["1", "2", "3", "4+"] as const;

export const HEATING_OPTIONS = [
  "Central (Forced Air)",
  "Heat Pump",
  "Boiler",
  "Radiant",
  "Furnace",
  "Baseboard",
  "Wall Unit",
  "Other",
] as const;

export const COOLING_OPTIONS = [
  "Central AC",
  "Heat Pump",
  "Ductless Mini-Split",
  "Window Units",
  "Evaporative",
  "None",
  "Other",
] as const;

export const ROOF_OPTIONS = [
  "Asphalt Shingle",
  "Metal",
  "Tile",
  "Slate",
  "Wood Shake",
  "Flat / Built-up",
  "Other",
] as const;

export const PROPERTY_TYPE_OPTIONS = [
  { value: "single-family", label: "Single-Family" },
  { value: "condo-townhome", label: "Condo / Townhome" },
  { value: "commercial", label: "Commercial" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "manufactured", label: "Manufactured" },
] as const;

export const PROPERTY_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  ...PROPERTY_TYPE_OPTIONS,
] as const;

export const RESIDENTIAL_PROPERTY_TYPES = [
  "single-family",
  "condo-townhome",
  "manufactured",
] as const;

export type GarageOption = typeof GARAGE_OPTIONS[number];
export type FoundationOption = typeof FOUNDATION_OPTIONS[number];
export type StoryOption = typeof STORY_OPTIONS[number];
export type HeatingOption = typeof HEATING_OPTIONS[number];
export type CoolingOption = typeof COOLING_OPTIONS[number];
export type RoofOption = typeof ROOF_OPTIONS[number];
