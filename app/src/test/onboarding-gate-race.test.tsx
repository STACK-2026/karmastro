import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

type ProfileResult = {
  data: { first_name: string | null; birth_date: string | null } | null;
  error: Error | null;
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const mocks = vi.hoisted(() => ({
  reads: [] as Array<ReturnType<typeof deferred<ProfileResult>>>,
  user: { id: "new-user" },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mocks.reads.shift()!.promise,
        }),
      }),
    }),
  },
}));

vi.mock("@/i18n/ui", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

import { OnboardingGate } from "@/components/OnboardingGate";

function RouteHarness() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/dashboard")}>dashboard</button>
      <span data-testid="path">{location.pathname}</span>
    </>
  );
}

describe("OnboardingGate request ordering", () => {
  beforeEach(() => {
    mocks.reads = [deferred<ProfileResult>(), deferred<ProfileResult>(), deferred<ProfileResult>()];
  });

  it("ignores a stale whitelist response after navigation to a protected route", async () => {
    const whitelistRead = mocks.reads[0];
    render(
      <MemoryRouter initialEntries={["/"]}>
        <OnboardingGate>
          <Routes>
            <Route path="*" element={<RouteHarness />} />
          </Routes>
        </OnboardingGate>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "dashboard" }));
    expect(await screen.findByText("common.onboarding_loading")).toBeInTheDocument();

    await act(async () => {
      whitelistRead.resolve({ data: { first_name: null, birth_date: null }, error: null });
    });
    expect(screen.getByText("common.onboarding_loading")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "dashboard" })).not.toBeInTheDocument();
  });
});
