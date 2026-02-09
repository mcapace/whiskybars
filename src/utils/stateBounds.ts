/**
 * Approximate bounding boxes [minLat, maxLat, minLng, maxLng] per state.
 * Used to detect bars with wrong coordinates (e.g. MI bar with IL coords) and trigger re-geocoding.
 */
export const STATE_BOUNDS: Record<string, [number, number, number, number]> = {
  AL: [30.2, 35.0, -88.5, -84.9],
  AK: [51.2, 71.4, -180, -130],
  AZ: [31.3, 37.0, -114.8, -109.0],
  AR: [33.0, 36.5, -94.6, -89.6],
  CA: [32.5, 42.0, -124.4, -114.1],
  CO: [37.0, 41.0, -109.1, -102.0],
  CT: [40.9, 42.1, -73.7, -71.8],
  DE: [38.4, 39.8, -75.8, -75.0],
  DC: [38.79, 39.0, -77.1, -76.9],
  FL: [24.5, 31.0, -87.6, -80.0],
  GA: [30.4, 35.0, -85.6, -80.8],
  HI: [18.9, 22.2, -160.3, -154.8],
  ID: [42.0, 49.0, -117.2, -111.0],
  IL: [37.0, 42.5, -91.5, -87.5],
  IN: [37.8, 41.8, -88.1, -84.8],
  IA: [40.4, 43.5, -96.6, -90.1],
  KS: [37.0, 40.0, -102.1, -94.6],
  KY: [36.5, 39.1, -89.6, -82.0],
  LA: [29.0, 33.0, -94.0, -89.0],
  ME: [43.1, 47.5, -71.1, -66.9],
  MD: [37.9, 39.7, -79.5, -75.0],
  MA: [41.2, 42.9, -73.5, -69.9],
  MI: [41.7, 48.2, -90.4, -82.4],
  MN: [43.5, 49.4, -97.2, -89.5],
  MS: [30.2, 35.0, -91.7, -88.1],
  MO: [36.0, 40.6, -95.8, -89.1],
  MT: [45.0, 49.0, -116.0, -104.0],
  NE: [40.0, 43.0, -104.1, -95.3],
  NV: [35.0, 42.0, -120.0, -114.0],
  NH: [42.7, 45.3, -72.6, -70.7],
  NJ: [38.9, 41.4, -75.6, -73.9],
  NM: [31.3, 37.0, -109.1, -103.0],
  NY: [40.5, 45.0, -79.8, -71.9],
  NC: [33.8, 36.6, -84.3, -75.5],
  ND: [45.9, 49.0, -104.1, -96.6],
  OH: [38.4, 42.0, -84.8, -80.5],
  OK: [33.6, 37.0, -103.0, -94.4],
  OR: [42.0, 46.3, -124.6, -116.5],
  PA: [39.7, 42.3, -80.5, -74.7],
  RI: [41.1, 42.0, -71.9, -71.1],
  SC: [32.0, 35.2, -83.4, -78.5],
  SD: [42.5, 46.0, -104.1, -96.4],
  TN: [35.0, 36.7, -90.3, -81.6],
  TX: [25.8, 36.5, -106.7, -93.5],
  UT: [37.0, 42.0, -114.1, -109.0],
  VT: [42.7, 45.0, -73.4, -71.5],
  VA: [36.5, 39.5, -83.7, -75.2],
  WA: [45.5, 49.0, -124.8, -116.9],
  WV: [37.2, 40.6, -82.6, -77.7],
  WI: [42.5, 47.1, -92.9, -86.8],
  WY: [41.0, 45.0, -111.1, -104.1],
  PR: [17.9, 18.5, -67.3, -65.2],
};

/** Normalize state to 2-letter abbreviation for lookup. */
function normalizeState(state: string): string {
  const s = state.trim().toUpperCase();
  if (s.length === 2) return s;
  const fullToAbbr: Record<string, string> = {
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA',
    COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA',
    HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA',
    KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
    MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS', MISSOURI: 'MO',
    MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH',
    OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT',
    VIRGINIA: 'VA', WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY',
    'WASHINGTON D.C.': 'DC', 'DISTRICT OF COLUMBIA': 'DC', 'PUERTO RICO': 'PR',
  };
  return fullToAbbr[s] ?? s.slice(0, 2);
}

/**
 * Returns true if (lat, lng) falls inside the state's approximate bounds.
 * Used to catch wrong coordinates (e.g. Chicago bar with Detroit coords).
 */
export function coordinatesInState(lat: number, lng: number, state: string): boolean {
  const abbr = normalizeState(state);
  const bounds = STATE_BOUNDS[abbr];
  if (!bounds) return true; // unknown state, don't reject
  const [minLat, maxLat, minLng, maxLng] = bounds;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
