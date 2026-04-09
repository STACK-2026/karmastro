import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
}

const AppHeader = ({ title = "Karmastro", subtitle, showBack = false, rightContent }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <header
        className="fixed z-50 flex items-center justify-between"
        style={{
          top: 8, left: 8, right: 8,
          height: 56,
          padding: "0 16px",
          background: "rgba(10, 10, 15, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.12)",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            {!showBack && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary">
                <span className="text-white text-xs font-bold font-serif">K</span>
              </div>
            )}
            <div>
              <span className="font-serif text-lg font-bold text-foreground leading-tight block">{title}</span>
              {subtitle && <span className="text-[11px] text-muted-foreground leading-tight block">{subtitle}</span>}
            </div>
          </div>
        </div>

        {rightContent && (
          <div className="flex items-center gap-2">{rightContent}</div>
        )}
      </header>
      {/* Spacer */}
      <div className="h-[72px]" />
    </>
  );
};

export default AppHeader;
