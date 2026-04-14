import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  Sparkles,
  Star,
  Zap,
  Moon,
  Calculator,
  MessageSquare,
  Gift,
  Mail,
  CreditCard,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Crown,
  Plus,
  ShieldCheck,
  LineChart,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  Eye,
  Smartphone,
  Globe,
  ArrowRight,
  Radio,
  Bot,
  User,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminApi,
  TIER_LABELS,
  TIER_COLORS,
  formatRelative,
  formatDateTime,
  type Kpis,
  type Timeseries,
  type AdminUserRow,
  type AdminConversation,
  type AdminMessage,
  type AdminFeedback,
  type AdminCreditTx,
  type AdminStripeEvent,
  type AdminEmailLog,
  type AdminReferrer,
  type UserDetail,
  type LiveVisitors,
  type TopPage,
  type TrafficSources,
  type DeviceBreakdown,
  type UserJourney,
  type PageviewsTimeseries,
  type EventBreakdown,
  type BotStats,
  type UserSession,
} from "@/lib/adminApi";
import { useT } from "@/i18n/ui";

const GUIDE_ICONS: Record<string, typeof Star> = {
  sibylle: Star,
  orion: Zap,
  selene: Moon,
  pythia: Calculator,
};

const GUIDE_COLORS: Record<string, string> = {
  sibylle: "text-purple-300",
  orion: "text-amber-300",
  selene: "text-blue-300",
  pythia: "text-emerald-300",
};

const PERIOD_OPTIONS = [
  { label: "24h", days: 1 },
  { label: "7j", days: 7 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
];

// ───────────────────────────────────────────────────────────────
// Shared components
// ───────────────────────────────────────────────────────────────

const KpiCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) => (
  <div className="p-4 rounded-xl bg-card/60 border border-border">
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <p className={`text-2xl font-serif ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const SectionCard = ({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="p-4 rounded-xl bg-card/60 border border-border">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const MiniBarChart = ({ data, color = "bg-primary" }: { data: { date: string; count: number }[]; color?: string }) => {
  if (!data.length) return <p className="text-xs text-muted-foreground">Aucune donnée.</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-20">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
          <div
            className={`w-full rounded-t ${color} opacity-70 hover:opacity-100 transition-opacity`}
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "2px" : "0" }}
          />
          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-popover border border-border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap">
            {d.count} · {new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Overview Tab
// ───────────────────────────────────────────────────────────────

const OverviewTab = ({ periodDays }: { periodDays: number }) => {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [series, setSeries] = useState<Timeseries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([adminApi.kpis(periodDays), adminApi.timeseries(periodDays)])
      .then(([k, s]) => {
        setKpis(k);
        setSeries(s);
      })
      .catch((e) => console.error("Overview load error:", e))
      .finally(() => setLoading(false));
  }, [periodDays]);

  if (loading) return <p className="text-xs text-muted-foreground text-center py-8">Chargement...</p>;
  if (!kpis) return <p className="text-xs text-muted-foreground text-center py-8">Erreur de chargement</p>;

  const tierBreakdown = kpis.tier_breakdown || {};
  const paidPct = kpis.total_users > 0 ? ((kpis.paid_users / kpis.total_users) * 100).toFixed(1) : "0";
  const mrrEuro = (tierBreakdown.etoile || 0) * 5.99 + (tierBreakdown.cosmos || 0) * 19.99;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Utilisateurs" value={kpis.total_users} sub={`+${kpis.new_users_period} cette période`} />
        <KpiCard
          icon={Crown}
          label="Abonnés payants"
          value={kpis.paid_users}
          sub={`${paidPct}% · ${mrrEuro.toFixed(0)}€ MRR`}
          color="text-amber-300"
        />
        <KpiCard
          icon={MessageSquare}
          label="Messages Oracle"
          value={kpis.total_messages}
          sub={`+${kpis.messages_period} cette période`}
        />
        <KpiCard
          icon={Sparkles}
          label="Note moyenne"
          value={kpis.total_feedbacks > 0 ? `${Number(kpis.avg_rating).toFixed(2)}/3` : "-"}
          sub={`${kpis.total_feedbacks} retours`}
        />
        <KpiCard icon={Gift} label="Parrainages" value={kpis.total_referrals} />
        <KpiCard
          icon={CreditCard}
          label="Crédits achetés"
          value={kpis.total_credits_purchased}
          sub={`${kpis.total_credits_consumed} consommés`}
        />
        <KpiCard
          icon={Mail}
          label="Emails envoyés"
          value={kpis.emails_sent_period}
          sub={`${kpis.emails_failed_period} échecs`}
        />
        <KpiCard icon={TrendingUp} label="Stripe events" value={kpis.stripe_events_period} sub="période" />
      </div>

      {Object.keys(tierBreakdown).length > 0 && (
        <SectionCard title="Répartition par voie">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(tierBreakdown).map(([tier, count]) => (
              <div key={tier} className={`p-3 rounded-lg border ${TIER_COLORS[tier] || "bg-card/40 border-border"}`}>
                <p className="text-xs font-medium">{TIER_LABELS[tier] || tier}</p>
                <p className="text-xl font-serif">{count}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Inscriptions / jour">
          <MiniBarChart data={series?.signups || []} color="bg-primary" />
        </SectionCard>
        <SectionCard title="Messages Oracle / jour">
          <MiniBarChart data={series?.messages || []} color="bg-amber-400" />
        </SectionCard>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Users Tab
// ───────────────────────────────────────────────────────────────

const UsersTab = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .users(200, 0, search || null)
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error("[admin] users error:", e);
        setError(e?.message || String(e));
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleExpand = async (userId: string) => {
    if (expanded === userId) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(userId);
    setDetail(null);
    setDetailError(null);
    setShowAllSessions(false);
    setDetailLoading(true);
    try {
      const d = await adminApi.userDetail(userId);
      setDetail(d);
    } catch (e: any) {
      console.error("[admin] userDetail error:", e);
      setDetailError(e?.message || String(e));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGrantCredits = async (userId: string) => {
    const amountStr = prompt("Combien de crédits offrir ?", "10");
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return;
    try {
      const res = await adminApi.grantCredits(userId, amount);
      alert(`Nouveau solde : ${res.new_balance} crédits`);
      load();
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    if (!confirm("Basculer le statut admin de cet utilisateur ?")) return;
    try {
      const newState = await adminApi.toggleAdmin(userId);
      alert(`Admin : ${newState ? "oui" : "non"}`);
      load();
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email, prénom, nom..."
            className="pl-9 bg-card/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground">{users.length} users</span>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-8">Chargement...</p>
      ) : error ? (
        <div className="text-center py-8 space-y-2">
          <AlertCircle className="h-5 w-5 text-red-400 mx-auto" />
          <p className="text-xs text-red-400">Erreur : {error}</p>
          <Button variant="outline" size="sm" onClick={load}>Réessayer</Button>
        </div>
      ) : users.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isExpanded = expanded === u.user_id;
            return (
              <div key={u.user_id} className="rounded-xl bg-card/60 border border-border overflow-hidden">
                <button
                  onClick={() => toggleExpand(u.user_id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-card/80 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                    {(u.first_name?.[0] || u.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{u.first_name || "-"} {u.last_name || ""}</p>
                      {u.is_admin && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-rose-500/20 border-rose-500/40 text-rose-200">
                          ADMIN
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-4 px-1 ${TIER_COLORS[u.subscription_tier || "eveil"] || ""}`}
                      >
                        {TIER_LABELS[u.subscription_tier || "eveil"] || "Éveil"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email || "-"}</p>
                  </div>
                  <div className="flex flex-col items-end text-[10px] text-muted-foreground flex-shrink-0 hidden sm:flex">
                    <span>{u.credits ?? 0} crédits</span>
                    <span>{u.conversations_count} conv · {u.messages_count} msg</span>
                    <span>{formatRelative(u.last_activity)}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-background/40 space-y-3 text-xs">
                    {detailError ? (
                      <div className="text-center py-2 space-y-1">
                        <p className="text-xs text-red-400">Erreur detail : {detailError}</p>
                        <Button variant="outline" size="sm" onClick={() => toggleExpand(u.user_id)}>Fermer</Button>
                      </div>
                    ) : detailLoading || !detail ? (
                      <p className="text-muted-foreground">Chargement du detail...</p>
                    ) : (() => {
                      const attr = detail.attribution;
                      const stats = detail.stats;
                      const sessions = detail.sessions || [];
                      const visibleSessions = showAllSessions ? sessions : sessions.slice(0, 3);
                      const profile = detail.profile as Record<string, any> | null;
                      const natal = profile?.natal_chart_json as Record<string, any> | null;
                      const formatDuration = (s: number) => {
                        if (s < 60) return `${s}s`;
                        if (s < 3600) return `${Math.floor(s / 60)}min ${s % 60}s`;
                        return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;
                      };
                      const providerLabel: Record<string, string> = { google: "Google", email: "Email/MDP", github: "GitHub" };
                      const sourceLabel = attr?.utm_source || attr?.referrer_domain || "Direct";

                      return (
                        <>
                          {/* Provenance + Stats */}
                          <div className="rounded-lg bg-background/60 border border-border p-3 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Globe className="h-3.5 w-3.5 text-primary" />
                              <span className="text-[11px] font-medium">Provenance et activite</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                              <div>
                                <span className="text-muted-foreground">Source : </span>
                                <span className="font-medium">{sourceLabel}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Auth : </span>
                                <span>{providerLabel[detail.auth_provider] || detail.auth_provider}</span>
                              </div>
                              {attr?.utm_campaign && (
                                <div>
                                  <span className="text-muted-foreground">Campagne : </span>
                                  <span>{attr.utm_campaign}</span>
                                </div>
                              )}
                              {attr?.landing_page && (
                                <div>
                                  <span className="text-muted-foreground">Landing : </span>
                                  <span className="truncate">{attr.landing_page}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">1ere visite : </span>
                                <span>{stats?.first_seen ? formatDateTime(stats.first_seen) : formatDateTime(u.created_at)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Derniere visite : </span>
                                <span>{stats?.last_seen ? formatRelative(stats.last_seen) : "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Sessions : </span>
                                <span className="font-medium">{stats?.total_sessions ?? 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pages vues : </span>
                                <span className="font-medium">{stats?.total_page_views ?? 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Temps cumule : </span>
                                <span className="font-medium">{formatDuration(stats?.estimated_time_seconds ?? 0)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Messages Oracle : </span>
                                <span className="font-medium">{stats?.total_oracle_messages ?? 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Conversations : </span>
                                <span>{stats?.total_conversations ?? 0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Profil perso + astro */}
                          <div className="rounded-lg bg-background/60 border border-border p-3 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3.5 w-3.5 text-primary" />
                              <span className="text-[11px] font-medium">Profil</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                              <div>
                                <span className="text-muted-foreground">Email : </span>
                                <span>{detail.email || "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Inscrit : </span>
                                <span>{formatDateTime(u.created_at)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Langue : </span>
                                <span>{u.language || "fr"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Naissance : </span>
                                <span>{u.birth_date ? new Date(u.birth_date).toLocaleDateString("fr-FR") : "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Lieu : </span>
                                <span>{u.birth_place || "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Genre : </span>
                                <span>{u.gender || "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Code parrain : </span>
                                <span className="font-mono">{u.referral_code || "-"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Filleuls : </span>
                                <span>{u.filleuls_count}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Abonnement : </span>
                                <span>{u.subscription_status || "-"}</span>
                              </div>
                              {profile?.interests && (profile.interests as string[]).length > 0 && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Interets : </span>
                                  <span>{(profile.interests as string[]).join(", ")}</span>
                                </div>
                              )}
                              {profile?.level && (
                                <div>
                                  <span className="text-muted-foreground">Niveau : </span>
                                  <span>{profile.level as string}</span>
                                </div>
                              )}
                              {profile?.oracle_tone && (
                                <div>
                                  <span className="text-muted-foreground">Profil Oracle : </span>
                                  <span className="capitalize">{profile.oracle_tone as string}</span>
                                </div>
                              )}
                            </div>
                            {natal && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <p className="text-muted-foreground text-[10px] mb-1">Theme natal :</p>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-0.5 text-[10px]">
                                  {natal.sun && <div><span className="text-amber-300">Soleil</span> {natal.sun}</div>}
                                  {natal.moon && <div><span className="text-blue-300">Lune</span> {natal.moon}</div>}
                                  {natal.ascendant && <div><span className="text-emerald-300">Asc</span> {natal.ascendant}</div>}
                                  {natal.mercury && <div><span className="text-muted-foreground">Mercure</span> {natal.mercury}</div>}
                                  {natal.venus && <div><span className="text-rose-300">Venus</span> {natal.venus}</div>}
                                  {natal.mars && <div><span className="text-red-400">Mars</span> {natal.mars}</div>}
                                  {natal.jupiter && <div><span className="text-purple-300">Jupiter</span> {natal.jupiter}</div>}
                                  {natal.saturn && <div><span className="text-slate-300">Saturne</span> {natal.saturn}</div>}
                                  {natal.north_node && <div><span className="text-primary">Noeud N</span> {natal.north_node}</div>}
                                </div>
                              </div>
                            )}
                            {u.badges && u.badges.length > 0 && (
                              <div>
                                <p className="text-muted-foreground mb-1">Badges :</p>
                                <div className="flex flex-wrap gap-1">
                                  {u.badges.map((b) => (
                                    <Badge key={b} variant="outline" className="text-[9px] h-4 px-1">{b}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Sessions */}
                          {sessions.length > 0 && (
                            <div className="rounded-lg bg-background/60 border border-border p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-[11px] font-medium">Sessions ({sessions.length})</span>
                                </div>
                                {sessions.length > 3 && (
                                  <button
                                    onClick={() => setShowAllSessions(!showAllSessions)}
                                    className="text-[10px] text-primary hover:underline"
                                  >
                                    {showAllSessions ? "Voir moins" : `Voir les ${sessions.length}`}
                                  </button>
                                )}
                              </div>
                              <div className="space-y-1.5">
                                {visibleSessions.map((sess: UserSession) => (
                                  <div key={sess.session_id} className="bg-background/40 rounded-lg px-2.5 py-1.5 text-[10px]">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium">{sess.device}</span>
                                        {sess.country_code && <span className="text-muted-foreground">{sess.country_code}</span>}
                                        <span className="text-muted-foreground">{sess.surface}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <span>{sess.page_count} pages</span>
                                        <span>{formatDuration(sess.duration_seconds)}</span>
                                        <span>{formatDateTime(sess.started_at)}</span>
                                      </div>
                                    </div>
                                    {sess.referrer_domain && (
                                      <div className="text-muted-foreground mt-0.5">
                                        via {sess.referrer_domain}
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {sess.pages.map((p, i) => (
                                        <span key={i} className="bg-card/80 px-1.5 py-0.5 rounded text-[9px]">
                                          {p.path}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Conversations Oracle */}
                          {detail.conversations.length > 0 && (
                            <div>
                              <p className="text-muted-foreground mb-1">Conversations Oracle ({detail.conversations.length}) :</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {detail.conversations.slice(0, 10).map((c) => (
                                  <div key={c.id} className="flex items-center justify-between text-[10px] bg-background/40 rounded px-2 py-1">
                                    <span className="truncate flex-1">{c.title || "Sans titre"}</span>
                                    <span className="text-muted-foreground ml-2">{c.message_count} msg · {formatRelative(c.updated_at)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Credits */}
                          {detail.credit_transactions.length > 0 && (
                            <div>
                              <p className="text-muted-foreground mb-1">Historique credits ({detail.credit_transactions.length}) :</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {detail.credit_transactions.slice(0, 10).map((t) => (
                                  <div key={t.id} className="flex items-center justify-between text-[10px] bg-background/40 rounded px-2 py-1">
                                    <span>{t.type} · {t.description || "-"}</span>
                                    <span className={t.amount > 0 ? "text-emerald-300" : "text-rose-300"}>
                                      {t.amount > 0 ? "+" : ""}{t.amount}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Feedbacks */}
                          {detail.feedbacks.length > 0 && (
                            <div>
                              <p className="text-muted-foreground mb-1">Feedbacks ({detail.feedbacks.length}) :</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {detail.feedbacks.map((fb) => (
                                  <div key={fb.id} className="text-[10px] bg-background/40 rounded px-2 py-1">
                                    <span className="text-amber-300">{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</span>
                                    <span className="text-muted-foreground ml-1">{fb.guide}</span>
                                    {fb.text && <p className="mt-0.5">{fb.text}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={() => handleGrantCredits(u.user_id)}>
                              <Plus className="h-3 w-3 mr-1" /> Credits
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleToggleAdmin(u.user_id)}>
                              <ShieldCheck className="h-3 w-3 mr-1" /> Toggle admin
                            </Button>
                            <code className="ml-auto text-[9px] text-muted-foreground self-center">{u.user_id}</code>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Oracle Tab (conversations + messages drill-down + feedbacks)
// ───────────────────────────────────────────────────────────────

const OracleTab = () => {
  const [convos, setConvos] = useState<AdminConversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [filterGuide, setFilterGuide] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.conversations(100),
      adminApi.feedbacks(100, filterGuide === "all" ? null : filterGuide, filterRating),
    ])
      .then(([c, f]) => {
        setConvos(c);
        setFeedbacks(f);
      })
      .finally(() => setLoading(false));
  }, [filterGuide, filterRating]);

  const openConvo = async (id: string) => {
    if (selectedConvo === id) {
      setSelectedConvo(null);
      setMessages([]);
      return;
    }
    setSelectedConvo(id);
    const m = await adminApi.conversationMessages(id);
    setMessages(m);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title={`Conversations (${convos.length})`}>
          {loading ? (
            <p className="text-xs text-muted-foreground">Chargement...</p>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {convos.map((c) => (
                <div key={c.id}>
                  <button
                    onClick={() => openConvo(c.id)}
                    className="w-full text-left p-2 rounded-lg bg-background/40 hover:bg-background/60 border border-border/30"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs truncate flex-1">{c.title || "Sans titre"}</p>
                      <span className="text-[9px] text-muted-foreground">{c.message_count} msg</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {c.user_first_name || c.user_email || "anonyme"} · {formatRelative(c.updated_at)}
                    </p>
                  </button>
                  {selectedConvo === c.id && messages.length > 0 && (
                    <div className="mt-1 ml-2 space-y-1 border-l-2 border-primary/30 pl-2">
                      {messages.map((m) => (
                        <div key={m.id} className="text-[10px]">
                          <span className={`font-medium ${m.role === "user" ? "text-primary" : "text-amber-300"}`}>
                            {m.role === "user" ? "👤 " : "✨ "}
                          </span>
                          <span className="text-muted-foreground">{m.content.slice(0, 200)}{m.content.length > 200 ? "..." : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={`Feedbacks Oracle (${feedbacks.length})`}>
          <div className="flex flex-wrap gap-1 mb-2">
            <button
              onClick={() => setFilterGuide("all")}
              className={`text-[9px] px-2 py-0.5 rounded-full border ${filterGuide === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              Tous
            </button>
            {["sibylle", "orion", "selene", "pythia"].map((g) => (
              <button
                key={g}
                onClick={() => setFilterGuide(g)}
                className={`text-[9px] px-2 py-0.5 rounded-full border capitalize ${filterGuide === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {g}
              </button>
            ))}
            <div className="w-full h-0" />
            <button
              onClick={() => setFilterRating(null)}
              className={`text-[9px] px-2 py-0.5 rounded-full border ${filterRating === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              Tous ratings
            </button>
            {[3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`text-[9px] px-2 py-0.5 rounded-full border ${filterRating === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {r === 3 ? "✨ 3" : r === 2 ? "⭐ 2" : "🌑 1"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {feedbacks.map((f) => {
              const Icon = GUIDE_ICONS[f.guide] || Star;
              const color = GUIDE_COLORS[f.guide] || "text-foreground";
              const emoji = f.rating === 3 ? "✨" : f.rating === 2 ? "⭐" : "🌑";
              return (
                <div key={f.id} className="p-2 rounded-lg bg-background/40 border border-border/30">
                  <div className="flex items-center gap-1 text-[10px] mb-0.5">
                    <Icon className={`h-2.5 w-2.5 ${color}`} />
                    <span className="font-medium capitalize">{f.guide}</span>
                    <span>{emoji}</span>
                    <span className="text-muted-foreground ml-auto truncate">{f.user_email || "anon"}</span>
                  </div>
                  {f.user_message && <p className="text-[10px] text-muted-foreground/80 line-clamp-1">Q: {f.user_message}</p>}
                  {f.text && <p className="text-[10px] mt-1 bg-primary/5 rounded px-1.5 py-1">{f.text}</p>}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Monetization Tab
// ───────────────────────────────────────────────────────────────

const MonetizationTab = () => {
  const [credits, setCredits] = useState<AdminCreditTx[]>([]);
  const [events, setEvents] = useState<AdminStripeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.creditTransactions(50), adminApi.stripeEvents(50)])
      .then(([c, e]) => {
        setCredits(c);
        setEvents(e);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-8">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard title={`Transactions crédits (${credits.length})`}>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {credits.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune transaction.</p>
              ) : (
                credits.map((t) => (
                  <div key={t.id} className="p-2 rounded bg-background/40 border border-border/30 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">{t.user_email || "-"}</span>
                      <span className={t.amount > 0 ? "text-emerald-300" : "text-rose-300"}>
                        {t.amount > 0 ? "+" : ""}{t.amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>{t.type} · {t.description || "-"}</span>
                      <span>{formatRelative(t.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title={`Stripe events (${events.length})`}>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun event.</p>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="p-2 rounded bg-background/40 border border-border/30 text-[11px]">
                    <div className="flex items-center gap-1">
                      {e.processed ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                      ) : e.error ? (
                        <XCircle className="h-3 w-3 text-rose-300" />
                      ) : (
                        <Clock className="h-3 w-3 text-amber-300" />
                      )}
                      <span className="font-mono">{e.type}</span>
                      <span className="ml-auto text-[9px] text-muted-foreground">{formatRelative(e.created_at)}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground truncate">{e.user_email || "-"}</p>
                    {e.error && <p className="text-[9px] text-rose-300 line-clamp-1">{e.error}</p>}
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Emails Tab
// ───────────────────────────────────────────────────────────────

const EmailsTab = () => {
  const [logs, setLogs] = useState<AdminEmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .emailLog(200)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-8">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={Mail} label="Total logs" value={logs.length} />
            <KpiCard icon={CheckCircle2} label="Envoyés" value={statusCounts.sent || 0} color="text-emerald-300" />
            <KpiCard icon={XCircle} label="Échecs" value={statusCounts.failed || 0} color="text-rose-300" />
            <KpiCard icon={AlertCircle} label="Sans clé" value={statusCounts.skipped_no_key || 0} color="text-amber-300" />
          </div>

          <SectionCard title="Répartition par type">
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeCounts).map(([type, cnt]) => (
                <div key={type} className="px-3 py-1 rounded-full bg-card/40 border border-border text-[11px]">
                  {type} <span className="text-muted-foreground">· {cnt}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={`Logs détaillés (${logs.length})`}>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="p-2 rounded bg-background/40 border border-border/30 text-[11px]">
                  <div className="flex items-center gap-2">
                    {l.status === "sent" ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-300 flex-shrink-0" />
                    ) : l.status === "failed" ? (
                      <XCircle className="h-3 w-3 text-rose-300 flex-shrink-0" />
                    ) : (
                      <Clock className="h-3 w-3 text-amber-300 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{l.recipient}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      {l.type}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">{formatRelative(l.created_at)}</span>
                  </div>
                  {l.subject && <p className="text-[10px] text-muted-foreground truncate ml-5">{l.subject}</p>}
                  {l.error && <p className="text-[10px] text-rose-300 ml-5 line-clamp-1">{l.error}</p>}
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Referrals Tab
// ───────────────────────────────────────────────────────────────

const ReferralsTab = () => {
  const [top, setTop] = useState<AdminReferrer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .topReferrers(50)
      .then(setTop)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-8">Chargement...</p>
      ) : (
        <SectionCard title={`Top parrains (${top.length})`}>
          {top.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun parrainage pour le moment.</p>
          ) : (
            <div className="space-y-1.5">
              {top.map((r, i) => (
                <div key={r.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-background/40 border border-border/30">
                  <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-300">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{r.first_name || "-"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.email || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-serif text-primary">{r.filleuls_count}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{r.referral_code}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Analytics Tab - live visitors, top pages, devices, journeys, channels
// ───────────────────────────────────────────────────────────────

const AnalyticsTab = ({ periodDays }: { periodDays: number }) => {
  const [live, setLive] = useState<LiveVisitors | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [sources, setSources] = useState<TrafficSources | null>(null);
  const [devices, setDevices] = useState<DeviceBreakdown | null>(null);
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [ts, setTs] = useState<PageviewsTimeseries>([]);
  const [events, setEvents] = useState<EventBreakdown[]>([]);
  const [botStatsData, setBotStatsData] = useState<BotStats | null>(null);
  const [surfaceFilter, setSurfaceFilter] = useState<string | null>(null);
  const [excludeBots, setExcludeBots] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.liveVisitors(5),
      adminApi.topPages(periodDays, surfaceFilter, 30, excludeBots),
      adminApi.trafficSources(periodDays, excludeBots),
      adminApi.deviceBreakdown(periodDays, excludeBots),
      adminApi.recentJourneys(20),
      adminApi.pageviewsTimeseries(periodDays, excludeBots),
      adminApi.eventsBreakdown(periodDays),
      adminApi.botStats(periodDays),
    ])
      .then(([l, p, s, d, j, t, e, b]) => {
        setLive(l);
        setTopPages(p);
        setSources(s);
        setDevices(d);
        setJourneys(j);
        setTs(t);
        setEvents(e);
        setBotStatsData(b);
      })
      .catch((e) => console.error("Analytics load error:", e))
      .finally(() => setLoading(false));
  }, [periodDays, surfaceFilter, excludeBots]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh live visitors every 15s
  useEffect(() => {
    const i = setInterval(() => {
      adminApi.liveVisitors(5).then(setLive).catch(() => {});
    }, 15000);
    return () => clearInterval(i);
  }, []);

  if (loading && !live) {
    return <p className="text-xs text-muted-foreground text-center py-8">Chargement analytics...</p>;
  }

  const liveCount = live?.total || 0;
  const totalSiteViews = ts.reduce((a, t) => a + (t.site_views || 0), 0);
  const totalAppViews = ts.reduce((a, t) => a + (t.app_views || 0), 0);
  const totalSessions = ts.reduce((a, t) => a + (t.sessions || 0), 0);

  return (
    <div className="space-y-4">
      {/* Bot filter toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExcludeBots(!excludeBots)}
          className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
            excludeBots
              ? "border-primary bg-primary/10 text-primary"
              : "border-orange-500/40 bg-orange-500/10 text-orange-300"
          }`}
        >
          {excludeBots ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          {excludeBots ? "Humains uniquement" : "Bots inclus"}
        </button>
        {live && (
          <span className="text-[10px] text-muted-foreground">
            {live.total_humans} humain{live.total_humans !== 1 ? "s" : ""} · {live.total_bots} bot{live.total_bots !== 1 ? "s" : ""} live
          </span>
        )}
      </div>

      {/* Live + summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-300">LIVE</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-200 mb-1">
            <Radio className="h-3.5 w-3.5" /> Visiteurs live
          </div>
          <p className="text-3xl font-serif text-emerald-300">{liveCount}</p>
          <p className="text-[10px] text-emerald-200/60">
            {live ? `${live.total_humans} humain${live.total_humans !== 1 ? "s" : ""} · ${live.total_bots} bot${live.total_bots !== 1 ? "s" : ""}` : "5 dernières min"}
          </p>
        </div>
        <KpiCard icon={Globe} label={`Vues site (${periodDays}j)`} value={totalSiteViews} />
        <KpiCard icon={Smartphone} label={`Vues app (${periodDays}j)`} value={totalAppViews} />
        <KpiCard icon={Eye} label="Sessions totales" value={totalSessions} />
      </div>

      {/* Live sessions list */}
      {live && live.sessions.length > 0 && (
        <SectionCard
          title={`Sessions en cours (${live.total})`}
          action={<span className="text-[10px] text-emerald-300 animate-pulse">● LIVE</span>}
        >
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {live.sessions.slice(0, 15).map((s) => (
              <div
                key={s.session_id}
                className={`flex items-center gap-2 p-2 rounded border text-[11px] ${
                  s.is_bot
                    ? "bg-orange-500/5 border-orange-500/20"
                    : "bg-background/40 border-border/30"
                }`}
              >
                <Radio className={`h-3 w-3 animate-pulse flex-shrink-0 ${s.is_bot ? "text-orange-400" : "text-emerald-400"}`} />
                {s.is_bot ? (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 bg-orange-500/20 border-orange-500/40 text-orange-300">
                    bot
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
                    humain
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {s.surface}
                </Badge>
                <span className="truncate flex-1 font-mono">{s.last_path}</span>
                <span className="text-muted-foreground">{s.page_count} pg</span>
                <span className="text-muted-foreground whitespace-nowrap">{formatRelative(s.last_seen)}</span>
                {s.user_id && <UserCheck className="h-3 w-3 text-primary" />}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Timeseries pageviews */}
      <SectionCard title={`Pages vues / jour (${periodDays}j)`}>
        <div className="flex items-end gap-0.5 h-24">
          {ts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune donnée. Le tracker commence à logger dès la prochaine visite.</p>
          ) : (
            ts.map((t) => {
              const max = Math.max(...ts.map((x) => x.site_views + x.app_views), 1);
              const total = t.site_views + t.app_views;
              const sitePct = total ? (t.site_views / max) * 100 : 0;
              const appPct = total ? (t.app_views / max) * 100 : 0;
              return (
                <div key={t.day} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div className="w-full flex flex-col">
                    <div className="bg-amber-400 opacity-70" style={{ height: `${appPct}%` }} />
                    <div className="bg-primary opacity-70" style={{ height: `${sitePct}%` }} />
                  </div>
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-popover border border-border rounded px-2 py-1 text-[9px] whitespace-nowrap">
                    <div>{new Date(t.day).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</div>
                    <div className="text-primary">site: {t.site_views}</div>
                    <div className="text-amber-400">app: {t.app_views}</div>
                    <div className="text-muted-foreground">{t.sessions} sess</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex gap-4 mt-2 text-[10px]">
          <div className="flex items-center gap-1"><div className="h-2 w-2 bg-primary rounded" /> Site</div>
          <div className="flex items-center gap-1"><div className="h-2 w-2 bg-amber-400 rounded" /> App</div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top pages */}
        <SectionCard
          title="Pages les plus visitées"
          action={
            <div className="flex gap-1">
              {["all", "site", "app"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSurfaceFilter(s === "all" ? null : s)}
                  className={`text-[9px] px-2 py-0.5 rounded border ${
                    (s === "all" && !surfaceFilter) || s === surfaceFilter
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          }
        >
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {topPages.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune vue.</p>
            ) : (
              topPages.map((p, i) => (
                <div
                  key={`${p.surface}-${p.path}-${i}`}
                  className="flex items-center gap-2 p-2 rounded bg-background/40 border border-border/30 text-[11px]"
                >
                  <span className="text-muted-foreground w-5 text-right">{i + 1}</span>
                  <Badge variant="outline" className="text-[8px] h-4 px-1">
                    {p.surface}
                  </Badge>
                  <span className="truncate flex-1 font-mono">{p.path}</span>
                  <span className="text-primary font-medium">{p.views}</span>
                  <span className="text-[9px] text-muted-foreground">{p.unique_sessions} uniq</span>
                  {p.avg_time_ms && (
                    <span className="text-[9px] text-muted-foreground">{Math.round(p.avg_time_ms / 1000)}s</span>
                  )}
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Devices / OS / Browsers / Locales */}
        <SectionCard title="Devices & OS">
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-muted-foreground mb-1">Appareils</p>
              {devices && Object.entries(devices.devices || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="capitalize">{k}</span>
                  <span className="text-primary">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-muted-foreground mb-1">OS</p>
              {devices && Object.entries(devices.os || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-primary">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Navigateurs</p>
              {devices && Object.entries(devices.browsers || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-primary">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Langues</p>
              {devices && Object.entries(devices.locales || {}).slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-primary">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Traffic sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Canaux d'acquisition">
          <div className="space-y-1 text-[11px]">
            {sources && Object.entries(sources.channels || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-border/30">
                <span className="capitalize">{k}</span>
                <span className="text-primary font-medium">{v}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Sources UTM">
          <div className="space-y-1 max-h-[300px] overflow-y-auto text-[11px]">
            {sources && sources.sources.map((s) => (
              <div key={s.name} className="flex justify-between py-1 border-b border-border/30">
                <span className="truncate">{s.name}</span>
                <span className="text-primary">{s.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Top referrers">
          <div className="space-y-1 max-h-[300px] overflow-y-auto text-[11px]">
            {sources && sources.referrers.length === 0 ? (
              <p className="text-muted-foreground">Aucun referrer.</p>
            ) : (
              sources && sources.referrers.map((r) => (
                <div key={r.name} className="flex justify-between py-1 border-b border-border/30">
                  <span className="truncate font-mono text-[10px]">{r.name}</span>
                  <span className="text-primary">{r.count}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent user journeys */}
      <SectionCard title={`Parcours utilisateurs récents (${journeys.length})`}>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {journeys.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun parcours pour le moment.</p>
          ) : (
            journeys.map((j) => (
              <div key={j.session_id} className={`p-2 rounded border text-[11px] ${
                j.is_bot ? "bg-orange-500/5 border-orange-500/20" : "bg-background/40 border-border/30"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {j.is_bot ? (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-orange-500/20 border-orange-500/40 text-orange-300">
                      bot
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
                      humain
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[9px] h-4 px-1">
                    {j.surface}
                  </Badge>
                  {j.user_id ? (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-primary/20 border-primary/40">
                      logged
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      anon
                    </Badge>
                  )}
                  <span className="text-muted-foreground text-[10px]">
                    {j.page_count} pages · {Math.round(j.duration_seconds / 60)}min
                  </span>
                  {j.referrer_domain && (
                    <span className="text-muted-foreground text-[10px] ml-auto truncate">← {j.referrer_domain}</span>
                  )}
                  {j.utm_source && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      {j.utm_source}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-wrap text-[10px] text-muted-foreground">
                  {j.pages.slice(0, 10).map((p, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="font-mono bg-background/60 px-1 rounded">{p.path}</span>
                      {i < Math.min(j.pages.length - 1, 9) && <ArrowRight className="h-2.5 w-2.5" />}
                    </span>
                  ))}
                  {j.pages.length > 10 && <span>... +{j.pages.length - 10}</span>}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  {formatDateTime(j.first_seen)} → {formatDateTime(j.last_seen)}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      {/* Custom events */}
      {events.length > 0 && (
        <SectionCard title="Events custom">
          <div className="space-y-1 text-[11px]">
            {events.map((e) => (
              <div key={e.event_name} className="flex items-center gap-2 py-1 border-b border-border/30">
                <Activity className="h-3 w-3 text-primary" />
                <span className="flex-1 font-mono">{e.event_name}</span>
                <span className="text-primary">{e.event_count}</span>
                <span className="text-[9px] text-muted-foreground">{e.unique_sessions} sess · {e.unique_users} users</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Bot crawl stats */}
      {botStatsData && botStatsData.total_bot_hits > 0 && (
        <SectionCard
          title="Crawl bots"
          action={
            <span className="text-[10px] text-orange-300">
              {botStatsData.total_bot_hits} hits · {botStatsData.unique_pages_crawled} pages · {botStatsData.crawl_window_hours}h de crawl
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By bot breakdown */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">Par bot</p>
              <div className="space-y-1">
                {botStatsData.by_bot?.map((b) => (
                  <div key={b.name} className="flex items-center gap-2 p-1.5 rounded bg-orange-500/5 border border-orange-500/10 text-[11px]">
                    <Bot className="h-3 w-3 text-orange-400 flex-shrink-0" />
                    <span className="flex-1 font-medium">{b.name}</span>
                    <span className="text-orange-300">{b.hits}</span>
                    <span className="text-[9px] text-muted-foreground">{b.sessions} sess</span>
                    <span className="text-[9px] text-muted-foreground">{b.unique_pages} pg</span>
                  </div>
                ))}
              </div>
              {botStatsData.first_crawl && (
                <p className="text-[9px] text-muted-foreground mt-2">
                  Premier crawl : {formatDateTime(botStatsData.first_crawl)} · Dernier : {formatDateTime(botStatsData.last_crawl)}
                </p>
              )}
            </div>
            {/* Crawl per day chart */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">Crawl / jour</p>
              <div className="flex items-end gap-0.5 h-20">
                {botStatsData.crawl_per_day?.map((d) => {
                  const max = Math.max(...(botStatsData.crawl_per_day?.map((x) => x.hits) || [1]), 1);
                  const pct = (d.hits / max) * 100;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end group relative">
                      <div className="w-full bg-orange-400 opacity-60 rounded-t" style={{ height: `${pct}%` }} />
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-popover border border-border rounded px-2 py-1 text-[9px] whitespace-nowrap">
                        <div>{new Date(d.day).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</div>
                        <div className="text-orange-300">{d.hits} hits</div>
                        <div className="text-muted-foreground">{d.pages} pages</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Main Admin Page
// ───────────────────────────────────────────────────────────────

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [periodDays, setPeriodDays] = useState(30);
  const { t } = useT();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    adminApi
      .isAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, [user, authLoading, navigate]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <StarField />
        <p className="relative z-10 text-sm text-muted-foreground">{t("admin.loading")}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
        <StarField />
        <div className="relative z-10 text-center px-6">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl mb-2">{t("admin.restricted_title")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("admin.restricted_desc")}</p>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-primary hover:underline">
            {t("admin.restricted_back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Admin" subtitle="Tableau de bord complet" showBack />

      <div className="relative z-10 px-4 md:px-6 space-y-4">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <TabsList className="bg-card/60 border border-border flex-wrap h-auto">
              <TabsTrigger value="overview" className="text-xs">
                <LineChart className="h-3 w-3 mr-1" /> Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs">
                <Activity className="h-3 w-3 mr-1" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs">
                <Users className="h-3 w-3 mr-1" /> Users
              </TabsTrigger>
              <TabsTrigger value="oracle" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Oracle
              </TabsTrigger>
              <TabsTrigger value="money" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" /> Monétisation
              </TabsTrigger>
              <TabsTrigger value="emails" className="text-xs">
                <Mail className="h-3 w-3 mr-1" /> Emails
              </TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs">
                <Gift className="h-3 w-3 mr-1" /> Parrainages
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPeriodDays(p.days)}
                  className={`text-[10px] px-2 py-1 rounded-full border ${
                    periodDays === p.days
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab periodDays={periodDays} />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <AnalyticsTab periodDays={periodDays} />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="oracle" className="mt-4">
            <OracleTab />
          </TabsContent>
          <TabsContent value="money" className="mt-4">
            <MonetizationTab />
          </TabsContent>
          <TabsContent value="emails" className="mt-4">
            <EmailsTab />
          </TabsContent>
          <TabsContent value="referrals" className="mt-4">
            <ReferralsTab />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminPage;
