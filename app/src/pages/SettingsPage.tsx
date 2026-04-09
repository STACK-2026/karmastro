import { ArrowLeft, Globe, Bell, Palette, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";

const SettingsPage = () => {
  const navigate = useNavigate();

  const settings = [
    { icon: Globe, label: "Langue", value: "Français" },
    { icon: Bell, label: "Notifications", value: "Activées" },
    { icon: Palette, label: "Thème", value: "Nuit (défaut)" },
    { icon: Shield, label: "Niveau de détail", value: "Intermédiaire" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <header className="relative z-10 flex items-center gap-3 px-5 pt-4 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-serif text-xl">Paramètres</h1>
      </header>

      <div className="relative z-10 px-5 space-y-3">
        {settings.map((s) => (
          <button
            key={s.label}
            className="w-full flex items-center gap-3 border-glow rounded-lg bg-card/40 p-4 hover:bg-card/60 transition-colors"
          >
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm flex-1 text-left">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.value}</span>
          </button>
        ))}

        <div className="pt-4">
          <Button variant="outline" className="w-full border-primary text-primary" onClick={() => navigate("/#pricing")}>
            ⭐ Passer à Premium  -  7,99€/mois
          </Button>
        </div>

        <div className="pt-2">
          <Button variant="ghost" className="w-full text-destructive" onClick={() => navigate("/")}>
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-6">
          Karmastro v1.0 · Les astres inclinent, ne determinent pas.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
