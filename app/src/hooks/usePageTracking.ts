import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { trackPageView, captureAttribution } from "@/lib/tracker";

/**
 * Tracks every route change via trackPageView.
 * Also triggers first-touch attribution when a user logs in.
 * Mount once in App.tsx inside BrowserRouter.
 */
export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const lastPath = useRef<string>("");
  const attributedUsers = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    if (fullPath === lastPath.current) return;
    lastPath.current = fullPath;

    // Skip admin pages from tracking (avoid self-pollution)
    if (location.pathname.startsWith("/admin")) return;

    trackPageView(location.pathname).catch(() => {});
  }, [location.pathname, location.search]);

  // Run attribution capture once per auth session
  useEffect(() => {
    if (!user?.id) return;
    if (attributedUsers.current.has(user.id)) return;
    attributedUsers.current.add(user.id);
    captureAttribution(user.id).catch(() => {});
  }, [user?.id]);
}
