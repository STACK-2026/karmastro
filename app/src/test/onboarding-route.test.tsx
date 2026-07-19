import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  trackEvent: vi.fn(() => Promise.resolve()),
  search: "",
  user: { id: "user-complete", email: "test@example.com" } as {
    id: string;
    email: string;
  } | null,
  profile: {
    first_name: "Camille",
    last_name: "Test",
    birth_name: null,
    current_name: null,
    birth_date: "1990-02-14",
    birth_time: null,
    knows_birth_time: false,
    birth_place: null,
    birth_latitude: null,
    birth_longitude: null,
    gender: null,
    interests: [],
    level: "débutant",
  } as {
    first_name: string | null;
    last_name: string | null;
    birth_name: string | null;
    current_name: string | null;
    birth_date: string | null;
    birth_time: string | null;
    knows_birth_time: boolean;
    birth_place: string | null;
    birth_latitude: number | null;
    birth_longitude: number | null;
    gender: string | null;
    interests: string[];
    level: string;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useSearchParams: () => [new URLSearchParams(mocks.search)],
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: mocks.profile }),
        }),
      }),
    }),
  },
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/tracker", () => ({ trackEvent: mocks.trackEvent }));
vi.mock("@/i18n/ui", () => ({
  useT: () => ({ t: (key: string) => key, locale: "fr" }),
}));
vi.mock("@/components/StarField", () => ({ default: () => null }));

import OnboardingPage from "@/pages/OnboardingPage";

describe("onboarding route protection", () => {
  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.trackEvent.mockClear();
    mocks.search = "";
    mocks.user = { id: "user-complete", email: "test@example.com" };
    mocks.profile.first_name = "Camille";
    mocks.profile.birth_date = "1990-02-14";
    sessionStorage.clear();
  });

  it("replaces a stale onboarding entry for an authenticated complete profile", async () => {
    render(<OnboardingPage />);

    expect(screen.getByText("common.onboarding_loading")).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
    expect(mocks.trackEvent).toHaveBeenCalledWith("onboarding_accessed", {
      decision: "redirect",
      edit_requested: false,
      profile_complete: true,
    });
  });

  it("keeps an authenticated incomplete profile in onboarding", async () => {
    mocks.profile.first_name = null;

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(mocks.trackEvent).toHaveBeenCalledWith("onboarding_accessed", {
        decision: "onboarding",
        edit_requested: false,
        profile_complete: false,
      });
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("keeps an anonymous visitor in onboarding", async () => {
    mocks.user = null;

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(mocks.trackEvent).toHaveBeenCalledWith("onboarding_accessed", {
        decision: "onboarding",
        edit_requested: false,
        profile_complete: false,
      });
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("allows explicit edit mode only for a complete profile", async () => {
    mocks.search = "mode=edit";

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(mocks.trackEvent).toHaveBeenCalledWith("onboarding_accessed", {
        decision: "edit",
        edit_requested: true,
        profile_complete: true,
      });
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
