import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { PromotionPassProvider } from "@/contexts/PromotionPassContext";
import CookieBanner from "./components/CookieBanner.tsx";
import GoogleOneTap from "./components/GoogleOneTap.tsx";
import SparkleCursorTrail from "./components/SparkleCursorTrail.tsx";
import { usePageTracking } from "./hooks/usePageTracking";
import { useClaimAnonSession } from "./hooks/useClaimAnonSession";
import { ProfileBoundary } from "./components/ProfileBoundary";
import { OnboardingArrivalTracker } from "./components/OnboardingArrivalTracker";
import StarField from "./components/StarField";
import { Suspense, lazy, useEffect } from "react";
import { I18nProvider } from "./i18n/ui";
import { EXTERNAL_LEGACY_ROUTES, INTERNAL_LEGACY_ROUTES } from "@/lib/legacy-routes";
import { purgeExpiredOnboardingDrafts } from "@/lib/onboarding-draft";

// Every route is lazy-loaded. Marketing and app deeplinks should not download
// one another's pages before rendering their own conversion surface.
const Index = lazy(() => import("./pages/Index.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const AuthCallback = lazy(() => import("./pages/AuthCallback.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const OraclePage = lazy(() => import("./pages/OraclePage.tsx"));
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
  useEffect(() => {
    purgeExpiredOnboardingDrafts();
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

const ExternalRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return <RouteFallback />;
};

const App = () => (
  <I18nProvider fallback={<RouteFallback />}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PromotionPassProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <TrackingProvider>
            <GoogleOneTap />
            <SparkleCursorTrail />
            <Suspense fallback={<RouteFallback />}>
              <OnboardingArrivalTracker />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/oracle" element={<OraclePage />} />
                <Route path="/astral" element={<ProfileBoundary><AstralProfile /></ProfileBoundary>} />
                <Route path="/numerology" element={<ProfileBoundary><NumerologyPage /></ProfileBoundary>} />
                <Route path="/compatibility" element={<ProfileBoundary><CompatibilityPage /></ProfileBoundary>} />
                <Route path="/calendar" element={<ProfileBoundary><CalendarPage /></ProfileBoundary>} />
                <Route path="/profile" element={<ProfileBoundary><ProfilePage /></ProfileBoundary>} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                {/* Legacy URLs still linked by older indexed articles. Keep
                    them useful instead of sending SEO visitors to a 404. */}
                {Object.entries(INTERNAL_LEGACY_ROUTES).map(([path, to]) => (
                  <Route key={path} path={path} element={<Navigate to={to} replace />} />
                ))}
                {Object.entries(EXTERNAL_LEGACY_ROUTES).map(([path, to]) => (
                  <Route key={path} path={path} element={<ExternalRedirect to={to} />} />
                ))}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TrackingProvider>
          </BrowserRouter>
          <CookieBanner />
        </TooltipProvider>
        </PromotionPassProvider>
      </AuthProvider>
    </QueryClientProvider>
  </I18nProvider>
);

export default App;
