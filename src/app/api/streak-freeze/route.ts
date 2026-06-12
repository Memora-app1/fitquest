/**
 * Streak Freeze API
 *
 * MIGRATION OBRIGATÓRIA — rode no Supabase SQL Editor antes de usar:
 * -----------------------------------------------------------------------
 * ALTER TABLE profiles
 *   ADD COLUMN IF NOT EXISTS streak_freezes INT NOT NULL DEFAULT 3;
 * -----------------------------------------------------------------------
 *
 * POST /api/streak-freeze/use  — usa um freeze para proteger o streak
 * POST /api/streak-freeze/grant — concede freezes (admin/sistema)
 *
 * O mecanismo automático está no cron de streaks (streak.ts updateUserStreak),
 * que usa um freeze antes de zerar o streak quando o usuário perdeu um dia.
 *
 * Este endpoint é para uso manual (ex: o usuário quer "ativar" um freeze
 * antes de viajar e não poder fazer atividade).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const grantSchema = z.object({
  action: z.literal('grant'),
  amount: z.number().int().min(1).max(10),
});

const useSchema = z.object({
  action: z.literal('use'),
});

const bodySchema = z.discriminatedUnion('action', [grantSchema, useSchema]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  // ── Fetch current state ──────────────────────────────────────────────────
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('streak_freezes, streak_current')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const currentFreezes = (profile.streak_freezes as number) ?? 0;

  // ── USE: remove 1 freeze, protect streak for today ───────────────────────
  if (parsed.data.action === 'use') {
    if (currentFreezes <= 0) {
      return NextResponse.json(
        { error: 'no_freezes_available', message: 'Você não tem freezes disponíveis.' },
        { status: 409 }
      );
    }

    const { error } = await serviceClient
      .from('profiles')
      .update({ streak_freezes: currentFreezes - 1 })
      .eq('id', user.id);

    if (error) {
      console.error('streak-freeze/use error:', error);
      return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      action: 'used',
      freezesRemaining: currentFreezes - 1,
      message: `Freeze ativado! Seu streak está protegido. Restam ${currentFreezes - 1} freeze${currentFreezes - 1 !== 1 ? 's' : ''}.`,
    });
  }

  // ── GRANT: adiciona freezes (service-to-service, valida header de admin) ─
  if (parsed.data.action === 'grant') {
    const { timingSafeEqual } = await import('crypto');
    const adminKey = req.headers.get('x-admin-key') ?? '';
    const expected = process.env.ADMIN_SECRET_KEY ?? '';
    const safe =
      expected.length > 0 &&
      adminKey.length === expected.length &&
      timingSafeEqual(Buffer.from(adminKey), Buffer.from(expected));
    if (!safe) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const newTotal = Math.min(currentFreezes + parsed.data.amount, 10);
    const { error } = await serviceClient
      .from('profiles')
      .update({ streak_freezes: newTotal })
      .eq('id', user.id);

    if (error) {
      console.error('streak-freeze/grant error:', error);
      return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      action: 'granted',
      amount: parsed.data.amount,
      newTotal,
    });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_freezes, streak_current')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    freezes: (profile?.streak_freezes as number) ?? 0,
    streakCurrent: (profile?.streak_current as number) ?? 0,
  });
}
