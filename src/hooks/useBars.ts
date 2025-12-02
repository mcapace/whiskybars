'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Bar } from '@/types';

const SHEETS_URL = process.env.NEXT_PUBLIC_SHEETS_URL;

interface CSVRow {
  [key: string]: string;
}

function parseCoordinates(coordString: string): { lat: number; lng: number } {
  if (!coordString) return { lat: 0, lng: 0 };

  const parts = coordString.split(',').map(s => s.trim());
  if (parts.length !== 2) return { lat: 0, lng: 0 };

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  return {
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
  };
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
          complete: (results) => {
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
