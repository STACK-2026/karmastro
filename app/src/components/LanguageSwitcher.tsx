import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { detectLocale, setLocaleCookie, applyLocaleToDocument, type AppLocale } from "@/lib/locale";

// Matches the 11 locales supported across karmastro (site + app)
const LOCALES: AppLocale[] = ["fr", "en", "es", "pt", "de", "it", "tr", "ar", "ja", "pl", "ru"];

const LOCALE_NAMES: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  tr: "Türkçe",
  ar: "العربية",
  ja: "日本語",
  pl: "Polski",
  ru: "Русский",
};

const LOCALE_FLAGS: Record<string, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇵🇹",
  de: "🇩🇪",
  it: "🇮🇹",
  tr: "🇹🇷",
  ar: "🇸🇦",
  ja: "🇯🇵",
  pl: "🇵🇱",
  ru: "🇷🇺",
};

const LanguageSwitcher = () => {
  const [current, setCurrent] = useState<AppLocale>("fr");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(detectLocale());
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  const select = (locale: AppLocale) => {
    setCurrent(locale);
    setLocaleCookie(locale);
    applyLocaleToDocument(locale);
    setOpen(false);
    // Reload to apply new language across the app strings
    window.location.reload();
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-white/10 bg-white/[0.02] hover:border-amber-300/40 transition-colors"
        aria-label="Language selector"
        aria-expanded={open}
      >
        <span>{LOCALE_FLAGS[current]}</span>
        <span className="text-white/80">{LOCALE_NAMES[current]}</span>
        <ChevronDown className="w-3 h-3 text-white/60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] p-1 rounded-xl border border-white/15 bg-[#0f0a1e]/95 backdrop-blur-xl shadow-2xl max-h-80 overflow-y-auto">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => select(locale)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                locale === current ? "text-amber-300 bg-amber-300/10" : "text-white/80 hover:bg-white/5"
              }`}
            >
              <span>{LOCALE_FLAGS[locale]}</span>
              <span>{LOCALE_NAMES[locale]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
