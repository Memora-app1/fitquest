/**
 * POST /api/focus-session
 * Registra sessão de foco concluída e concede XP.
 * Idempotente via source_id (UUID gerado no client).
 *
 * XP por duração:
 *   15 min → +20 XP
 *   25 min → +30 XP
 *   50 min → +50 XP
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { grantXP } from '@/lib/xp-server';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  durationMinutes: z.number().int().min(1).max(120),
  taskName: z.string().max(200).optional(),
});

const XP_BY_DURATION: Record<number, number> = {
  15: 20,
  25: 30,
  50: 50,
};

function getXpForDuration(minutes: number): number {
  if (minutes >= 50) return XP_BY_DURATION[50]!;
  if (minutes >= 25) return XP_BY_DURATION[25]!;
  return XP_BY_DURATION[15]!;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const { sessionId, durationMinutes, taskName } = parsed.data;
  const xp = getXpForDuration(durationMinutes);
  const reason = taskName
    ? `Sessão de foco: ${taskName} (${durationMinutes}min)`
    : `Sessão de foco (${durationMinutes}min)`;

  const result = await grantXP(user.id, xp, reason, 'task', `focus_${sessionId}`);

  return NextResponse.json({
    ok: true,
    xpEarned: result.xpEarned,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
  });
}
