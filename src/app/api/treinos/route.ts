import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { XP_REWARDS } from '@/lib/xp'
import { grantXP, tryUnlockAchievement } from '@/lib/xp-server'

export const maxDuration = 30

const setEntrySchema = z.object({
  exercise_name: z.string().min(1).max(100).trim(),
  weight_kg: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(999),
  sets: z.number().int().min(1).max(100),
})

const bodySchema = z.object({
  title: z.string().min(1).max(200).trim(),
  sets: z.array(setEntrySchema).min(1).max(50),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { title, sets: setEntries } = parsed.data
  const userId = user.id

  // 1. Resolve exercises: look up by name (user's or global), create if missing
  const { data: existingExercises } = await supabase
    .from('exercises')
    .select('id, name, user_id')
    .or(`user_id.eq.${userId},is_global.eq.true`)

  const exerciseMap = new Map<string, string>()
  // Global first, then user's (user's override global with same name)
  const globalExercises = (existingExercises ?? []).filter((e) => e.user_id !== userId)
  const userExercises = (existingExercises ?? []).filter((e) => e.user_id === userId)
  for (const ex of globalExercises) exerciseMap.set(ex.name.toLowerCase(), ex.id)
  for (const ex of userExercises) exerciseMap.set(ex.name.toLowerCase(), ex.id)

  const uniqueNameMap = new Map<string, string>()
  for (const entry of setEntries) {
    uniqueNameMap.set(entry.exercise_name.toLowerCase(), entry.exercise_name.trim())
  }

  const missingNames = [...uniqueNameMap.entries()].filter(([lower]) => !exerciseMap.has(lower))

  if (missingNames.length > 0) {
    const toCreate = missingNames.map(([, originalName]) => ({
      user_id: userId,
      name: originalName,
      muscle_group: 'full_body',
      is_global: false,
    }))

    const { data: created, error: createError } = await supabase
      .from('exercises')
      .insert(toCreate)
      .select('id, name')

    if (createError || !created) {
      console.error('treinos: falha ao criar exercícios', createError)
      return NextResponse.json({ error: 'exercise_creation_failed' }, { status: 500 })
    }

    for (const ex of created) {
      exerciseMap.set(ex.name.toLowerCase(), ex.id)
    }
  }

  // 2. Check historical PRs: max weight per exercise
  const allExerciseIds = setEntries
    .map((s) => exerciseMap.get(s.exercise_name.toLowerCase()))
    .filter((id): id is string => id !== undefined)
  const uniqueExerciseIds = [...new Set(allExerciseIds)]

  const { data: historicalSets } = await supabase
    .from('workout_sets')
    .select('exercise_id, weight_kg')
    .eq('user_id', userId)
    .in('exercise_id', uniqueExerciseIds)

  const historicalMax = new Map<string, number>()
  for (const s of historicalSets ?? []) {
    if (s.weight_kg === null) continue
    const current = historicalMax.get(s.exercise_id) ?? 0
    if (Number(s.weight_kg) > current) historicalMax.set(s.exercise_id, Number(s.weight_kg))
  }

  // 3. Create workout record
  const now = new Date()
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      title,
      started_at: now.toISOString(),
      finished_at: now.toISOString(),
      duration_minutes: 0,
      total_volume_kg: 0,
      total_sets: 0,
      total_reps: 0,
      xp_earned: 0,
      is_personal_record_session: false,
    })
    .select('id')
    .single()

  if (workoutError || !workout) {
    console.error('treinos: falha ao criar workout', workoutError)
    return NextResponse.json({ error: 'workout_creation_failed' }, { status: 500 })
  }

  const workoutId = workout.id

  // 4. Build and insert workout_sets
  type SetRow = {
    workout_id: string
    exercise_id: string
    user_id: string
    set_number: number
    reps: number
    weight_kg: number
    is_personal_record: boolean
    is_warmup: boolean
  }

  const setRows: SetRow[] = []
  let globalSetNumber = 0
  let totalVolumeKg = 0
  let totalSets = 0
  let totalReps = 0
  let hasPR = false

  for (const entry of setEntries) {
    const exerciseId = exerciseMap.get(entry.exercise_name.toLowerCase())
    if (!exerciseId) continue

    const historicalMaxWeight = historicalMax.get(exerciseId) ?? 0
    const isPR = entry.weight_kg > 0 && entry.weight_kg > historicalMaxWeight
    if (isPR) hasPR = true

    for (let i = 0; i < entry.sets; i++) {
      globalSetNumber++
      setRows.push({
        workout_id: workoutId,
        exercise_id: exerciseId,
        user_id: userId,
        set_number: globalSetNumber,
        reps: entry.reps,
        weight_kg: entry.weight_kg,
        is_personal_record: isPR,
        is_warmup: false,
      })
      totalVolumeKg += entry.weight_kg * entry.reps
      totalSets++
      totalReps += entry.reps
    }
  }

  const { error: setsError } = await supabase.from('workout_sets').insert(setRows)

  if (setsError) {
    console.error('treinos: falha ao inserir sets', setsError)
    await supabase.from('workouts').delete().eq('id', workoutId)
    return NextResponse.json({ error: 'sets_creation_failed' }, { status: 500 })
  }

  // 5. Calculate XP
  const setBonus = Math.min(totalSets * XP_REWARDS.WORKOUT_SET_BONUS, XP_REWARDS.WORKOUT_SET_BONUS_MAX)
  const xpAmount = XP_REWARDS.WORKOUT_COMPLETED + setBonus + (hasPR ? XP_REWARDS.PERSONAL_RECORD : 0)

  // 6. Update workout with totals and XP
  await supabase
    .from('workouts')
    .update({
      total_volume_kg: totalVolumeKg,
      total_sets: totalSets,
      total_reps: totalReps,
      xp_earned: xpAmount,
      is_personal_record_session: hasPR,
    })
    .eq('id', workoutId)

  // 7. Grant XP (xpAmount already includes PR bonus when hasPR)
  let xpResult
  try {
    xpResult = await grantXP(userId, xpAmount, `Treino: ${title}`, 'workout', workoutId)
  } catch (err) {
    console.error('treinos: falha ao conceder XP', err)
    xpResult = { xpEarned: xpAmount, leveledUp: false, newLevel: 1, achievementsUnlocked: [] as string[] }
  }

  // 8. Achievement checks
  const { count: workoutCount } = await (await createClient())
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('finished_at', 'is', null)

  const total = workoutCount ?? 0
  const achievementsUnlocked: string[] = [...(xpResult.achievementsUnlocked ?? [])]
  const checkAndTrack = async (slug: string) => {
    const unlocked = await tryUnlockAchievement(userId, slug)
    if (unlocked) achievementsUnlocked.push(slug)
  }

  if (total === 1)   await checkAndTrack('first_workout')
  if (total === 10)  await checkAndTrack('workouts_10')
  if (total === 50)  await checkAndTrack('workouts_50')
  if (total === 100) await checkAndTrack('workouts_100')
  if (total === 365) await checkAndTrack('workouts_365')
  if (hasPR)         await checkAndTrack('first_pr')

  return NextResponse.json({
    workoutId,
    xpEarned: xpAmount,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    isPR: hasPR,
    achievementsUnlocked,
  })
}

// DELETE /api/treinos?id=...
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  // Delete sets first (FK constraint)
  await supabase.from('workout_sets').delete().eq('workout_id', id).eq('user_id', user.id)

  const { error } = await supabase.from('workouts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
