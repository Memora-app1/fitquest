import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICES, type StripePlan } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const formData = await req.formData()
  const plan = String(formData.get('plan') ?? '') as StripePlan

  if (!['monthly', 'annual', 'lifetime'].includes(plan)) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const isLifetime = plan === 'lifetime'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/planos?checkout=cancelled`,
      ...(isLifetime
        ? {}
        : {
            subscription_data: {
              metadata: { user_id: user.id, plan },
              trial_period_days: plan === 'annual' ? 7 : undefined,
            },
          }),
    })

    return NextResponse.redirect(session.url ?? `${appUrl}/planos`, 303)
  } catch (err) {
    console.error('checkout error', err)
    return NextResponse.redirect(new URL('/planos?error=checkout', req.url))
  }
}
