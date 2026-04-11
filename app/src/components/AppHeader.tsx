import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { detectLocale } from "@/lib/locale";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
}

const SITE_URL = "https://karmastro.com";

// Site-parity nav links. Same wording, same order as Header.astro.
// External links point to the site (Horoscope, Outils, Le Cosmos, Parrainage).
// Oracle stays internal to the app.
type NavLink = { key: string; label: string; href: string; external: boolean };

const NAV_LINKS: NavLink[] = [
  { key: "horoscope", label: "Horoscope", href: "/horoscope", external: true },
  { key: "tools", label: "Outils", href: "/outils", external: true },
  { key: "blog", label: "Le Cosmos", href: "/blog", external: true },
  { key: "referral", label: "Parrainage", href: "/parrainage", external: true },
  { key: "oracle", label: "L'Oracle", href: "/oracle", external: false },
];

const AppHeader = ({ title, subtitle, showBack = false, rightContent }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState("fr");

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const externalHref = (path: string) => `${SITE_URL}${path}${locale !== "fr" ? `?lang=${locale}` : ""}`;

  const handleNavClick = (link: NavLink, e: React.MouseEvent) => {
    setMobileOpen(false);
    if (!link.external) {
      e.preventDefault();
      navigate(link.href);
    }
    // External links: let the browser handle via href
  };

  const userInitial = (user?.email?.[0] || "?").toUpperCase();

  return (
    <>
      <header
        className="fixed z-50 flex items-center justify-between transition-transform duration-500 ease-in-out"
        style={{
          top: 8,
          left: 8,
          right: 8,
          height: 56,
          padding: "0 16px",
          background: "rgba(31, 22, 54, 0.92)",
          backdropFilter: "blur(24px) saturate(1.2)",
          WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          border: "1px solid rgba(212, 160, 23, 0.25)",
          borderRadius: 16,
          boxShadow:
            "0 6px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Left: logo + optional back/title */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5 text-white/85" />
            </button>
          ) : (
            <a href={SITE_URL} className="flex items-center gap-2.5 no-underline flex-shrink-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(271 91% 65%)" }}
              >
                <span className="text-white text-xs font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                  K
                </span>
              </div>
              <span
                className="text-white font-bold text-xl tracking-tight"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Karmastro
              </span>
            </a>
          )}
          {showBack && title && (
            <div className="min-w-0">
              <span className="font-serif text-lg font-bold text-white leading-tight block truncate">{title}</span>
              {subtitle && (
                <span className="text-[11px] text-white/60 leading-tight block truncate">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {/* Center: desktop nav (site-parity). Hidden when showBack. */}
        {!showBack && (
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.external ? externalHref(link.href) : link.href}
                onClick={(e) => handleNavClick(link, e)}
                className="app-nav-link text-sm font-medium no-underline relative"
                style={{ color: "rgba(255, 255, 255, 0.85)" }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right: language + profile/auth + custom right content + mobile hamburger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!showBack && (
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
          )}

          {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}

          {!rightContent && !showBack && (
            <>
              {user ? (
                <button
                  onClick={() => navigate("/profile")}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                  style={{
                    background: "rgba(212, 160, 23, 0.15)",
                    border: "1px solid rgba(212, 160, 23, 0.4)",
                  }}
                  aria-label="Mon profil"
                >
                  <span className="text-amber-300 text-sm font-bold">{userInitial}</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-white no-underline transition-all"
                  style={{
                    background: "hsl(271 91% 65%)",
                    padding: "8px 20px",
                    height: 36,
                    borderRadius: 12,
                    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.25)",
                  }}
                >
                  Connexion
                </button>
              )}
            </>
          )}

          {/* Mobile hamburger */}
          {!showBack && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && !showBack && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed z-50 flex flex-col"
            style={{
              top: 8,
              right: 8,
              bottom: 8,
              width: 280,
              background: "rgba(31, 22, 54, 0.96)",
              backdropFilter: "blur(28px) saturate(1.2)",
              WebkitBackdropFilter: "blur(28px) saturate(1.2)",
              border: "1px solid rgba(212, 160, 23, 0.3)",
              borderRadius: 20,
              boxShadow: "0 12px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}
          >
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: "1px solid rgba(212, 160, 23, 0.2)" }}
            >
              <span className="text-white font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                Karmastro
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/85 hover:bg-white/5"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.key}
                  href={link.external ? externalHref(link.href) : link.href}
                  onClick={(e) => handleNavClick(link, e)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white no-underline hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="p-4">
              <LanguageSwitcher />
            </div>

            <div className="p-4 pt-0">
              {user ? (
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl no-underline"
                  style={{ background: "hsl(271 91% 65%)" }}
                >
                  Mon profil
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate("/auth");
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl no-underline"
                  style={{ background: "hsl(271 91% 65%)" }}
                >
                  Connexion
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Spacer to push page content below the fixed header */}
      <div className="h-[72px]" />

      {/* Inline styles for nav link hover underline */}
      <style>{`
        .app-nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: hsl(271 91% 65%);
          border-radius: 1px;
          transition: width 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .app-nav-link:hover::after { width: 100%; }
        .app-nav-link:hover { color: white !important; }
      `}</style>
    </>
  );
};

export default AppHeader;
