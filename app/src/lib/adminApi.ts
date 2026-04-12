// Admin API client - wraps all admin_* RPCs on Supabase
// All functions require the calling user to have profiles.is_admin = true
// (enforced server-side via SECURITY DEFINER RPCs).

import { supabase } from "@/integrations/supabase/client";

export type Kpis = {
  total_users: number;
  new_users_period: number;
  paid_users: number;
  tier_breakdown: Record<string, number>;
  total_conversations: number;
  conversations_period: number;
  total_messages: number;
  messages_period: number;
  total_feedbacks: number;
  avg_rating: number;
  total_referrals: number;
  total_credits_purchased: number;
  total_credits_consumed: number;
  stripe_events_period: number;
  emails_sent_period: number;
  emails_failed_period: number;
};

export type TimeseriesPoint = { date: string; count: number };
export type Timeseries = { signups: TimeseriesPoint[]; messages: TimeseriesPoint[] };

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  gender: string | null;
  language: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_period_end: string | null;
  credits: number | null;
  referral_code: string | null;
  referred_by_code: string | null;
  badges: string[] | null;
  is_admin: boolean | null;
  created_at: string;
  conversations_count: number;
  messages_count: number;
  filleuls_count: number;
  last_activity: string;
};

export type AdminConversation = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_first_name: string | null;
  title: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type AdminMessage = {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  created_at: string;
};

export type AdminFeedback = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  guide: string;
  rating: number;
  text: string | null;
  user_message: string | null;
  assistant_message: string | null;
  created_at: string;
};

export type AdminCreditTx = {
  id: string;
  user_id: string;
  user_email: string | null;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  stripe_session_id: string | null;
  created_at: string;
};

export type AdminStripeEvent = {
  id: string;
  stripe_event_id: string;
  type: string;
  user_id: string | null;
  user_email: string | null;
  processed: boolean | null;
  error: string | null;
  created_at: string;
};

export type AdminEmailLog = {
  id: string;
  recipient: string;
  type: string;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

export type AdminReferrer = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  referral_code: string | null;
  filleuls_count: number;
  created_at: string;
};

export type UserDetail = {
  email: string | null;
  profile: Record<string, unknown> | null;
  conversations: Array<{
    id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
    message_count: number;
  }>;
  credit_transactions: Array<{
    id: string;
    amount: number;
    balance_after: number;
    type: string;
    description: string | null;
    created_at: string;
  }>;
  feedbacks: Array<{
    id: string;
    guide: string;
    rating: number;
    text: string | null;
    user_message: string | null;
    created_at: string;
  }>;
};

// Generic RPC caller
async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (supabase as any).rpc(fn, args);
  if (error) {
    console.error(`[admin] rpc ${fn} failed:`, error);
    throw error;
  }
  return data as T;
}

// Analytics types
export type LiveVisitors = {
  total: number;
  total_humans: number;
  total_bots: number;
  sessions: Array<{
    session_id: string;
    last_path: string;
    page_count: number;
    last_seen: string;
    surface: "site" | "app";
    user_id: string | null;
    user_agent: string | null;
    is_bot: boolean;
  }>;
};

export type TopPage = {
  path: string;
  surface: "site" | "app";
  views: number;
  unique_sessions: number;
  avg_time_ms: number | null;
};

export type TrafficSources = {
  channels: Record<string, number>;
  sources: Array<{ name: string; count: number }>;
  referrers: Array<{ name: string; count: number }>;
};

export type DeviceBreakdown = {
  devices: Record<string, number>;
  os: Record<string, number>;
  browsers: Record<string, number>;
  locales: Record<string, number>;
};

export type UserJourney = {
  session_id: string;
  user_id: string | null;
  surface: string;
  first_seen: string;
  last_seen: string;
  duration_seconds: number;
  page_count: number;
  pages: Array<{ path: string; at: string; surface: string }>;
  referrer_domain: string | null;
  utm_source: string | null;
  user_agent: string | null;
  is_bot: boolean;
};

export type BotStats = {
  total_bot_hits: number;
  total_bot_sessions: number;
  unique_pages_crawled: number;
  first_crawl: string | null;
  last_crawl: string | null;
  crawl_window_hours: number;
  by_bot: Array<{ name: string; hits: number; sessions: number; unique_pages: number }>;
  crawl_per_day: Array<{ day: string; hits: number; pages: number }>;
};

export type PageviewsTimeseries = Array<{
  day: string;
  site_views: number;
  app_views: number;
  sessions: number;
}>;

export type EventBreakdown = {
  event_name: string;
  event_count: number;
  unique_sessions: number;
  unique_users: number;
};

export const adminApi = {
  isAdmin: () => rpc<boolean>("is_current_user_admin"),
  kpis: (periodDays = 30) => rpc<Kpis>("admin_get_kpis", { p_period_days: periodDays }),
  timeseries: (periodDays = 30) => rpc<Timeseries>("admin_get_timeseries", { p_period_days: periodDays }),
  users: (limit = 100, offset = 0, search: string | null = null) =>
    rpc<AdminUserRow[]>("admin_get_users", { p_limit: limit, p_offset: offset, p_search: search }),
  userDetail: (userId: string) => rpc<UserDetail>("admin_get_user_detail", { p_user_id: userId }),
  conversations: (limit = 100, offset = 0) =>
    rpc<AdminConversation[]>("admin_get_conversations", { p_limit: limit, p_offset: offset }),
  conversationMessages: (conversationId: string) =>
    rpc<AdminMessage[]>("admin_get_conversation_messages", { p_conversation_id: conversationId }),
  feedbacks: (limit = 100, guide: string | null = null, rating: number | null = null) =>
    rpc<AdminFeedback[]>("admin_get_feedbacks", { p_limit: limit, p_guide: guide, p_rating: rating }),
  creditTransactions: (limit = 100) =>
    rpc<AdminCreditTx[]>("admin_get_credit_transactions", { p_limit: limit }),
  stripeEvents: (limit = 100) => rpc<AdminStripeEvent[]>("admin_get_stripe_events", { p_limit: limit }),
  emailLog: (limit = 100) => rpc<AdminEmailLog[]>("admin_get_email_log", { p_limit: limit }),
  topReferrers: (limit = 20) => rpc<AdminReferrer[]>("admin_get_top_referrers", { p_limit: limit }),
  grantCredits: (userId: string, amount: number, description?: string) =>
    rpc<{ success: boolean; new_balance: number }>("admin_grant_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_description: description || "Crédits offerts par admin",
    }),
  toggleAdmin: (userId: string) => rpc<boolean>("admin_toggle_admin", { p_user_id: userId }),
  // Analytics
  liveVisitors: (windowMinutes = 5) => rpc<LiveVisitors>("admin_live_visitors", { p_window_minutes: windowMinutes }),
  topPages: (periodDays = 30, surface: string | null = null, limit = 30, excludeBots = false) =>
    rpc<TopPage[]>("admin_top_pages", { p_period_days: periodDays, p_surface: surface, p_limit: limit, p_exclude_bots: excludeBots }),
  trafficSources: (periodDays = 30, excludeBots = false) =>
    rpc<TrafficSources>("admin_traffic_sources", { p_period_days: periodDays, p_exclude_bots: excludeBots }),
  deviceBreakdown: (periodDays = 30, excludeBots = false) =>
    rpc<DeviceBreakdown>("admin_device_breakdown", { p_period_days: periodDays, p_exclude_bots: excludeBots }),
  recentJourneys: (limit = 20) => rpc<UserJourney[]>("admin_recent_journeys", { p_limit: limit }),
  pageviewsTimeseries: (periodDays = 30, excludeBots = false) =>
    rpc<PageviewsTimeseries>("admin_pageviews_timeseries", { p_period_days: periodDays, p_exclude_bots: excludeBots }),
  eventsBreakdown: (periodDays = 30) => rpc<EventBreakdown[]>("admin_events_breakdown", { p_period_days: periodDays }),
  botStats: (periodDays = 30) => rpc<BotStats>("admin_bot_stats", { p_period_days: periodDays }),
};

// Helpers
export const TIER_LABELS: Record<string, string> = {
  eveil: "Éveil",
  etoile: "Étoile",
  ame_soeur: "Âme Sœur",
  cosmos: "Cosmos",
};

export const TIER_COLORS: Record<string, string> = {
  eveil: "bg-slate-500/20 text-slate-200 border-slate-500/40",
  etoile: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  ame_soeur: "bg-rose-500/20 text-rose-200 border-rose-500/40",
  cosmos: "bg-purple-500/20 text-purple-200 border-purple-500/40",
};

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)}j`;
  return d.toLocaleDateString("fr-FR");
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
