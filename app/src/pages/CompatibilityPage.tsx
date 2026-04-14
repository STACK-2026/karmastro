import { motion } from "framer-motion";
import { Heart, Users, Briefcase, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { compatibilityProfiles } from "@/lib/demoData";
import BottomNav from "@/components/BottomNav";
import AppFooter from "@/components/AppFooter";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";
import { useT } from "@/i18n/ui";

const CompatibilityPage = () => {
  const navigate = useNavigate();
  const { t } = useT();

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title={t("compat.header_title")} showBack />

      <div className="relative z-10 px-5 space-y-5">
        <Button variant="outline" className="w-full border-primary text-primary">
          <UserPlus className="h-4 w-4 mr-2" /> {t("compat.add_person")}
        </Button>

        {compatibilityProfiles.map((profile) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-glow rounded-xl bg-card/60 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {profile.type === "amour" ? <Heart className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-karmique-blue" />}
                </div>
                <div>
                  <h3 className="font-medium">{profile.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ZodiacSymbol sign={profile.sunSign.sign} size={14} color="#D4A017" />
                    {profile.sunSign.sign} · CV {profile.lifePath}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <span className="text-2xl font-mono font-bold text-primary">{profile.scores.global}%</span>
                <p className="text-[10px] text-muted-foreground">{t("compat.score_global")}</p>
              </div>
            </div>

            {/* Score bars */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(profile.scores).filter(([k]) => k !== "global").map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="h-12 bg-secondary rounded-full relative overflow-hidden mx-auto w-3">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="absolute bottom-0 w-full bg-primary rounded-full"
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 block capitalize">{key}</span>
                </div>
              ))}
            </div>

            {/* Strengths & Frictions */}
            <details>
              <summary className="text-sm text-primary cursor-pointer mb-2">{t("compat.see_analysis")}</summary>
              <div className="space-y-3 mt-3">
                <div>
                  <p className="text-xs font-medium text-karmique-earth mb-1">{t("compat.strengths")}</p>
                  {profile.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground mb-1">• {s}</p>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-destructive mb-1">{t("compat.frictions")}</p>
                  {profile.frictions.map((f, i) => (
                    <p key={i} className="text-xs text-muted-foreground mb-1">• {f}</p>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-accent mb-1">{t("compat.karmic_guidance")}</p>
                  <p className="text-xs text-muted-foreground">{profile.karmicGuidance}</p>
                </div>
              </div>
            </details>
          </motion.div>
        ))}
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default CompatibilityPage;
