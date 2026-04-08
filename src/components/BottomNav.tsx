import { NavLink } from "react-router-dom";
import { Home, Gamepad2, Trophy, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/lobby", icon: Home, label: "Accueil" },
  { to: "/game", icon: Gamepad2, label: "Jouer" },
  { to: "/leaderboard", icon: Trophy, label: "Classement" },
  { to: "/profile", icon: User, label: "Profil" },
  { to: "/settings", icon: Settings, label: "Reglages" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 rounded-none">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                isActive
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
