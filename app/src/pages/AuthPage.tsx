import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarField from "@/components/StarField";
import { trackEvent } from "@/lib/tracker";
import { useT } from "@/i18n/ui";

const REFERRAL_STORAGE_KEY = "karmastro_referral_code";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useT();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Capture ?ref= from URL and look up the referrer name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let code = params.get("ref")?.toUpperCase().trim() || null;
    if (!code) {
      // Fallback to stored code (persistence across pages)
      code = localStorage.getItem(REFERRAL_STORAGE_KEY);
    }
    if (code) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, code);
      setReferralCode(code);
      // Not logged in → show signup screen by default
      setIsLogin(false);
      // Look up referrer name
      supabase
        .from("referral_lookup" as any)
        .select("first_name")
        .eq("referral_code", code)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data?.first_name) setReferrerName(data.first_name);
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        trackEvent("login", { method: "email" });
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: referralCode ? { referred_by_code: referralCode } : undefined,
          },
        });
        if (error) throw error;

        trackEvent("signup", {
          method: "email",
          has_referral: Boolean(referralCode),
        });

        // If user is immediately available (auto-confirm), attach the referral code to their profile
        if (referralCode && data?.user?.id) {
          await supabase
            .from("profiles")
            .update({ referred_by_code: referralCode } as any)
            .eq("user_id", data.user.id);
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        }

        toast({
          title: t("auth.toast_account_created_title"),
          description: referrerName
            ? t("auth.toast_welcome_invited", { name: referrerName })
            : t("auth.toast_verify_email"),
        });
      }
    } catch (error: any) {
      toast({
        title: t("auth.toast_error_title"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // Redirect happens externally, nothing else to do here
    } catch (error: any) {
      toast({
        title: t("auth.toast_google_error_title"),
        description: error.message || t("auth.toast_google_error_desc"),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: t("auth.toast_enter_email"), variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: t("auth.toast_error_title"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.toast_email_sent_title"), description: t("auth.toast_email_sent_desc") });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <StarField />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground mb-8 hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("auth.back")}
        </button>

        <div className="text-center mb-8">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="font-serif text-3xl font-bold">
            {isLogin ? t("auth.title_login") : t("auth.title_signup")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? t("auth.subtitle_login") : t("auth.subtitle_signup")}
          </p>
          {referralCode && !isLogin && (
            <div className="mt-4 p-3 rounded-xl bg-amber-300/10 border border-amber-300/30">
              <p className="text-xs text-amber-300">
                {referrerName ? (
                  <>{t("auth.referral_invited", { name: referrerName })}</>
                ) : (
                  <>{t("auth.referral_with_code", { code: referralCode })}</>
                )}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-[#0f0a1e] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {t("auth.continue_google")}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{t("auth.separator_or")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder={t("auth.email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-secondary border-border"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-secondary border-border"
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {isLogin && (
            <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:underline block">
              {t("auth.forgot_password")}
            </button>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? t("auth.loading") : isLogin ? t("auth.submit_login") : t("auth.submit_signup")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? t("auth.no_account") : t("auth.have_account")}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary ml-1 hover:underline">
            {isLogin ? t("auth.switch_signup") : t("auth.switch_login")}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
