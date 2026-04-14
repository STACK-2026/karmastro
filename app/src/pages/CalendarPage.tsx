import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { personalYear, personalDay as calcPD, getNumberKeyword, getNumberColor, getMoonPhase } from "@/lib/numerology";
import BottomNav from "@/components/BottomNav";
import AppFooter from "@/components/AppFooter";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useT } from "@/i18n/ui";

const CalendarPage = () => {
  const navigate = useNavigate();
  const { t, locale } = useT();
  const [selectedDay, setSelectedDay] = useState<number | null>(8);
  const { birthDate: bd } = useUserProfile();
  const py = personalYear(bd.getDate(), bd.getMonth() + 1, 2026);

  const daysInMonth = 30; // April 2026
  const startDay = 2; // April 1, 2026 = Wednesday (0=Mon)
  const year = 2026;
  const monthIndex = 3; // April (0-based)

  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(year, monthIndex, 1));
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Build weekday short labels starting Monday
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    // 2026-01-05 is a Monday
    const d = new Date(2026, 0, 5 + i);
    const label = weekdayFmt.format(d).replace(".", "");
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  const getDayData = (d: number) => {
    const pd = calcPD(py, 4, d);
    const moon = getMoonPhase(new Date(year, monthIndex, d));
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
      <AppHeader title={t("calendar.header_title")} showBack />

      <div className="relative z-10 px-5 space-y-5">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
          <h2 className="font-serif text-xl">{monthLabelCap}</h2>
          <Button variant="ghost" size="icon"><ChevronRight className="h-5 w-5" /></Button>
        </div>

        {/* Legend */}
        <div className="flex gap-3 justify-center text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-karmique-earth" /> {t("calendar.legend_favorable")}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> {t("calendar.legend_warning")}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-karmique-violet" /> {t("calendar.legend_spiritual")}</span>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((d, idx) => (
            <span key={`${d}-${idx}`} className="text-[10px] text-muted-foreground text-center py-1">{d}</span>
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
              <h3 className="font-serif text-lg">
                {t("calendar.day_label", { day: selectedDay, month: new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(year, monthIndex, selectedDay)), year })}
              </h3>
              <span className={`text-lg font-mono font-bold ${getNumberColor(getDayData(selectedDay).pd)}`}>
                {getDayData(selectedDay).pd}
              </span>
            </div>
            <div className="flex gap-3 mb-3 text-xs">
              <span className="bg-secondary rounded-full px-2.5 py-1">{getDayData(selectedDay).moon.emoji} {getDayData(selectedDay).moon.phase}</span>
              <span className="bg-primary/20 text-primary rounded-full px-2.5 py-1 font-mono">
                {t("calendar.day_prefix", { n: getDayData(selectedDay).pd, keyword: getNumberKeyword(getDayData(selectedDay).pd) })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("calendar.day_generic", { n: getDayData(selectedDay).pd, keyword: getNumberKeyword(getDayData(selectedDay).pd).toLowerCase() })}
            </p>
          </motion.div>
        )}
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default CalendarPage;
