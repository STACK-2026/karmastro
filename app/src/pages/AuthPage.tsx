import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarField from "@/components/StarField";

const REFERRAL_STORAGE_KEY = "karmastro_referral_code";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

        // If user is immediately available (auto-confirm), attach the referral code to their profile
        if (referralCode && data?.user?.id) {
          await supabase
            .from("profiles")
            .update({ referred_by_code: referralCode } as any)
            .eq("user_id", data.user.id);
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        }

        toast({
          title: "Compte créé ✨",
          description: referrerName
            ? `Bienvenue ! Tu as été invité(e) par ${referrerName}.`
            : "Vérifiez votre email pour confirmer votre inscription.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Entrez votre email", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email envoyé", description: "Vérifiez votre boîte de réception." });
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
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        <div className="text-center mb-8">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="font-serif text-3xl font-bold">
            {isLogin ? "Bon retour" : "Bienvenue"} ✨
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? "Retrouve ton cosmos" : "Commence ton voyage cosmique"}
          </p>
          {referralCode && !isLogin && (
            <div className="mt-4 p-3 rounded-xl bg-amber-300/10 border border-amber-300/30">
              <p className="text-xs text-amber-300">
                {referrerName ? (
                  <><strong>{referrerName}</strong> t'a invité(e) sur Karmastro ✨</>
                ) : (
                  <>Tu arrives avec le code <strong className="font-mono">{referralCode}</strong></>
                )}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
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
              placeholder="Mot de passe"
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
              Mot de passe oublié ?
            </button>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? "..." : isLogin ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary ml-1 hover:underline">
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
