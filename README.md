# 🌱 AgriConnect

A marketplace web app connecting Nigerian farmers directly with buyers — list produce, message, and pay securely via Paystack, with no middleman.

**This is a monorepo with separate frontend and backend services.**

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

## Project structure

```
frontend/          # React + Vite frontend application
  src/
  package.json
  Dockerfile
  nginx.conf
  
backend/           # Supabase Edge Functions & database
  supabase/
    functions/
      paystack-webhook/
  01_schema.sql
  02_rls_policies.sql
  package.json
  Dockerfile

docker-compose.yml # Multi-service orchestration
```

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript, Vite, React Router v7, Tailwind CSS v4 |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Payments | Paystack (`react-paystack` client SDK + a Deno Edge Function webhook) |
| Deployment | Docker + Docker Compose, Nginx, GitHub Actions |

## Quick start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for containerized setup)
- A [Supabase](https://supabase.com) project
- A [Paystack](https://paystack.com) account (test mode is fine for development)

### Local development

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/Oluwagbenga9999/AgriConnect.git
   cd AgriConnect
   npm run install:all
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env.local
   ```
   Fill in your Supabase and Paystack keys.

3. Set up database (in your Supabase project):
   - Create tables: `profiles`, `listings`, `messages`, `orders`
   - Create storage bucket: `listing-photos`
   - Enable Row Level Security
   - See [backend/README.md](backend/README.md) for SQL schemas

4. Deploy the webhook:
   ```bash
   cd backend
   supabase functions deploy paystack-webhook
   supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
   ```

5. Run both services:
   ```bash
   npm run dev
   # This runs frontend dev server on http://localhost:5173
   # and backend on http://localhost:8000
   ```

### Testing

Local testing is configured for both frontend and backend:

**Frontend (Vitest + React Testing Library):**
```bash
cd frontend
npm run test           # Run tests once
npm run test:ui       # Interactive test dashboard
npm run test:coverage # Generate coverage report
```

**Backend (Deno testing):**
```bash
cd backend
npm run test          # Run tests once
npm run test:watch   # Watch mode - re-run on changes
npm run lint         # Lint with deno lint
```

Full testing guide: [TESTING.md](TESTING.md)

### Docker Compose (production-like)

```bash
docker-compose up --build
```

Accesses:
- Frontend: http://localhost
- Backend API: http://localhost:8000 (via bridge network)

### CI/CD with GitHub Actions

Automated builds & deployments are configured in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**What happens on every push to `main`:**
1. Lints and builds the frontend
2. Validates the backend
3. Builds and pushes Docker images to Docker Hub

**To enable this:**
1. Fork/push this repo to GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add required secrets (see [.github/GITHUB_ACTIONS_SETUP.md](.github/GITHUB_ACTIONS_SETUP.md) for complete setup guide)

**Secrets needed:**
- `DOCKERHUB_USERNAME` & `DOCKERHUB_TOKEN` (for pushing images)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PAYSTACK_PUBLIC_KEY` (frontend build)

See [.github/GITHUB_ACTIONS_SETUP.md](.github/GITHUB_ACTIONS_SETUP.md) for detailed setup.

See [frontend/README.md](frontend/README.md) and [backend/README.md](backend/README.md) for service-specific instructions.

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