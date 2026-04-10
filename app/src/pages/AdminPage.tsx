import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, MessageSquare, Users, Gift, Sparkles, Star, Zap, Moon, Calculator } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type FeedbackRow = {
  id: string;
  guide: string;
  rating: number;
  text: string | null;
  user_message: string | null;
  assistant_message: string | null;
  created_at: string;
};

type Stats = {
  totalUsers: number;
  totalFeedbacks: number;
  avgRating: number;
  totalReferrals: number;
  feedbacksByGuide: Record<string, { count: number; avg: number }>;
};

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

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [filterGuide, setFilterGuide] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Check admin status
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (supabase as any)
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setIsAdmin(Boolean(data?.is_admin));
      });
  }, [user, loading, navigate]);

  // Load data if admin
  useEffect(() => {
    if (!isAdmin) return;

    const loadData = async () => {
      setDataLoading(true);

      // Total users
      const { count: totalUsers } = await (supabase as any)
        .from("profiles")
        .select("id", { count: "exact", head: true });

      // Feedbacks
      const { data: fbData } = await (supabase as any)
        .from("oracle_feedback")
        .select("id, guide, rating, text, user_message, assistant_message, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      const fbs: FeedbackRow[] = fbData || [];
      setFeedbacks(fbs);

      // Total referrals (profiles with referred_by_user_id)
      const { count: totalReferrals } = await (supabase as any)
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .not("referred_by_user_id", "is", null);

      // Compute stats from feedbacks
      const totalFeedbacks = fbs.length;
      const avgRating = totalFeedbacks > 0
        ? fbs.reduce((a, b) => a + b.rating, 0) / totalFeedbacks
        : 0;

      const byGuide: Record<string, { count: number; sum: number }> = {};
      for (const f of fbs) {
        if (!byGuide[f.guide]) byGuide[f.guide] = { count: 0, sum: 0 };
        byGuide[f.guide].count++;
        byGuide[f.guide].sum += f.rating;
      }
      const feedbacksByGuide: Record<string, { count: number; avg: number }> = {};
      for (const [g, v] of Object.entries(byGuide)) {
        feedbacksByGuide[g] = { count: v.count, avg: v.sum / v.count };
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalFeedbacks,
        avgRating,
        totalReferrals: totalReferrals || 0,
        feedbacksByGuide,
      });
      setDataLoading(false);
    };

    loadData();
  }, [isAdmin]);

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterGuide !== "all" && f.guide !== filterGuide) return false;
    if (filterRating !== null && f.rating !== filterRating) return false;
    return true;
  });

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <StarField />
        <p className="relative z-10 text-sm text-muted-foreground">Vérification des accès cosmiques...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
        <StarField />
        <div className="relative z-10 text-center px-6">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl mb-2">Accès restreint</h2>
          <p className="text-sm text-muted-foreground mb-6">Cette zone est réservée à l'équipe Karmastro.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-primary hover:underline"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Admin" subtitle="Tableau de bord" showBack />

      <div className="relative z-10 px-5 space-y-4">
        {/* Stats globales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/60 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3 w-3" /> Utilisateurs
            </div>
            <p className="text-2xl font-serif text-primary">{stats?.totalUsers ?? "—"}</p>
          </div>
          <div className="p-4 rounded-xl bg-card/60 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Gift className="h-3 w-3" /> Parrainages
            </div>
            <p className="text-2xl font-serif text-primary">{stats?.totalReferrals ?? "—"}</p>
          </div>
          <div className="p-4 rounded-xl bg-card/60 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MessageSquare className="h-3 w-3" /> Feedbacks Oracle
            </div>
            <p className="text-2xl font-serif text-primary">{stats?.totalFeedbacks ?? "—"}</p>
          </div>
          <div className="p-4 rounded-xl bg-card/60 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Sparkles className="h-3 w-3" /> Note moyenne
            </div>
            <p className="text-2xl font-serif text-primary">
              {stats && stats.totalFeedbacks > 0 ? `${stats.avgRating.toFixed(2)}/3` : "—"}
            </p>
          </div>
        </div>

        {/* Stats par guide */}
        {stats && Object.keys(stats.feedbacksByGuide).length > 0 && (
          <div className="p-4 rounded-xl bg-card/60 border border-border">
            <h3 className="text-sm font-medium mb-3">Performance par guide</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.feedbacksByGuide).map(([guide, data]) => {
                const Icon = GUIDE_ICONS[guide] || Star;
                const color = GUIDE_COLORS[guide] || "text-foreground";
                return (
                  <div key={guide} className="flex items-center gap-2 p-2 rounded-lg bg-background/40">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium capitalize">{guide}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {data.avg.toFixed(2)}/3 · {data.count} retour{data.count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtres feedbacks */}
        <div className="p-4 rounded-xl bg-card/60 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Derniers feedbacks</h3>
            <span className="text-xs text-muted-foreground">{filteredFeedbacks.length} affichés</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setFilterGuide("all")}
              className={`text-[10px] px-2 py-1 rounded-full border ${filterGuide === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              Tous guides
            </button>
            {["sibylle", "orion", "selene", "pythia"].map((g) => (
              <button
                key={g}
                onClick={() => setFilterGuide(g)}
                className={`text-[10px] px-2 py-1 rounded-full border capitalize ${filterGuide === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {g}
              </button>
            ))}
            <div className="w-full h-0" />
            <button
              onClick={() => setFilterRating(null)}
              className={`text-[10px] px-2 py-1 rounded-full border ${filterRating === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              Tous ratings
            </button>
            {[3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`text-[10px] px-2 py-1 rounded-full border ${filterRating === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {r === 3 ? "✨ 3" : r === 2 ? "⭐ 2" : "🌑 1"}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {dataLoading && <p className="text-xs text-muted-foreground text-center py-4">Chargement...</p>}
            {!dataLoading && filteredFeedbacks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun feedback ne correspond à ces filtres.</p>
            )}
            {filteredFeedbacks.map((f) => {
              const Icon = GUIDE_ICONS[f.guide] || Star;
              const color = GUIDE_COLORS[f.guide] || "text-foreground";
              const ratingEmoji = f.rating === 3 ? "✨" : f.rating === 2 ? "⭐" : "🌑";
              return (
                <div key={f.id} className="p-3 rounded-lg bg-background/40 border border-border/50">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <Icon className={`h-3 w-3 ${color}`} />
                    <span className="font-medium capitalize">{f.guide}</span>
                    <span>{ratingEmoji}</span>
                    <span className="text-muted-foreground ml-auto">{new Date(f.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                  {f.user_message && (
                    <p className="text-[11px] text-muted-foreground/80 mb-1 line-clamp-2">
                      <span className="text-muted-foreground/50">Q : </span>{f.user_message}
                    </p>
                  )}
                  {f.text && (
                    <p className="text-xs text-foreground bg-primary/5 border border-primary/10 rounded px-2 py-1.5 mt-1">
                      {f.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminPage;
