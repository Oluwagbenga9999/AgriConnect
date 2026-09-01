# Backend Dockerfile
# Supabase Edge Functions with Deno
FROM denoland/deno:latest

WORKDIR /app

COPY . .

# Pre-compile the Edge Function
RUN deno cache supabase/functions/paystack-webhook/index.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-env", "supabase/functions/paystack-webhook/index.ts"]
