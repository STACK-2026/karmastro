import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarField from "@/components/StarField";
import { useT } from "@/i18n/ui";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: t("reset.toast_error_title"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("reset.toast_success_title") });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <StarField />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-bold">{t("reset.title")}</h1>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input type="password" placeholder={t("reset.placeholder")} value={password} onChange={e => setPassword(e.target.value)} className="pl-10 bg-secondary border-border" required minLength={6} />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? t("reset.loading") : t("reset.submit")}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
