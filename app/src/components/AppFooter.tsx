import { useEffect, useState } from "react";
import { detectLocale } from "@/lib/locale";

// Mirrors site/src/components/Footer.astro in structure, links and wording.
// Pages that want the footer import it explicitly (Dashboard, Profile, Settings).
// Oracle chat and Admin pages do NOT mount it because they use full-screen layouts.

const SITE_URL = "https://karmastro.com";

const AppFooter = () => {
  const [locale, setLocale] = useState("fr");
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const localeSuffix = locale !== "fr" ? `?lang=${locale}` : "";
  const siteLink = (path: string) => `${SITE_URL}${path}${localeSuffix}`;

  return (
    <footer
      className="relative z-10 mt-16"
      style={{ background: "var(--bg-card, #1a1333)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-white font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              Karmastro
            </p>
            <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              Astrologie et numerologie au service de ton evolution personnelle.
            </p>
            <p className="text-xs italic mt-4" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
              « Astra inclinant, sed non necessitant »
              <br />
              <span className="text-[10px]">Thomas d'Aquin</span>
            </p>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Informations legales</p>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              <li>
                <a href={siteLink("/mentions-legales")} className="hover:text-white transition-colors no-underline">
                  Mentions legales
                </a>
              </li>
              <li>
                <a href={siteLink("/cgv")} className="hover:text-white transition-colors no-underline">
                  Conditions generales
                </a>
              </li>
              <li>
                <a
                  href={siteLink("/politique-confidentialite")}
                  className="hover:text-white transition-colors no-underline"
                >
                  Confidentialite
                </a>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Explorer</p>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              <li>
                <a href={siteLink("/blog")} className="hover:text-white transition-colors no-underline">
                  Le Cosmos
                </a>
              </li>
              <li>
                <a href="/oracle" className="hover:text-white transition-colors no-underline">
                  L'Oracle
                </a>
              </li>
              <li>
                <a href={siteLink("/glossaire")} className="hover:text-white transition-colors no-underline">
                  Glossaire
                </a>
              </li>
              <li>
                <a href={siteLink("/notre-histoire")} className="hover:text-white transition-colors no-underline">
                  Notre histoire
                </a>
              </li>
              <li>
                <a href={siteLink("/precision")} className="hover:text-white transition-colors no-underline">
                  Precision
                </a>
              </li>
              <li>
                <a href="mailto:hello@karmastro.com" className="hover:text-white transition-colors no-underline">
                  hello@karmastro.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 text-center text-xs"
          style={{ borderTop: "1px solid hsl(260 20% 12%)", color: "rgba(196, 184, 219, 0.5)" }}
        >
          <p>
            &copy; {year} Karmastro. Tous droits reserves.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
