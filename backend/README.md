# 🔧 AgriConnect Backend

Supabase Edge Functions and database configuration for AgriConnect.

## What's included

- **Supabase Edge Functions** (Deno) for server-side logic
- **PostgreSQL** database schemas and migrations
- **Row Level Security (RLS)** policies
- **Paystack webhook handler** for payment verification

## Project structure

```
supabase/
  config.toml               # Supabase project configuration
  functions/
    paystack-webhook/       # Verifies Paystack signatures
      index.ts
      deno.json
      
01_schema.sql               # Database tables and relationships
02_rls_policies.sql         # Row Level Security policies
```

## Database schema

### Tables

**profiles**
- User info: role (farmer/buyer), name, phone, location
- RLS: Users can only read/update their own profile

**listings**
- Farmer's produce: crop, quantity, price, photos, location
- RLS: Farmers can CRUD their own listings, buyers can read all

**messages**
- Buyer-farmer conversations per listing
- RLS: Only conversation participants can view/send messages

**orders**
- Purchase records with lifecycle: pending → confirmed → shipped → delivered
- RLS: Farmers/buyers can only see their own orders

### Storage

**listing-photos** bucket
- Public read, authenticated write
- Users can upload produce photos

## Getting started

### Prerequisites
- Node.js 20+ (for Supabase CLI)
- Supabase account
- Paystack account

### Setup

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Create database tables (run in Supabase dashboard SQL editor):
   ```sql
   -- See 01_schema.sql
   ```

4. Apply RLS policies:
   ```sql
   -- See 02_rls_policies.sql
   ```

5. Create storage bucket `listing-photos` in Supabase dashboard

6. Deploy the webhook function:
   ```bash
   supabase functions deploy paystack-webhook
   ```

7. Set Paystack secret in Supabase:
   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
   ```

8. Add webhook endpoint in Paystack dashboard:
   - Get deployed function URL from Supabase
   - Listen for: `charge.success`
   - Secret: `PAYSTACK_SECRET_KEY`

## Paystack Webhook handler

The `paystack-webhook` function:
1. Receives charge confirmation from Paystack
2. **Verifies HMAC signature** using secret key
3. **Validates amount** matches the order total
4. **Updates order status** from `pending` to `confirmed`
5. Responds with `200 OK`

This ensures payment verification happens on the server, never trusting the browser.

## Supabase CLI commands

- `supabase functions list` - List deployed functions
- `supabase functions logs paystack-webhook` - View function logs
- `supabase secrets list` - List environment secrets
- `supabase db pull` - Download schema from remote project

## Environment secrets

Set these in Supabase:

```
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx    # Paystack secret key for webhook verification
```

## Deployment

The backend is deployed as part of Supabase hosting. Edge Functions automatically scale.

### Docker

```bash
docker build -f Dockerfile -t agriconnect-backend .
docker run -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... agriconnect-backend
```

Note: In production, use Supabase Cloud's Edge Functions (recommended) rather than self-hosting.
