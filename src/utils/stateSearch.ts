/**
 * State abbreviation to full name (for search matching).
 * Used so queries like "Washington state" or "Washington" match bars in WA.
 */
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington D.C.',
};

export interface BarForSearch {
  name: string;
  address: string;
  description: string;
  state: string;
}

/**
 * Normalize search query for state matching: trim and remove trailing " state"
 * so "Washington state" and "washington" both match WA/Washington.
 */
function normalizeQueryForState(query: string): string {
  return query.toLowerCase().replace(/\s+state\s*$/i, '').trim();
}

/**
 * Return true if the bar matches the search query.
 * Matches name, address, description, state abbreviation, or full state name
 * (e.g. "Washington state" or "Washington" matches bars in WA).
 */
export function barMatchesSearch(bar: BarForSearch, searchQuery: string): boolean {
  if (!searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase();
  const qNorm = normalizeQueryForState(searchQuery);

  if (bar.name.toLowerCase().includes(q)) return true;
  if (bar.address.toLowerCase().includes(q)) return true;
  if (bar.description.toLowerCase().includes(q)) return true;
  if (bar.state.toLowerCase().includes(q)) return true;
  // Match full state name (e.g. "Washington state" -> Washington -> WA)
  const fullName = STATE_NAMES[bar.state];
  if (fullName && fullName.toLowerCase().includes(qNorm)) return true;

  return false;
}
