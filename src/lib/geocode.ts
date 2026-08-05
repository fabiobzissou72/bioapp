// Free geocoding via OpenStreetMap's Nominatim — no API key needed.
// Called once when the agency saves an address, so the public page never
// has to geocode on every view (it just renders the stored coordinates).
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    );
    const results = await res.json();
    if (!results?.[0]) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}
