# Supabase Integration

This project now uses Supabase through browser-side modules in `js/backend/`.

## Files

- `supabase-config.js` - Supabase URL, publishable key, and table names.
- `supabase-client.js` - Supabase client singleton.
- `listings-api.js` - Listings CRUD + auth helpers.

## Current project

- Project name: `Driven3Automotive`
- Project ID: `oawzxijcucoudwktwpmr`

## Required Supabase setup

Use a table named `public.listings` with fields that match these keys:

- `make`, `model`, `variant`, `year`, `miles`, `fuel`, `trans`, `price`
- `body`, `img`, `badge`, `color`, `doors`, `seats`
- `engine`, `power`, `torque`, `co2`, `reg`, `owners`
- `mot`, `service_history`, `description`
- `features` (JSON array), `imgs` (JSON array)
- `status` (e.g. `active`, `sold`, `reserved`, `draft`)

Admin login uses a DB-backed credentials table:

- `public.admin_users`
  - `username` (PK)
  - `password_hash` (bcrypt via `crypt`)
  - `is_active` (boolean)

Credentials are checked through secure SQL functions (`admin_login`, `admin_verify`) and are not stored as plaintext in the DB.
After successful login, the backend issues a short-lived session token and the frontend stores only that token (not raw credentials).

## Admin credential management

Create or update an admin credential (replace placeholders):

```sql
insert into public.admin_users (username, password_hash, is_active)
values ('<username>', extensions.crypt('<strong_password>', extensions.gen_salt('bf')), true)
on conflict (username) do update
set password_hash = excluded.password_hash,
    is_active = excluded.is_active,
    updated_at = now();
```

## Change Supabase connection

Default URL and key are in `supabase-config.js`.

To change it at runtime:

```js
window.D3Supabase.setConnection("https://your-project.supabase.co", "your_publishable_key");
```

Values are stored in localStorage as:

- `d3.supabase.url`
- `d3.supabase.publishableKey`
