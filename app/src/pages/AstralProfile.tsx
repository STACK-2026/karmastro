import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";

const AstralProfile = () => {
  const navigate = useNavigate();
  const { astrology } = useUserProfile();

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Profil astral" showBack />

      <div className="relative z-10 px-5 space-y-5">
        {/* Big 3 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Soleil", sign: astrology.sunSign.sign, element: astrology.sunSign.element, color: "#D4A017" },
            { label: "Lune", sign: astrology.moonSign.sign, element: astrology.moonSign.element, color: "#8B5CF6" },
            { label: "Ascendant", sign: astrology.ascendant.sign, element: astrology.ascendant.element, color: "#60A5FA" },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-glow rounded-xl bg-card/60 p-4 text-center flex flex-col items-center"
            >
              <ZodiacSymbol sign={item.sign} size={36} color={item.color} />
              <p className="text-xs text-muted-foreground mt-2">{item.label}</p>
              <p className="text-sm font-medium">{item.sign || "-"}</p>
              <p className="text-[10px] text-muted-foreground">{item.element || "-"}</p>
            </motion.div>
          ))}
        </div>

        {/* Planets table */}
        <div className="border-glow rounded-xl bg-card/60 p-4">
          <h3 className="font-serif text-lg mb-3">Positions planétaires</h3>
          <div className="space-y-3">
            {astrology.planets.map((planet) => (
              <details key={planet.name} className="group">
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <span className="text-lg w-6 text-center">{planet.symbol}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{planet.name}</span>
                      <span className="text-xs text-muted-foreground">{planet.sign} · M{planet.house}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{planet.degrees}</span>
                  </div>
                </summary>
                <p className="text-xs text-muted-foreground mt-2 ml-9 leading-relaxed">{planet.interpretation}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Aspects */}
        <div className="border-glow rounded-xl bg-card/60 p-4">
          <h3 className="font-serif text-lg mb-3">Aspects majeurs</h3>
          <div className="space-y-2">
            {astrology.aspects.map((aspect, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${aspect.nature === "harmonique" ? "bg-karmique-earth" : "bg-destructive"}`} />
                <span className="flex-1">{aspect.planet1} {aspect.type} {aspect.planet2}</span>
                <span className="text-xs font-mono text-muted-foreground">{aspect.orb}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Houses */}
        <div className="border-glow rounded-xl bg-card/60 p-4">
          <h3 className="font-serif text-lg mb-3">Les 12 maisons</h3>
          <div className="grid grid-cols-2 gap-2">
            {astrology.houses.map((house) => (
              <div key={house.house} className="bg-secondary/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-primary">M{house.house}</span>
                  <span className="text-xs">{house.sign}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{house.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AstralProfile;
