import { BookOpen, Star, Hash, Moon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";

const guides = [
  { icon: Star, title: "Les 12 signes du zodiaque", desc: "Traits, compatibilités, célébrités pour chaque signe", count: "12 articles" },
  { icon: Hash, title: "Les 9 chemins de vie", desc: "Interprétation complète de chaque nombre directeur", count: "9 articles" },
  { icon: Moon, title: "Les planètes en astrologie", desc: "Du Soleil à Pluton : rôle et influence de chaque planète", count: "10 articles" },
  { icon: Star, title: "Les 12 maisons astrologiques", desc: "Ce que gouverne chaque maison dans ton thème", count: "12 articles" },
  { icon: Sparkles, title: "Les dettes karmiques", desc: "13, 14, 16, 19 : comprendre et transformer tes leçons", count: "4 articles" },
  { icon: Moon, title: "Les heures miroirs", desc: "11:11, 22:22, 12:21... signification et messages", count: "20+ articles" },
  { icon: Hash, title: "La numérologie pythagoricienne", desc: "Méthode de calcul complète expliquée pas à pas", count: "Guide" },
  { icon: Star, title: "Comprendre les transits", desc: "Guide pour débutants sur les mouvements planétaires", count: "Guide" },
  { icon: Moon, title: "Mercure rétrograde", desc: "Guide pratique : dates, impacts, conseils", count: "Guide" },
  { icon: Sparkles, title: "Nœuds lunaires et karma", desc: "Nord et Sud : ton passé et ta destinée", count: "Guide" },
];

const LearnPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Apprendre" showBack />

      <div className="relative z-10 px-5 space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Explore les guides pour approfondir tes connaissances en astrologie, numérologie et spiritualité.
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

      <BottomNav />
    </div>
  );
};

export default LearnPage;
