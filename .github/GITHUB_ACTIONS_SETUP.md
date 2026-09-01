# GitHub Actions Secrets Setup

To enable the CI/CD pipeline to work properly, you need to add the following secrets to your GitHub repository.

## How to add secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

## Required Secrets

### Docker Hub Credentials
These are needed to push Docker images to Docker Hub.

| Secret Name | Value | Where to find |
|---|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | https://hub.docker.com/settings/account |
| `DOCKERHUB_TOKEN` | Your Docker Hub access token | https://hub.docker.com/settings/security (create a new token) |

### Frontend Environment Variables
These are built into the frontend during the Docker build.

| Secret Name | Value | Where to find |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase dashboard → Settings → API |
| `VITE_PAYSTACK_PUBLIC_KEY` | Your Paystack public key | Paystack dashboard → Settings → API Keys & Webhooks |

### Backend Environment Variables (Optional)
If deploying backend separately, these would be needed:

| Secret Name | Value | Where to find |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Supabase dashboard → Settings → API |
| `PAYSTACK_SECRET_KEY` | Your Paystack secret key | Paystack dashboard → Settings → API Keys & Webhooks |

## What the workflow does

**On every push to `main` branch:**

1. **Build Frontend** - Installs dependencies, lints code, builds React app
2. **Build Backend** - Validates Deno Edge Functions
3. **Docker Build & Push** - If build succeeds, builds Docker images and pushes to Docker Hub

**Images created:**
- `dockerhub-username/agriconnect-frontend:latest`
- `dockerhub-username/agriconnect-backend:latest`

## Docker Hub Token Creation

1. Go to https://hub.docker.com/settings/security
2. Click **New Access Token**
3. Name it (e.g., `agriconnect-ci`)
4. Set permissions: `Read, Write`
5. Copy the token and add as `DOCKERHUB_TOKEN` secret in GitHub

## Verifying secrets are set

Run a test workflow:
1. Push a commit to `main` (or manually trigger via Actions tab)
2. Check the GitHub Actions tab for workflow status
3. If secrets are missing, the workflow will show the error

## Local testing

You can test the Docker builds locally before pushing:

```bash
# Frontend
docker build -t agriconnect-frontend:test ./frontend

# Backend
docker build -t agriconnect-backend:test ./backend
```

## Security best practices

✅ **Do:**
- Rotate access tokens regularly
- Use separate tokens for different services
- Restrict token permissions to minimum needed
- Never commit secrets to Git

❌ **Don't:**
- Share tokens or secrets in Slack/email
- Commit `.env` files to GitHub
- Use production secrets in development
