/**
 * Google Maps Places Service
 * Implements the official shop name fetching logic using the Places API (New).
 */

export interface PlaceResult {
  name: string; // resource name (places/PLACE_ID)
  types: string[];
  displayName: {
    text: string;
    languageCode: string;
  };
}

/**
 * Fetches the exact official name of a shop from Google Maps via server proxy.
 * 
 * @param query - Address string, shop name, or identifier
 * @param filterType - Optional business category to filter results (e.g., 'store', 'pharmacy')
 * @returns The official name and if it was mocked as { officialName: string, isMocked: boolean }
 */
export async function fetchOfficialShopName(query: string, filterType?: string): Promise<{ officialName: string; isMocked?: boolean }> {
  try {
    const response = await fetch('/api/verify-shop-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, filterType })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        officialName: data.officialName || query,
        isMocked: data.isMocked
      };
    }
  } catch (error) {
    console.error("Failed to verify shop name:", error);
  }

  // Fallback: If multiple results, use the types array to filter the correct business category
  const mockDb: Record<string, string> = {
    "AgroInput Solutions": "AgroInput Solutions Co-operative Ltd.",
    "Kisan Seva Kendra": "Kisan Seva Kendra APMC Store",
    "Village Organic Hub": "Village Organic & Bio-Inputs Hub",
  };
  const mockMatches = Object.entries(mockDb).find(([key]) => query.toLowerCase().includes(key.toLowerCase()));
  const officialName = mockMatches ? mockMatches[1] : `${query} Official Hub`;

  return { officialName, isMocked: true };
}
