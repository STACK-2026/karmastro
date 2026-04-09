import { Sparkles, Star, Hash, Moon, Zap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { demoProfile } from "@/lib/demoData";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { astrology, numerology } = demoProfile;

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Mon profil" showBack />

      <div className="relative z-10 px-5 space-y-5">
        {/* Cosmic ID card */}
        <div className="border-glow glow-violet rounded-xl bg-card/80 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl">{demoProfile.firstName} {demoProfile.lastName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {demoProfile.birthDate.toLocaleDateString("fr-FR")} · {demoProfile.birthTime} · {demoProfile.birthPlace}
          </p>

          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <span className="text-2xl">{astrology.sunSign.symbol}</span>
              <p className="text-[10px] text-muted-foreground">{astrology.sunSign.sign}</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">{astrology.moonSign.symbol}</span>
              <p className="text-[10px] text-muted-foreground">{astrology.moonSign.sign}</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">{astrology.ascendant.symbol}</span>
              <p className="text-[10px] text-muted-foreground">Asc. {astrology.ascendant.sign}</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <span className="font-mono text-primary text-lg">{numerology.lifePath.number}</span>
              <p className="text-[10px] text-muted-foreground">Chemin de vie</p>
            </div>
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <span className="font-mono text-primary text-lg">{numerology.personalYear2026}</span>
              <p className="text-[10px] text-muted-foreground">Année {new Date().getFullYear()}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <span className="font-mono text-primary text-lg">{numerology.expression.number}</span>
              <p className="text-[10px] text-muted-foreground">Expression</p>
            </div>
          </div>

          {numerology.karmicDebts.length > 0 && (
            <p className="text-xs text-accent mt-3">⚡ Dette karmique : {numerology.karmicDebts.join(", ")}</p>
          )}
          {numerology.northNode && (
            <p className="text-xs text-muted-foreground mt-2">
              ☊ Nœud Nord : {numerology.northNode.sign} M{numerology.northNode.house}  -  {numerology.northNode.lesson}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          {[
            { icon: Star, label: "Mon profil astral complet", path: "/astral" },
            { icon: Hash, label: "Ma numérologie complète", path: "/numerology" },
            { icon: Moon, label: "Calendrier cosmique", path: "/calendar" },
            { icon: Zap, label: "Compatibilités", path: "/compatibility" },
            { icon: BookOpen, label: "Apprendre", path: "/learn" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 border-glow rounded-lg bg-card/40 p-4 hover:bg-card/60 transition-colors text-left"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
