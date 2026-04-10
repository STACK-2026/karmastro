import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { demoProfile } from "@/lib/demoData";
import { personalYear, personalDay as calcPD, getNumberKeyword, getNumberColor, getMoonPhase } from "@/lib/numerology";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";

const CalendarPage = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<number | null>(8);
  const bd = demoProfile.birthDate;
  const py = personalYear(bd.getDate(), bd.getMonth() + 1, 2026);

  const daysInMonth = 30; // April 2026
  const startDay = 2; // April 1, 2026 = Wednesday (0=Mon)

  const getDayData = (d: number) => {
    const pd = calcPD(py, 4, d);
    const moon = getMoonPhase(new Date(2026, 3, d));
    return { pd, moon };
  };

  const getFavorability = (pd: number) => {
    if ([1, 3, 9].includes(pd)) return "bg-karmique-earth/20 border-karmique-earth/30";
    if ([7].includes(pd)) return "bg-karmique-violet/20 border-karmique-violet/30";
    if ([5].includes(pd)) return "bg-accent/20 border-accent/30";
    return "bg-secondary/30 border-border";
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Calendrier cosmique" showBack />

      <div className="relative z-10 px-5 space-y-5">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
          <h2 className="font-serif text-xl">Avril 2026</h2>
          <Button variant="ghost" size="icon"><ChevronRight className="h-5 w-5" /></Button>
        </div>

        {/* Legend */}
        <div className="flex gap-3 justify-center text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-karmique-earth" /> Favorable</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Attention</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-karmique-violet" /> Spirituel</span>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
            <span key={d} className="text-[10px] text-muted-foreground text-center py-1">{d}</span>
          ))}
          {Array.from({ length: startDay }, (_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const { pd, moon } = getDayData(d);
            const isToday = d === 8;
            const isSelected = d === selectedDay;

            return (
              <motion.button
                key={d}
                onClick={() => setSelectedDay(d)}
                whileTap={{ scale: 0.95 }}
                className={`relative rounded-lg p-1 text-center border transition-colors ${
                  isToday ? "ring-1 ring-primary" : ""
                } ${isSelected ? "bg-primary/20 border-primary/40" : getFavorability(pd)}`}
              >
                <span className="text-xs block">{d}</span>
                <span className={`text-[10px] font-mono block ${getNumberColor(pd)}`}>{pd}</span>
                <span className="text-[8px] block">{moon.emoji}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-glow rounded-xl bg-card/60 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg">{selectedDay} avril 2026</h3>
              <span className={`text-lg font-mono font-bold ${getNumberColor(getDayData(selectedDay).pd)}`}>
                {getDayData(selectedDay).pd}
              </span>
            </div>
            <div className="flex gap-3 mb-3 text-xs">
              <span className="bg-secondary rounded-full px-2.5 py-1">{getDayData(selectedDay).moon.emoji} {getDayData(selectedDay).moon.phase}</span>
              <span className="bg-primary/20 text-primary rounded-full px-2.5 py-1 font-mono">
                Jour {getDayData(selectedDay).pd}  -  {getNumberKeyword(getDayData(selectedDay).pd)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedDay === 8
                ? "Jour d'achèvement et de lâcher-prise. Finalise ce qui doit l'être, pardonne, et fais de la place pour le nouveau cycle qui approche. L'énergie du 9 t'invite à la générosité et au détachement."
                : `Ton jour personnel ${getDayData(selectedDay).pd} t'invite à ${getNumberKeyword(getDayData(selectedDay).pd).toLowerCase()}. Utilise l'énergie de ce nombre pour aligner tes actions avec ton chemin de vie 3.`
              }
            </p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CalendarPage;
