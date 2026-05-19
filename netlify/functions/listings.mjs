import { fetchStockList } from './_lib/autotrader.mjs';
import { mapStockResults } from './_lib/map-stock.mjs';
import { errorResponse, jsonResponse } from './_lib/http.mjs';

export async function handler() {
  try {
    const payload = await fetchStockList();
    const listings = mapStockResults(payload);
    return jsonResponse(listings);
  } catch (err) {
    console.error('listings error:', err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    return errorResponse(err.message || 'Failed to load listings', status, err.details);
  }
}
