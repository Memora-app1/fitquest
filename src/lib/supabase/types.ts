/**
 * Tipos do banco de dados Supabase
 * Gerados manualmente — quando o projeto crescer, use:
 * npx supabase gen types typescript --project-id XXX > src/lib/supabase/types.ts
 */

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'lifetime'
export type SubscriptionPlan = 'monthly' | 'annual' | 'lifetime'
export type HabitCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'nutrition'
  | 'sleep'
  | 'mindfulness'
  | 'custom'
export type TargetType = 'count' | 'km' | 'minutes' | 'custom'
export type TargetPeriod = 'year' | 'month' | 'week' | 'day'
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'full_body'
export type TaskStatus = 'todo' | 'doing' | 'done' | 'archived'
export type TransactionType = 'expense' | 'income' | 'transfer'
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'paused'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type AiRole = 'user' | 'assistant' | 'system'
export type NotificationType =
  | 'task_reminder'
  | 'habit_reminder'
  | 'streak_alert'
  | 'xp_milestone'
  | 'finance_due'
  | 'coach_insight'
  | 'achievement'

export interface Profile {
  id: string
  name: string
  avatar_url: string | null
  bio: string | null
  timezone: string
  xp_total: number
  level: number
  streak_current: number
  streak_longest: number
  perfect_days: number
  last_activity_date: string | null
  subscription_status: SubscriptionStatus
  subscription_plan: SubscriptionPlan | null
  subscription_started_at: string | null
  subscription_end: string | null
  trial_end: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  streak_freezes: number
  onboarding_completed: boolean
  primary_goal: string | null
  weekly_target: number
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  category: HabitCategory
  target_type: TargetType
  target_value: number
  target_period: TargetPeriod
  target_unit: string | null
  frequency_per_week: number
  reminder_time: string | null
  xp_per_completion: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  logged_date: string
  value: number
  note: string | null
  xp_earned: number
  created_at: string
}

export interface Exercise {
  id: string
  user_id: string | null
  name: string
  muscle_group: MuscleGroup
  equipment: string | null
  instructions: string | null
  video_url: string | null
  is_global: boolean
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  title: string
  notes: string | null
  started_at: string
  finished_at: string | null
  duration_minutes: number | null
  total_volume_kg: number
  total_sets: number
  total_reps: number
  xp_earned: number
  is_personal_record_session: boolean
  created_at: string
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  user_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  duration_seconds: number | null
  distance_km: number | null
  rpe: number | null
  is_personal_record: boolean
  is_warmup: boolean
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  icon: string | null
  category: string
  target_value: number
  current_value: number
  unit: string
  deadline: string | null
  status: GoalStatus
  completed_at: string | null
  linked_habit_id: string | null
  created_at: string
  updated_at: string
}

export interface TaskList {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  display_order: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  list_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  display_order: number
  urgent: boolean
  important: boolean
  due_date: string | null
  reminder_at: string | null
  estimated_minutes: number | null
  completed_at: string | null
  google_event_id: string | null
  recurrence_rule: string | null
  parent_task_id: string | null
  xp_reward: number
  created_at: string
  updated_at: string
}

export interface Subtask {
  id: string
  task_id: string
  user_id: string
  title: string
  is_completed: boolean
  display_order: number
  completed_at: string | null
  created_at: string
}

export interface FinanceAccount {
  id: string
  user_id: string
  name: string
  type: AccountType
  icon: string
  color: string
  current_balance: number
  credit_limit: number | null
  closing_day: number | null
  due_day: number | null
  is_active: boolean
  created_at: string
}

export interface FinanceCategory {
  id: string
  user_id: string | null
  name: string
  type: 'expense' | 'income'
  icon: string | null
  color: string | null
  is_global: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  amount: number
  type: TransactionType
  description: string
  notes: string | null
  transaction_date: string
  is_installment: boolean
  installment_current: number | null
  installment_total: number | null
  installment_group_id: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  parent_transaction_id: string | null
  is_paid: boolean
  paid_at: string | null
  transfer_to_account_id: string | null
  created_at: string
  updated_at: string
}

export interface FinanceGoal {
  id: string
  user_id: string
  title: string
  icon: string
  color: string
  target_amount: number
  current_amount: number
  deadline: string | null
  monthly_target: number | null
  status: GoalStatus
  completed_at: string | null
  created_at: string
}

export interface Achievement {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  xp_reward: number
  rarity: Rarity
  trigger_type: string
  trigger_value: number | null
  created_at: string
}

export interface UserAchievement {
  user_id: string
  achievement_id: string
  unlocked_at: string
}

export interface XpTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  source_type: string | null
  source_id: string | null
  xp_total_after: number
  level_after: number
  created_at: string
}

export interface AiConversation {
  id: string
  user_id: string
  title: string | null
  last_message_at: string
  created_at: string
}

export interface AiMessage {
  id: string
  conversation_id: string
  user_id: string
  role: AiRole
  content: string
  context_snapshot: Record<string, unknown> | null
  tokens_used: number | null
  created_at: string
}

export interface CalendarIntegration {
  id: string
  user_id: string
  provider: string
  access_token: string
  refresh_token: string
  expires_at: string | null
  scope: string | null
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string
  all_day: boolean
  source: string
  external_id: string | null
  integration_id: string | null
  color: string
  is_read_only: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  icon: string | null
  type: NotificationType
  source_id: string | null
  scheduled_for: string
  sent_at: string | null
  read_at: string | null
  action_url: string | null
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  amount_ml: number
  created_at: string
}

export interface SleepLog {
  id: string
  user_id: string
  date: string
  bed_time: string | null
  wake_time: string | null
  duration_hours: number | null
  quality: number | null
  xp_earned: number
  created_at: string
}
