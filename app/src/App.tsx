import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import OraclePage from "./pages/OraclePage.tsx";
import AstralProfile from "./pages/AstralProfile.tsx";
import NumerologyPage from "./pages/NumerologyPage.tsx";
import CompatibilityPage from "./pages/CompatibilityPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import LearnPage from "./pages/LearnPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import OnboardingPage from "./pages/OnboardingPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import CookieBanner from "./components/CookieBanner.tsx";
import { usePageTracking } from "./hooks/usePageTracking";

const queryClient = new QueryClient();

const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TrackingProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/auth" element={<AuthPage />} />
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
          </TrackingProvider>
        </BrowserRouter>
        <CookieBanner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
