import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
// Eager imports : pages we expect to hit on cold entry (SEO landings,
// deeplinks from marketing, auth hand-offs, error fallback). Everything
// else is lazy-loaded to shrink the initial bundle (~1.5 MB before this
// change, most of it never needed for an anon landing on /oracle).
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import OraclePage from "./pages/OraclePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import CookieBanner from "./components/CookieBanner.tsx";
import GoogleOneTap from "./components/GoogleOneTap.tsx";
import SparkleCursorTrail from "./components/SparkleCursorTrail.tsx";
import { usePageTracking } from "./hooks/usePageTracking";
import { useClaimAnonSession } from "./hooks/useClaimAnonSession";
import { OnboardingGate } from "./components/OnboardingGate";
import StarField from "./components/StarField";
import { Suspense, lazy, useEffect } from "react";
import { detectLocale, applyLocaleToDocument } from "./lib/locale";

// Lazy-loaded routes : authenticated-only pages, heavy feature pages, and
// the admin surface. Each lands in its own chunk and is fetched on demand.
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const AstralProfile = lazy(() => import("./pages/AstralProfile.tsx"));
const NumerologyPage = lazy(() => import("./pages/NumerologyPage.tsx"));
const CompatibilityPage = lazy(() => import("./pages/CompatibilityPage.tsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.tsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.tsx"));
const LearnPage = lazy(() => import("./pages/LearnPage.tsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.tsx"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const PricingPage = lazy(() => import("./pages/PricingPage.tsx"));

const queryClient = new QueryClient();

const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  useClaimAnonSession();
  return <>{children}</>;
};

// Apply detected locale to <html lang> on mount so screen readers + SEO
// pick up the correct language when the user arrives from a non-FR site URL.
const LocaleInit = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    applyLocaleToDocument(detectLocale());
  }, []);
  return <>{children}</>;
};

// Minimal brand-consistent fallback for lazy route loads. Starfield in the
// background + a breathing glyph. No blocking spinner, the transition is
// quick enough that a full overlay feels janky.
const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center relative">
    <StarField />
    <div className="relative z-10 text-amber-300/70 text-sm font-serif tracking-[0.2em] uppercase animate-pulse">
      ✦
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LocaleInit>
          <TrackingProvider>
            <OnboardingGate>
            <GoogleOneTap />
            <SparkleCursorTrail />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/oracle" element={<OraclePage />} />
                <Route path="/astral" element={<AstralProfile />} />
                <Route path="/numerology" element={<NumerologyPage />} />
                <Route path="/compatibility" element={<CompatibilityPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </OnboardingGate>
          </TrackingProvider>
          </LocaleInit>
        </BrowserRouter>
        <CookieBanner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
