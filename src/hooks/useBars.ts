'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Bar } from '@/types';

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

// Geocode an address using Mapbox Geocoding API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN || !address) return null;

  try {
    const encodedAddress = encodeURIComponent(address);
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
                // Get column values (handle both header names and indices)
                const columns = Object.values(row);

                const bar = {
                  id: index + 1,
                  name: columns[0] || '',
                  address: columns[1] || '',
                  coordinates: parseCoordinates(columns[2] || ''),
                  state: columns[3] || '',
                  website: columns[4] || '',
                  description: columns[5] || '',
                  whiskyList: columns[6] || undefined,
                };

                // Apply coordinate corrections for specific locations
                bar.coordinates = correctCoordinates(bar);

                return bar;
              })
              .filter(bar => bar.name && bar.state); // Filter out invalid entries

            // Geocode bars with invalid coordinates
            const barsNeedingGeocode = parsedBars.filter(
              bar => !isValidUSCoordinate(bar.coordinates.lat, bar.coordinates.lng)
            );

            if (barsNeedingGeocode.length > 0) {
              console.log(`Geocoding ${barsNeedingGeocode.length} bars with invalid coordinates...`);

              // Geocode in batches to avoid rate limiting
              const geocodePromises = barsNeedingGeocode.map(async (bar) => {
                const geocoded = await geocodeAddress(bar.address);
                if (geocoded) {
                  bar.coordinates = geocoded;
                  console.log(`Geocoded ${bar.name}: ${geocoded.lat}, ${geocoded.lng}`);
                } else {
                  console.warn(`Failed to geocode ${bar.name} at ${bar.address}`);
                }
              });

              await Promise.all(geocodePromises);
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
