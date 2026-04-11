import { motion } from "framer-motion";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { personalYear, personalMonth, personalDay, inclusionTable, getNumberKeyword, getNumberColor } from "@/lib/numerology";
import BottomNav from "@/components/BottomNav";
import AppFooter from "@/components/AppFooter";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { useUserProfile } from "@/hooks/useUserProfile";

const NumerologyPage = () => {
  const navigate = useNavigate();
  const profile = useUserProfile();
  const { numerology, firstName, lastName, birthDate: bd } = profile;

  const now = new Date();
  const py = personalYear(bd.getDate(), bd.getMonth() + 1, now.getFullYear());
  const pm = personalMonth(py, now.getMonth() + 1);
  const pd = personalDay(py, now.getMonth() + 1, now.getDate());
  const inclusion = inclusionTable(`${firstName} ${lastName}`.trim() || "Utilisateur");

  const coreNumbers = [
    { label: "Chemin de vie", number: numerology.lifePath.number, desc: numerology.lifePath.label },
    { label: "Expression", number: numerology.expression.number, desc: numerology.expression.label },
    { label: "Nombre intime", number: numerology.soulUrge.number, desc: numerology.soulUrge.label },
    { label: "Personnalité", number: numerology.personality.number, desc: numerology.personality.label },
    { label: "Anniversaire", number: numerology.birthday, desc: "Talents naturels" },
  ];

  const dynamicNumbers = [
    { label: "Année personnelle", number: py, desc: getNumberKeyword(py) },
    { label: "Mois personnel", number: pm, desc: getNumberKeyword(pm) },
    { label: "Jour personnel", number: pd, desc: getNumberKeyword(pd) },
  ];

  const lifePathDescriptions: Record<number, string> = {
    3: "Le chemin de vie 3 est celui du Créatif, de l'expressif, du communicant. Tu es né(e) avec un don naturel pour l'expression sous toutes ses formes : parole, écriture, art, musique. Ton énergie est joyeuse, optimiste et inspirante. Tu as la capacité de toucher les gens par tes mots et ta présence. Ton défi principal est la dispersion  -  trop de talents peuvent mener à n'en développer aucun pleinement. Apprends à canaliser ta créativité dans un projet concret. En amour, tu as besoin d'un partenaire qui stimule ton intellect et respecte ton besoin d'expression. En carrière, tu excelles dans tout ce qui touche à la communication, l'art, l'enseignement et le divertissement.",
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Numerologie" showBack />

      <div className="relative z-10 px-5 space-y-5">
        {/* Core numbers */}
        <div>
          <h3 className="font-serif text-lg mb-3">Nombres fondamentaux</h3>
          <div className="grid grid-cols-2 gap-3">
            {coreNumbers.map((n, i) => (
              <motion.div
                key={n.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`border-glow rounded-xl bg-card/60 p-4 text-center ${i === 0 ? "col-span-2" : ""}`}
              >
                <p className="text-xs text-muted-foreground">{n.label}</p>
                <p className={`text-3xl font-mono font-bold my-1 ${getNumberColor(n.number > 9 ? 2 : n.number)}`}>{n.number}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
                {i === 0 && lifePathDescriptions[n.number] && (
                  <details className="mt-3 text-left">
                    <summary className="text-xs text-primary cursor-pointer">Interprétation complète</summary>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{lifePathDescriptions[n.number]}</p>
                  </details>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic numbers */}
        <div>
          <h3 className="font-serif text-lg mb-3">Numérologie dynamique</h3>
          <div className="grid grid-cols-3 gap-3">
            {dynamicNumbers.map((n) => (
              <motion.div
                key={n.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-glow rounded-xl bg-card/60 p-4 text-center"
              >
                <p className="text-[10px] text-muted-foreground">{n.label}</p>
                <p className={`text-3xl font-mono font-bold my-1 ${getNumberColor(n.number)}`}>{n.number}</p>
                <p className="text-[10px] text-muted-foreground">{n.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Inclusion table */}
        <div className="border-glow rounded-xl bg-card/60 p-4">
          <h3 className="font-serif text-lg mb-3">Table d'inclusion</h3>
          <p className="text-xs text-muted-foreground mb-3">Fréquence de chaque nombre dans ton nom complet</p>
          <div className="grid grid-cols-9 gap-1">
            {Object.entries(inclusion).map(([num, count]) => (
              <div key={num} className="text-center">
                <div className={`text-lg font-mono font-bold ${count === 0 ? "text-destructive/60" : "text-primary"}`}>
                  {count}
                </div>
                <div className="text-[10px] text-muted-foreground">{num}</div>
                {count === 0 && <div className="text-[8px] text-destructive">absent</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar mini */}
        <div className="border-glow rounded-xl bg-card/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg">Calendrier numérologique</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => navigate("/calendar")}>
              Voir tout
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["L","M","M","J","V","S","D"].map(d => (
              <span key={d} className="text-[10px] text-muted-foreground py-1">{d}</span>
            ))}
            {/* April 2026 starts on Wednesday */}
            {[null, null, null].map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: 30 }, (_, i) => {
              const d = i + 1;
              const pDay = ((py + 4 + d) % 9) || 9;
              const isToday = d === 8;
              return (
                <div key={d} className={`text-xs py-1 rounded ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                  <span className="block text-[10px]">{d}</span>
                  <span className={`block text-[9px] font-mono ${getNumberColor(pDay)}`}>{pDay}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default NumerologyPage;
