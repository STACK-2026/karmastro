import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  trackEvent: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/tracker", () => ({ trackEvent: mocks.trackEvent }));

import { OnboardingArrivalTracker } from "@/components/OnboardingArrivalTracker";

describe("onboarding destination analytics", () => {
  it("records arrival only after the destination route has rendered", async () => {
    render(
      <MemoryRouter initialEntries={[{
        pathname: "/oracle",
        state: {
          onboardingArrival: {
            name: "onboarding_destination_reached_v1",
            properties: { destination: "/oracle" },
          },
        },
      }]}>
        <OnboardingArrivalTracker />
        <Routes>
          <Route path="/oracle" element={<p>Oracle rendered</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mocks.trackEvent).toHaveBeenCalledWith(
        "onboarding_destination_reached_v1",
        { destination: "/oracle" },
      );
    });
  });
});
