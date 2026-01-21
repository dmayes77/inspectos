/**
 * Property-related option constants
 * Shared across admin and booking forms
 */

export const GARAGE_OPTIONS = ["None", "1-car", "2-car", "3-car", "4-car"] as const;

export const FOUNDATION_OPTIONS = ["Slab", "Crawl Space", "Basement", "Pier & Beam"] as const;

export const STORY_OPTIONS = ["1", "2", "3", "4+"] as const;

export type GarageOption = typeof GARAGE_OPTIONS[number];
export type FoundationOption = typeof FOUNDATION_OPTIONS[number];
export type StoryOption = typeof STORY_OPTIONS[number];
