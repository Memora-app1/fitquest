/**
 * API de Referral
 * GET  /api/referral — retorna o código do usuário autenticado
 * POST /api/referral — registra uso de código de referral (ao criar conta)
 *
 * Requer migration 006-referral-system.sql executada no banco.
 * Ambos os usuários (referido + referenciador) recebem +200 XP.
 *
 * Race condition corrigida via RPC use_referral_code_atomic (migration 012).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { grantXP } from '@/lib/xp-server';

const XP_REFERRAL = 200;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, referral_count, name')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });

  return NextResponse.json({
    code: profile.referral_code ?? null,
    count: profile.referral_count ?? 0,
    xpPerReferral: XP_REFERRAL,
  });
}

const bodySchema = z.object({
  code: z.string().min(4).max(12).toUpperCase(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  }

  const { code } = parsed.data;

  // Busca o referenciador ANTES do lock para evitar deadlock se o referenciador
  // tentar usar o próprio código ao mesmo tempo.
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .single();

  if (!referrer) {
    return NextResponse.json({ error: 'code_not_found' }, { status: 404 });
  }

  // RPC atômica: lê referred_by + seta atomicamente com FOR UPDATE.
  // Garante que 2 requests simultâneos não consigam ambos aplicar o referral.
  // use_referral_code_atomic / increment_referral_count são SECURITY DEFINER e só
  // podem ser chamadas pelo service_role (EXECUTE revogado de authenticated na
  // migration 015). increment_referral_count ainda atualiza o perfil do
  // referenciador (outro usuário), o que também exige o service client.
  const db = createServiceClient();
  const { data: result, error: rpcError } = await db.rpc('use_referral_code_atomic', {
    p_user_id: user.id,
    p_code: code,
    p_referrer_id: referrer.id,
  });

  if (rpcError) {
    console.error('[referral] use_referral_code_atomic error:', rpcError.message);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }

  const rpcResult = result as { ok?: boolean; error?: string };

  if (rpcResult.error === 'already_referred') {
    return NextResponse.json({ error: 'already_referred' }, { status: 409 });
  }
  if (rpcResult.error === 'own_code') {
    return NextResponse.json({ error: 'own_code' }, { status: 400 });
  }

  // Incremento atômico do contador do referenciador
  await db.rpc('increment_referral_count', { p_user_id: referrer.id });

  // Concede XP para ambos em paralelo (grant_xp_atomic garante idempotência via source_id)
  await Promise.all([
    grantXP(
      user.id,
      XP_REFERRAL,
      `Bônus de indicação — código ${code} 🤝`,
      'bonus',
      `referral_new_${code}`
    ),
    grantXP(
      referrer.id,
      XP_REFERRAL,
      `Indicação aceita! Novo usuário no Ascendia 🎉`,
      'bonus',
      `referral_sent_${user.id}`
    ),
  ]);

  return NextResponse.json({ ok: true, xpEarned: XP_REFERRAL });
}
