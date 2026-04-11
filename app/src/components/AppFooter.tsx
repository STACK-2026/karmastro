import { useEffect, useState } from "react";
import { detectLocale, type AppLocale } from "@/lib/locale";
import { tNav } from "@/i18n/nav";

// Mirrors site/src/components/Footer.astro in structure, links and wording.
// Oracle link = internal (/oracle). Other links = external to karmastro.com
// with locale propagation via ?lang=xx query param.

const SITE_URL = "https://karmastro.com";

const AppFooter = () => {
  const [locale, setLocale] = useState<AppLocale>("fr");
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const localeSuffix = locale !== "fr" ? `?lang=${locale}` : "";
  const siteLink = (path: string) => `${SITE_URL}${path}${localeSuffix}`;

  return (
    <footer
      className="relative z-10 mt-16"
      style={{ background: "hsl(258 46% 6%)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-white font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              Karmastro
            </p>
            <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              {tNav("footer.tagline", locale)}
            </p>
            <p className="text-xs italic mt-4" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
              « {tNav("footer.quote", locale)} »
              <br />
              <span className="text-[10px]">{tNav("footer.quote_author", locale)}</span>
            </p>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">{tNav("footer.legal_title", locale)}</p>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              <li>
                <a
                  href={siteLink("/mentions-legales")}
                  className="hover:text-white transition-colors no-underline"
                >
                  {tNav("footer.legal", locale)}
                </a>
              </li>
              <li>
                <a href={siteLink("/cgv")} className="hover:text-white transition-colors no-underline">
                  {tNav("footer.cgv", locale)}
                </a>
              </li>
              <li>
                <a
                  href={siteLink("/politique-confidentialite")}
                  className="hover:text-white transition-colors no-underline"
                >
                  {tNav("footer.privacy", locale)}
                </a>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">{tNav("footer.explore_title", locale)}</p>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
              <li>
                <a href={siteLink("/blog")} className="hover:text-white transition-colors no-underline">
                  {tNav("nav.blog", locale)}
                </a>
              </li>
              <li>
                <a href="/oracle" className="hover:text-white transition-colors no-underline">
                  {tNav("nav.oracle", locale)}
                </a>
              </li>
              <li>
                <a href={siteLink("/glossaire")} className="hover:text-white transition-colors no-underline">
                  {tNav("nav.glossary", locale)}
                </a>
              </li>
              <li>
                <a href={siteLink("/notre-histoire")} className="hover:text-white transition-colors no-underline">
                  {tNav("nav.about", locale)}
                </a>
              </li>
              <li>
                <a href={siteLink("/precision")} className="hover:text-white transition-colors no-underline">
                  {tNav("nav.precision", locale)}
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
            &copy; {year} Karmastro. {tNav("footer.copyright", locale)}.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
