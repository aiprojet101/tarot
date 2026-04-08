import { Home, Swords, Target, Users, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home,   label: 'Accueil',  path: '/lobby'      },
  { icon: Swords, label: 'Classement', path: '/leaderboard' },
  { icon: Target, label: 'Missions', path: '/missions'    },
  { icon: Users,  label: 'Social',   path: '/social'      },
  { icon: User,   label: 'Profil',   path: '/profile'     },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong gold-border border-t-[1.5px]" style={{ borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div className="flex items-center justify-around py-2.5 px-2 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200",
                active ? "text-accent neon-glow-gold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_hsl(40,80%,55%)]")} />
              <span className={cn("text-[10px] font-medium", active && "font-display text-[9px]")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
