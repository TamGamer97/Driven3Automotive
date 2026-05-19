import { fetchStockById, fetchStockList } from './_lib/autotrader.mjs';
import { mapStockItem, mapStockResults } from './_lib/map-stock.mjs';
import { errorResponse, jsonResponse } from './_lib/http.mjs';

function getStockIdFromPath(event) {
  const raw =
    event.pathParameters?.stockId ||
    event.path?.replace(/^.*\/api\/listings\/?/, '') ||
    '';
  return decodeURIComponent(String(raw).split('/')[0] || '').trim();
}

export async function handler(event) {
  const stockId = getStockIdFromPath(event);
  if (!stockId) {
    return errorResponse('Missing listing id', 400);
  }

  try {
    let payload;
    try {
      payload = await fetchStockById(stockId);
    } catch (singleErr) {
      if (singleErr.status !== 404) throw singleErr;
      const listPayload = await fetchStockList();
      const match = mapStockResults(listPayload).find(
        (item) =>
          String(item.id) === stockId ||
          String(item.searchId) === stockId
      );
      if (match) return jsonResponse(match);
      throw singleErr;
    }

    const item = Array.isArray(payload?.results) ? payload.results[0] : payload;
    if (!item) {
      return errorResponse('Listing not found', 404);
    }

    const listing = mapStockItem(item);
    if (!listing.id) {
      return errorResponse('Listing not found', 404);
    }

    return jsonResponse(listing);
  } catch (err) {
    console.error('listing error:', err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    if (status === 404) {
      return errorResponse('Listing not found', 404);
    }
    return errorResponse(err.message || 'Failed to load listing', status, err.details);
  }
}
