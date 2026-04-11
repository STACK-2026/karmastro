import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/tracker";

const GOOGLE_CLIENT_ID = "341498977895-m4ksae25lndfmji4rj3r7hp35487glp9.apps.googleusercontent.com";
const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Routes where One Tap should NOT appear (already handling auth, or during onboarding)
const EXCLUDED_PATHS = ["/auth", "/auth/callback", "/onboarding", "/reset-password"];

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (notificationCallback?: (n: unknown) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

// Generate a nonce and its SHA-256 hash.
// Google One Tap requires the hashed nonce in the ID token, Supabase verifies it with the raw nonce.
async function generateNonce(): Promise<[string, string]> {
  const rawBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...rawBytes));
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(nonce));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return [nonce, hashedNonce];
}

const REFERRAL_STORAGE_KEY = "karmastro_referral_code";

const GoogleOneTap = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialized = useRef(false);
  const currentNonceRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if still loading, already logged in, or on an excluded path
    if (loading) return;
    if (user) return;
    if (EXCLUDED_PATHS.some((p) => location.pathname.startsWith(p))) return;
    // Prevent double-init across re-renders (StrictMode etc.)
    if (initialized.current) return;

    let cancelled = false;

    const loadScriptIfNeeded = (): Promise<void> => {
      if (window.google?.accounts?.id) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("gsi_script_load_failed")));
          return;
        }
        const script = document.createElement("script");
        script.src = GSI_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("gsi_script_load_failed"));
        document.head.appendChild(script);
      });
    };

    const handleCredential = async (response: { credential?: string }) => {
      if (!response.credential) return;
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce: currentNonceRef.current || undefined,
        });
        if (error) throw error;

        trackEvent("login", { method: "google_one_tap" });

        // Attach referral code if present
        const storedRef = localStorage.getItem(REFERRAL_STORAGE_KEY);
        if (storedRef && data?.user?.id) {
          try {
            await supabase
              .from("profiles")
              .update({ referred_by_code: storedRef } as never)
              .eq("user_id", data.user.id);
            localStorage.removeItem(REFERRAL_STORAGE_KEY);
          } catch {
            // Swallow, the referral attach is best-effort
          }
        }

        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.warn("One Tap sign-in failed:", err);
      }
    };

    const init = async () => {
      try {
        await loadScriptIfNeeded();
        if (cancelled || !window.google?.accounts?.id) return;

        const [rawNonce, hashedNonce] = await generateNonce();
        currentNonceRef.current = rawNonce;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          itp_support: true,
        });

        initialized.current = true;
        window.google.accounts.id.prompt();
      } catch (err) {
        console.warn("One Tap init failed:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [user, loading, location.pathname, navigate]);

  return null;
};

export default GoogleOneTap;
