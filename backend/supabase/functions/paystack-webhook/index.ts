// supabase/functions/paystack-webhook/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') ?? 'https://your-app-url.com'

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

async function notifyFarmer(email: string, cropName: string, amountKobo: number) {
  if (!RESEND_API_KEY) return
  const amountNaira = (amountKobo / 100).toLocaleString('en-NG')
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AgriConnect <orders@resend.dev>',
        to: [email],
        subject: `🎉 You made a sale — ${cropName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1F6E45;">You just made a sale!</h2>
            <p>Someone paid <strong>₦${amountNaira}</strong> for your <strong>${cropName}</strong> listing.</p>
            <p>Log in to AgriConnect to see the order and mark it as packaged once it's ready to send.</p>
            <a href="${APP_URL}/orders"
              style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1F6E45;color:white;text-decoration:none;border-radius:8px;">
              View your orders
            </a>
          </div>
        `,
      }),
    })
  } catch (err) {
    console.error('Failed to send farmer notification email:', err)
  }
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
    .select('*, listing:listings(crop)')
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

  const { data: farmerAuth } = await supabase.auth.admin.getUserById(order.farmer_id)
  if (farmerAuth?.user?.email) {
    await notifyFarmer(
      farmerAuth.user.email,
      order.listing?.crop ?? 'your produce',
      order.amount_kobo
    )
  }

  return new Response('ok', { status: 200 })
})