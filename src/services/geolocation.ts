import { Geolocation, Position } from "@capacitor/geolocation";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationResult {
  coords: Coordinates;
  timestamp: number;
}

// =============================================================================
// PERMISSION HANDLING
// =============================================================================

export async function checkLocationPermissions(): Promise<boolean> {
  try {
    const status = await Geolocation.checkPermissions();
    return status.location === "granted" || status.coarseLocation === "granted";
  } catch {
    return false;
  }
}

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const status = await Geolocation.requestPermissions();
    return status.location === "granted" || status.coarseLocation === "granted";
  } catch {
    return false;
  }
}

// =============================================================================
// LOCATION RETRIEVAL
// =============================================================================

export async function getCurrentLocation(
  enableHighAccuracy = true
): Promise<LocationResult | null> {
  try {
    const hasPermission = await checkLocationPermissions();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) return null;
    }

    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy,
      timeout: 10000,
    });

    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? null,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
        heading: position.coords.heading ?? null,
        speed: position.coords.speed ?? null,
      },
      timestamp: position.timestamp,
    };
  } catch (error) {
    console.error("Geolocation error:", error);
    return null;
  }
}

// =============================================================================
// LOCATION WATCHING
// =============================================================================

type LocationCallback = (location: LocationResult | null, error?: string) => void;

let watchId: string | null = null;

export async function watchLocation(
  callback: LocationCallback,
  enableHighAccuracy = true
): Promise<boolean> {
  try {
    const hasPermission = await checkLocationPermissions();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        callback(null, "Location permission denied");
        return false;
      }
    }

    watchId = await Geolocation.watchPosition(
      { enableHighAccuracy },
      (position, err) => {
        if (err) {
          callback(null, err.message);
          return;
        }
        if (position) {
          callback({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude ?? null,
              altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
              heading: position.coords.heading ?? null,
              speed: position.coords.speed ?? null,
            },
            timestamp: position.timestamp,
          });
        }
      }
    );

    return true;
  } catch (error) {
    console.error("Watch location error:", error);
    callback(null, "Failed to watch location");
    return false;
  }
}

export async function stopWatchingLocation(): Promise<void> {
  if (watchId) {
    await Geolocation.clearWatch({ id: watchId });
    watchId = null;
  }
}

// =============================================================================
// DISTANCE CALCULATION
// =============================================================================

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistance(lat1, lon1, lat2, lon2) * 0.621371;
}

// =============================================================================
// ADDRESS GEOCODING (using browser API when available)
// =============================================================================

export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  // Use OpenStreetMap Nominatim for geocoding (free, no API key required)
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      {
        headers: {
          "User-Agent": "InspectOS/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (results.length === 0) return null;

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
      accuracy: 100, // Approximate
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "InspectOS/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const result = await response.json();
    return result.display_name ?? null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
