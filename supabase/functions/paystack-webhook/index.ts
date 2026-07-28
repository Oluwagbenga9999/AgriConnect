// supabase/functions/paystack-webhook/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(PAYSTACK_SECRET),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const computed = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === signature
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!(await verifySignature(rawBody, signature))) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event !== 'charge.success') {
    return new Response('ok', { status: 200 })
  }

  const reference = event.data.reference as string

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('paystack_ref', reference)
    .single()

  if (!order) return new Response('Order not found', { status: 404 })

  if (event.data.amount !== order.amount_kobo) {
    return new Response('Amount mismatch', { status: 400 })
  }

  await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id)

  if (order.listing_id) {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', order.listing_id)
  }

  return new Response('ok', { status: 200 })
})
