import Stripe from 'stripe'

// Singleton lazy-initialized — NÃO instancia no module level
// O build do Next.js avalia módulos sem env vars de runtime disponíveis.
// Se instanciar aqui, quebra com "Neither apiKey nor config.authenticator".
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY não configurado no Vercel ou .env.local')
  _stripe = new Stripe(key)
  return _stripe
}

// Price IDs — lidos em runtime dentro das funções, não no module level
export function getStripePrices() {
  return {
    monthly: process.env.STRIPE_PRICE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_ANNUAL!,
    lifetime: process.env.STRIPE_PRICE_LIFETIME!,
  } as const
}

export type StripePlan = 'monthly' | 'annual' | 'lifetime'
