import { BookOpen, Star, Hash, Moon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppFooter from "@/components/AppFooter";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { useT } from "@/i18n/ui";

const LearnPage = () => {
  const navigate = useNavigate();
  const { t } = useT();

  const guides = [
    { icon: Star, title: t("learn.guide_zodiac_title"), desc: t("learn.guide_zodiac_desc"), count: t("learn.count_articles", { n: 12 }) },
    { icon: Hash, title: t("learn.guide_lifepaths_title"), desc: t("learn.guide_lifepaths_desc"), count: t("learn.count_articles", { n: 9 }) },
    { icon: Moon, title: t("learn.guide_planets_title"), desc: t("learn.guide_planets_desc"), count: t("learn.count_articles", { n: 10 }) },
    { icon: Star, title: t("learn.guide_houses_title"), desc: t("learn.guide_houses_desc"), count: t("learn.count_articles", { n: 12 }) },
    { icon: Sparkles, title: t("learn.guide_karma_title"), desc: t("learn.guide_karma_desc"), count: t("learn.count_articles", { n: 4 }) },
    { icon: Moon, title: t("learn.guide_moon_title"), desc: t("learn.guide_moon_desc"), count: t("learn.count_articles", { n: 20 }) },
    { icon: Hash, title: t("learn.guide_numerology_title"), desc: t("learn.guide_numerology_desc"), count: t("learn.count_guide") },
    { icon: Star, title: t("learn.guide_transits_title"), desc: t("learn.guide_transits_desc"), count: t("learn.count_guide") },
    { icon: Moon, title: t("learn.guide_aspects_title"), desc: t("learn.guide_aspects_desc"), count: t("learn.count_guide") },
    { icon: Sparkles, title: t("learn.guide_compat_title"), desc: t("learn.guide_compat_desc"), count: t("learn.count_guide") },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title={t("learn.header_title")} showBack />

      <div className="relative z-10 px-5 space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          {t("learn.intro")}
        </p>

        {guides.map((guide, i) => (
          <button
            key={i}
            className="w-full flex items-start gap-3 border-glow rounded-lg bg-card/40 p-4 hover:bg-card/60 transition-colors text-left"
          >
            <guide.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium">{guide.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{guide.desc}</p>
              <span className="text-[10px] text-primary mt-1 block">{guide.count}</span>
            </div>
          </button>
        ))}
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default LearnPage;
