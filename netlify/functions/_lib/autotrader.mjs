let tokenCache = null;
let advertiserIdCache = null;
let stockListCache = null;

function getApiBase() {
  return (process.env.AT_API_BASE || 'https://api-sandbox.autotrader.co.uk').replace(/\/$/, '');
}

function getCredentials() {
  const key = process.env.AT_API_KEY;
  const secret = process.env.AT_API_SECRET;
  if (!key || !secret) {
    throw new Error('Missing AT_API_KEY or AT_API_SECRET environment variables');
  }
  return { key, secret };
}

async function parseJsonResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const message = data?.message || data?.error || res.statusText || 'AutoTrader API error';
    const err = new Error(message);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

export async function authenticate() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAtMs > now + 30_000) {
    return tokenCache.accessToken;
  }

  const { key, secret } = getCredentials();
  const body = new URLSearchParams({ key, secret });
  const res = await fetch(`${getApiBase()}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await parseJsonResponse(res);
  if (!data?.access_token) {
    throw new Error('AutoTrader authentication did not return an access token');
  }

  const expiresAtMs = data.expires_at
    ? Date.parse(data.expires_at)
    : now + 14 * 60 * 1000;

  tokenCache = {
    accessToken: data.access_token,
    expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : now + 14 * 60 * 1000,
  };

  return tokenCache.accessToken;
}

async function authedFetch(path, query = {}) {
  const token = await authenticate();
  const url = new URL(`${getApiBase()}${path}`);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return parseJsonResponse(res);
}

function pickAdvertiser(results) {
  if (!Array.isArray(results) || !results.length) {
    throw new Error('No advertisers returned for these API credentials');
  }

  const preferredName = (process.env.AT_ADVERTISER_NAME || 'driven3').toLowerCase();
  const byName = results.find((a) =>
    String(a?.name || '').toLowerCase().includes(preferredName)
  );
  if (byName?.advertiserId) return byName.advertiserId;

  if (results.length === 1) return results[0].advertiserId;

  const ids = results.map((a) => `${a.advertiserId} (${a.name})`).join(', ');
  throw new Error(
    `Multiple advertisers found (${results.length}). Set AT_ADVERTISER_ID in env. Options: ${ids}`
  );
}

export async function resolveAdvertiserId() {
  if (process.env.AT_ADVERTISER_ID) {
    return process.env.AT_ADVERTISER_ID;
  }
  if (advertiserIdCache) return advertiserIdCache;

  const pageSize = 50;
  let page = 1;
  let all = [];

  while (page <= 5) {
    const data = await authedFetch('/advertisers', { page, pageSize });
    const batch = Array.isArray(data?.results) ? data.results : [];
    all = all.concat(batch);
    if (batch.length < pageSize) break;
    page += 1;
  }

  const advertiserId = pickAdvertiser(all);
  advertiserIdCache = advertiserId;
  return advertiserId;
}

function getStockCacheTtlMs() {
  const seconds = Number(process.env.AT_STOCK_CACHE_SECONDS || 300);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 300_000;
}

export async function fetchStockList({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && stockListCache && stockListCache.expiresAtMs > now) {
    return stockListCache.payload;
  }

  const advertiserId = await resolveAdvertiserId();
  const payload = await authedFetch('/stock', {
    advertiserId,
    lifecycleState: 'FORECOURT',
    pageSize: 100,
    page: 1,
  });

  stockListCache = {
    payload,
    expiresAtMs: now + getStockCacheTtlMs(),
  };

  return payload;
}

export async function fetchStockById(stockId) {
  const advertiserId = await resolveAdvertiserId();
  return authedFetch('/stock', { advertiserId, stockId });
}
