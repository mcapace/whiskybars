'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Bar } from '@/types';
import { coordinatesInState } from '@/utils/stateBounds';

const SHEETS_URL = process.env.NEXT_PUBLIC_SHEETS_URL;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface CSVRow {
  [key: string]: string;
}

// Validate if coordinates are within valid US bounds (including territories)
function isValidUSCoordinate(lat: number, lng: number): boolean {
  // Check if coordinates are not zero
  if (lat === 0 && lng === 0) return false;

  // Continental US: lat 24-50, lng -125 to -66
  // Alaska: lat 51-72, lng -180 to -130
  // Hawaii: lat 18-23, lng -161 to -154
  // Puerto Rico: lat 17-19, lng -68 to -65
  // Guam: lat 13-14, lng 144-145

  const isContinentalUS = lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66;
  const isAlaska = lat >= 51 && lat <= 72 && lng >= -180 && lng <= -130;
  const isHawaii = lat >= 18 && lat <= 23 && lng >= -161 && lng <= -154;
  const isPuertoRico = lat >= 17 && lat <= 19 && lng >= -68 && lng <= -65;

  return isContinentalUS || isAlaska || isHawaii || isPuertoRico;
}

function parseCoordinates(coordString: string): { lat: number; lng: number } {
  if (!coordString) return { lat: 0, lng: 0 };

  const parts = coordString.split(',').map(s => s.trim());
  if (parts.length !== 2) return { lat: 0, lng: 0 };

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  // Return 0,0 if parsing failed
  if (isNaN(lat) || isNaN(lng)) return { lat: 0, lng: 0 };

  // Check for common issues like swapped lat/lng
  // Valid US latitudes are roughly 18-72, valid longitudes are roughly -180 to -65
  // If lat looks like a longitude (negative, large absolute value), they might be swapped
  if (lat < 0 && lng > 0 && lng < 90) {
    // Likely swapped - lat is negative (should be lng), lng is positive small (should be lat)
    return { lat: lng, lng: lat };
  }

  return { lat, lng };
}

// Geocode an address using Mapbox Geocoding API.
// Include state in the query so results are in the correct state (e.g. "Detroit" + "MI" -> Michigan, not Alabama).
async function geocodeAddress(address: string, state?: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN || !address) return null;

  try {
    const query = state ? `${address}, ${state} USA` : `${address} USA`;
    const encodedAddress = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=us,pr&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (error) {
    console.error('Geocoding error for address:', address, error);
  }

  return null;
}

// Coordinate corrections for specific locations
function correctCoordinates(bar: { name: string; state: string; coordinates: { lat: number; lng: number } }): { lat: number; lng: number } {
  const { name, state, coordinates } = bar;
  
  // Honolulu, Hawaii corrections
  if (state === 'Hawaii' || state === 'HI') {
    // Honolulu is approximately at 21.3099° N, 157.8581° W
    // If coordinates seem off (e.g., swapped or way off), correct them
    if (coordinates.lat > 0 && coordinates.lat < 90 && coordinates.lng < 0 && coordinates.lng > -180) {
      // Coordinates look valid, but might need fine-tuning
      // If lat is way too high or lng is positive, they might be swapped
      if (coordinates.lat > 50 || coordinates.lng > 0) {
        return { lat: coordinates.lng, lng: coordinates.lat };
      }
    }
    // If coordinates are clearly wrong (0,0 or way off), use approximate Honolulu center
    if (coordinates.lat === 0 && coordinates.lng === 0) {
      return { lat: 21.3099, lng: -157.8581 };
    }
  }
  
  // San Juan, Puerto Rico corrections
  if (state === 'Puerto Rico' || state === 'PR') {
    // San Juan is approximately at 18.4655° N, 66.1057° W
    // If coordinates seem off, correct them
    if (coordinates.lat > 0 && coordinates.lat < 90 && coordinates.lng < 0 && coordinates.lng > -180) {
      // Coordinates look valid, but might need fine-tuning
      // If lat is way too high or lng is positive, they might be swapped
      if (coordinates.lat > 50 || coordinates.lng > 0) {
        return { lat: coordinates.lng, lng: coordinates.lat };
      }
    }
    // If coordinates are clearly wrong (0,0 or way off), use approximate San Juan center
    if (coordinates.lat === 0 && coordinates.lng === 0) {
      return { lat: 18.4655, lng: -66.1057 };
    }
  }
  
  return coordinates;
}

// Normalize website URL from sheet: exactly one https://, fix https// or double protocol
function normalizeWebsiteUrl(raw: string): string {
  let s = (raw || '').trim();
  if (!s) return '';
  // Strip any leading protocol (http://, https://, or malformed https// or http//)
  s = s.replace(/^https?:\/\/?/i, '').replace(/^https?\/\/?/i, '');
  if (!s) return '';
  return `https://${s}`;
}

// Get column value by header name (case-insensitive) or fallback to index (for different sheet layouts)
function getColumn(row: CSVRow, columns: string[], headerNames: string[], fallbackIndex: number): string {
  const keys = Object.keys(row);
  for (const name of headerNames) {
    const key = keys.find(k => k.trim().toLowerCase() === name.trim().toLowerCase());
    if (key) {
      const val = row[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
    }
  }
  return columns[fallbackIndex] || '';
}

export function useBars() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBars() {
      if (!SHEETS_URL) {
        setError('Google Sheets URL not configured');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(SHEETS_URL);
        const csvText = await response.text();

        Papa.parse<CSVRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const parsedBars: Bar[] = results.data
              .map((row, index) => {
                const columns = Object.values(row) as string[];
                const bar = {
                  id: index + 1,
                  name: getColumn(row, columns, ['Name', 'Bar', 'Bar Name', 'Venue'], 0) || columns[0] || '',
                  address: getColumn(row, columns, ['Address', 'Street', 'Location'], 1) || columns[1] || '',
                  coordinates: parseCoordinates(getColumn(row, columns, ['Coordinates', 'Lat Long', 'Lat', 'Lng'], 2) || columns[2] || ''),
                  state: getColumn(row, columns, ['State', 'ST'], 3) || columns[3] || '',
                  website: normalizeWebsiteUrl(getColumn(row, columns, ['Website', 'Web Site', 'URL', 'Web'], 4) || columns[4] || ''),
                  description: getColumn(row, columns, ['Description', 'Blurb', 'Notes'], 5) || columns[5] || '',
                  whiskyList: (getColumn(row, columns, ['Whisky List', 'Whiskey List', 'Menu', 'List'], 6) || columns[6] || '').trim() || undefined,
                };

                // Apply coordinate corrections for specific locations
                bar.coordinates = correctCoordinates(bar);

                return bar;
              })
              .filter(bar => bar.name && bar.state); // Filter out invalid entries

            // Geocode bars with invalid or missing coordinates
            let barsNeedingGeocode = parsedBars.filter(
              bar => !isValidUSCoordinate(bar.coordinates.lat, bar.coordinates.lng)
            );

            if (barsNeedingGeocode.length > 0) {
              console.log(`Geocoding ${barsNeedingGeocode.length} bars with invalid coordinates...`);
              for (const bar of barsNeedingGeocode) {
                const geocoded = await geocodeAddress(bar.address, bar.state);
                if (geocoded) {
                  bar.coordinates = geocoded;
                  console.log(`Geocoded ${bar.name}: ${geocoded.lat}, ${geocoded.lng}`);
                } else {
                  console.warn(`Failed to geocode ${bar.name} at ${bar.address}`);
                }
              }
            }

            // Re-geocode bars whose coordinates are in the wrong state (fixes wrong location on click)
            const barsInWrongState = parsedBars.filter(
              bar => isValidUSCoordinate(bar.coordinates.lat, bar.coordinates.lng) &&
                !coordinatesInState(bar.coordinates.lat, bar.coordinates.lng, bar.state)
            );

            if (barsInWrongState.length > 0) {
              console.log(`Re-geocoding ${barsInWrongState.length} bars with coordinates outside ${barsInWrongState.map(b => b.state).join(', ')}...`);
              for (const bar of barsInWrongState) {
                const geocoded = await geocodeAddress(bar.address, bar.state);
                if (geocoded && coordinatesInState(geocoded.lat, geocoded.lng, bar.state)) {
                  bar.coordinates = geocoded;
                  console.log(`Corrected ${bar.name} to ${geocoded.lat}, ${geocoded.lng}`);
                }
              }
            }

            setBars(parsedBars);
            setLoading(false);
          },
          error: (err: Error) => {
            setError(`Failed to parse CSV: ${err.message}`);
            setLoading(false);
          },
        });
      } catch (err) {
        setError(`Failed to fetch bars: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    }

    fetchBars();
  }, []);

  return { bars, loading, error };
}
