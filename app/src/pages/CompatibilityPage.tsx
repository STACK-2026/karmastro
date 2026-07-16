import { ArrowRight, Heart, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useT } from "@/i18n/ui";

const COPY: Record<string, { intro: string; free: string; freeDesc: string; paid: string; paidDesc: string }> = {
  fr: { intro: "Compare deux vrais thèmes plutôt que des profils de démonstration.", free: "Calculer une synastrie", freeDesc: "Dates, heures et lieux de naissance · résultat gratuit", paid: "Lecture Âme Sœur", paidDesc: "Une analyse relationnelle complète, livrée après l’achat unique." },
  en: { intro: "Compare two real birth charts instead of demo profiles.", free: "Calculate synastry", freeDesc: "Birth dates, times and places · free result", paid: "Soulmate reading", paidDesc: "A complete relationship analysis delivered after a one-time purchase." },
  es: { intro: "Compara dos cartas natales reales, no perfiles de demostración.", free: "Calcular sinastría", freeDesc: "Fechas, horas y lugares de nacimiento · resultado gratuito", paid: "Lectura Alma Gemela", paidDesc: "Un análisis completo de la relación con pago único." },
  pt: { intro: "Compara dois mapas natais reais, não perfis de demonstração.", free: "Calcular sinastria", freeDesc: "Datas, horas e locais de nascimento · resultado gratuito", paid: "Leitura Alma Gémea", paidDesc: "Uma análise completa da relação com pagamento único." },
  de: { intro: "Vergleiche zwei echte Geburtshoroskope statt Demo-Profile.", free: "Synastrie berechnen", freeDesc: "Geburtsdaten, Uhrzeiten und Orte · kostenloses Ergebnis", paid: "Seelenpartner-Lesung", paidDesc: "Eine vollständige Beziehungsanalyse als Einmalkauf." },
  it: { intro: "Confronta due veri temi natali, non profili dimostrativi.", free: "Calcola la sinastria", freeDesc: "Date, orari e luoghi di nascita · risultato gratuito", paid: "Lettura Anima Gemella", paidDesc: "Un’analisi completa della relazione con acquisto unico." },
  tr: { intro: "Demo profiller yerine iki gerçek doğum haritasını karşılaştır.", free: "Sinastri hesapla", freeDesc: "Doğum tarihleri, saatleri ve yerleri · ücretsiz sonuç", paid: "Ruh Eşi okuması", paidDesc: "Tek seferlik satın alımla tam ilişki analizi." },
  pl: { intro: "Porównaj dwa prawdziwe kosmogramy zamiast profili demo.", free: "Oblicz synastrię", freeDesc: "Daty, godziny i miejsca urodzenia · wynik bezpłatny", paid: "Odczyt Bratniej Duszy", paidDesc: "Pełna analiza relacji w jednorazowym zakupie." },
  ru: { intro: "Сравни две реальные натальные карты вместо демо-профилей.", free: "Рассчитать синастрию", freeDesc: "Даты, время и места рождения · бесплатный результат", paid: "Чтение Родственной Души", paidDesc: "Полный анализ отношений за разовую оплату." },
  ja: { intro: "デモプロフィールではなく、2人の実際の出生図を比較します。", free: "シナストリーを計算", freeDesc: "生年月日・出生時刻・出生地 · 無料結果", paid: "ソウルメイト鑑定", paidDesc: "1回の購入で受け取れる完全な関係分析です。" },
  ar: { intro: "قارن بين خريطتي ميلاد حقيقيتين بدل ملفات تجريبية.", free: "احسب التوافق الفلكي", freeDesc: "تواريخ وأوقات وأماكن الميلاد · نتيجة مجانية", paid: "قراءة توأم الروح", paidDesc: "تحليل كامل للعلاقة بدفعة واحدة." },
};

const CompatibilityPage = () => {
  const navigate = useNavigate();
  const { t, locale } = useT();
  const profile = useUserProfile();
  const copy = COPY[locale] || COPY.en;
  const synastryUrl = locale === "fr"
    ? "https://karmastro.com/outils/synastrie/"
    : "https://karmastro.com/en/tools/synastry/";

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title={t("compat.header_title")} showBack />

      <main className="relative z-10 px-5 space-y-5 max-w-2xl mx-auto">
        <section className="border-glow rounded-2xl bg-card/60 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
              <ZodiacSymbol sign={profile.astrology.sunSign.sign} size={24} color="#D4A017" />
            </div>
            <div>
              <p className="font-medium">{profile.firstName}</p>
              <p className="text-xs text-muted-foreground">{profile.astrology.sunSign.sign} · {t("dashboard.badge_cv", { number: profile.numerology.lifePath.number })}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{copy.intro}</p>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg">{copy.free}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{copy.freeDesc}</p>
          <Button className="w-full" onClick={() => window.location.assign(synastryUrl)}>
            {copy.free} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </section>

        <section className="rounded-2xl border border-pink-400/30 bg-pink-400/[0.05] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-pink-300" />
            <h2 className="font-serif text-lg text-pink-200">{copy.paid}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{copy.paidDesc}</p>
          <Button variant="outline" className="w-full border-pink-400/40 text-pink-300" onClick={() => navigate("/pricing")}>
            <Sparkles className="h-4 w-4 mr-2" /> {copy.paid}
          </Button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default CompatibilityPage;
