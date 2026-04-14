import { Home, MessageCircle, Calendar, User, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/ui";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useT();

  const tabs = [
    { icon: Home, label: t("bottomnav.home"), path: "/dashboard" },
    { icon: MessageCircle, label: t("bottomnav.oracle"), path: "/oracle" },
    { icon: Calendar, label: t("bottomnav.calendar"), path: "/calendar" },
    { icon: User, label: t("bottomnav.profile"), path: "/profile" },
    { icon: MoreHorizontal, label: t("bottomnav.more"), path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
