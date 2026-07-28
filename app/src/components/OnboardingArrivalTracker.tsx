import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/tracker";
import type { OnboardingEventName } from "@/lib/onboarding-analytics";

type ArrivalState = {
  onboardingArrival?: {
    name: OnboardingEventName;
    properties: Record<string, unknown>;
  };
};

export function OnboardingArrivalTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const trackedKeyRef = useRef<string | null>(null);
  const arrival = (location.state as ArrivalState | null)?.onboardingArrival;

  useEffect(() => {
    if (!arrival || trackedKeyRef.current === location.key) return;
    trackedKeyRef.current = location.key;
    void trackEvent(arrival.name, arrival.properties);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [arrival, location.key, location.pathname, location.search, navigate]);

  return null;
}
