# Driven3 Automotive

Static site + Supabase-backed listings.

## Layout

| Path | Purpose |
|------|---------|
| `index.html` | Homepage (site entry) |
| `pages/listing.html` | Vehicle detail (`?id=`) |
| `pages/admin.html` | Dealer admin |
| `pages/coming-soon.html` | Placeholder page |
| `assets/images/` | Favicon and brand images |
| `data/listing-imports/` | Example / import JSON for listings |
| `js/` | Enquiry + Supabase client and listings API |
| `_redirects` | Netlify rewrites (incl. legacy `/listing.html` → `pages/`) |

Root-relative URLs (`/assets/...`, `/pages/...`, `/js/...`) are used so pages work from any path depth.

## AutoTrader stock (live)

Public stock is loaded from **AutoTrader Connect** via Netlify Functions (`/api/listings`). You only need an **API key** and **secret**; `advertiserId` is resolved automatically from `GET /advertisers` (set `AT_ADVERTISER_ID` if you have multiple advertisers).

1. Copy [`.env.example`](.env.example) to `.env` and add your credentials.
2. Local: `npx netlify dev` (serves the site and API).
3. Production: Netlify → **Site settings → Environment variables** — same names as `.env.example`.

| Variable | Required |
|----------|----------|
| `AT_API_KEY` | Yes |
| `AT_API_SECRET` | Yes |
| `AT_API_BASE` | No (defaults to sandbox) |
| `AT_ADVERTISER_ID` | No (auto-discovered) |
| `AT_STOCK_CACHE_SECONDS` | No (default `300`) |

Admin (`/admin`) still uses Supabase. The homepage **merges** AutoTrader stock and Supabase `active` listings (same registration = AutoTrader wins). Set `AT_ADVERTISER_ID=10042640` on Netlify if auto-discovery picks the wrong dealer account.
