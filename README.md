# 🌱 AgriConnect

A marketplace web app connecting Nigerian farmers directly with buyers — list produce, message, and pay securely via Paystack, with no middleman.

## What it does

AgriConnect has two user roles:

- **Farmers** list produce (crop, quantity, price per kg, location, photos), manage their listings, receive buyer inquiries, and track orders through to delivery.
- **Buyers** browse listings by crop/state, message farmers directly, and pay for produce via Paystack checkout.

Core features:
- Email/password auth with role selection (farmer/buyer) via Supabase Auth
- Listings CRUD with photo upload (Supabase Storage)
- Direct messaging between buyer and farmer per listing, with realtime updates and unread counts
- Paystack checkout with **server-verified** payment confirmation (a Supabase Edge Function verifies the webhook signature and amount before marking an order paid — the amount is never trusted from the browser)
- Order lifecycle: `pending → confirmed → shipped → delivered`
- Dashboard with role-specific quick actions and an onboarding checklist

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript, Vite, React Router v7, Tailwind CSS v4 |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Payments | Paystack (`react-paystack` client SDK + a Deno Edge Function webhook) |
| Deployment | Docker (multi-stage build) + Nginx, GitHub Actions workflow |

## Project structure

```
src/
  components/
    layout/       # Navbar, ProtectedRoute
    listings/      # Browse, create, my listings, listing card
  hooks/           # useAuth, useListings, useOrders, useMessages, useProfile
  pages/
    auth/          # Login, Register
    home/          # Landing, Dashboard
    listings/      # ListingDetail
    messages/      # Inbox, Conversation
    orders/        # OrderHistory
    profile/       # EditProfile, PublicProfile
  store/           # AuthContext
  types/           # Shared TS types
supabase/
  functions/
    paystack-webhook/   # Verifies Paystack signature, confirms orders server-side
```

## Getting started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Paystack](https://paystack.com) account (test mode is fine for development)

### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/Oluwagbenga9999/AgriConnect.git
   cd AgriConnect
   npm install
   ```

2. Copy the env template and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
   ```

3. In your Supabase project, create the `profiles`, `listings`, `messages`, and `orders` tables (see **Database schema** below) with Row Level Security enabled, and a `listing-photos` storage bucket.

4. Deploy the webhook and set its secret:
   ```bash
   supabase functions deploy paystack-webhook
   supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
   ```
   Then add the deployed function URL as a webhook endpoint in your Paystack dashboard, listening for `charge.success`.

5. Run the app:
   ```bash
   npm run dev
   ```

### Docker

```bash
docker build -t agriconnect .
docker run -p 8080:80 agriconnect
```
Note: since Vite env vars are baked in at build time, pass them as build args or bake a `.env` into the build context before running `docker build`.

## Database schema (expected tables)

| Table | Key columns |
|---|---|
| `profiles` | `id`, `role` (farmer/buyer), `full_name`, `phone`, `location`, `state`, `crop_types`, `bio`, `avatar_url` |
| `listings` | `id`, `farmer_id`, `crop`, `quantity_kg`, `price_per_kg`, `location`, `state`, `description`, `photos`, `status` |
| `messages` | `id`, `listing_id`, `sender_id`, `receiver_id`, `content`, `read` |
| `orders` | `id`, `listing_id`, `buyer_id`, `farmer_id`, `amount_kobo`, `status`, `paystack_ref` |

> ⚠️ This repo has no `supabase/migrations/` folder, so the schema and RLS policies currently live only in the Supabase dashboard. See **Known issues** below.

## Known issues / recommended fixes

1. **No version-controlled RLS policies (highest priority).** The `orders.status` and `listings.status` columns are updatable directly from the browser via the anon key (e.g. `updateOrderStatus`). Payment confirmation is correctly done server-side in the webhook, but if the `orders` table's Row Level Security doesn't explicitly block clients from setting `status = 'confirmed'` themselves, a buyer could mark their own order as paid without ever paying. Add (and commit to the repo as SQL migrations) a policy that only allows farmers to advance `shipped`/`delivered`, and never allows a client to set `confirmed`.
2. **`.env.example` is missing `VITE_PAYSTACK_PUBLIC_KEY`.** Anyone following the current example file gets a checkout that fails silently.
3. **No role-based route guards.** `ProtectedRoute` accepts a `role` prop but it's never passed on any route, so a buyer can navigate directly to `/listings/create` and publish a listing.
4. **Debug scripts read `.env` and hit the live database.** `supabase_listings_check.mjs` and `supabase_orders_check.mjs` look like ad-hoc debugging scripts — fine locally, but worth moving out of the repo root (e.g. into a `scripts/` folder, gitignored) so they aren't mistaken for part of the app.

## Roadmap ideas

- Order cancellation / refund flow (currently only forward transitions exist)
- Farmer ratings & reviews after delivery
- Push/email notifications for new messages and order updates
- Search by location radius, not just exact state match
- Multi-photo listing gallery (currently only the first photo is shown on cards/detail)
- Pagination or infinite scroll on `BrowseListings` (currently loads all matching listings at once)

## License

No license file is currently included — add one (MIT is a common default for a project like this) before accepting external contributions.