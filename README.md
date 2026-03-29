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
