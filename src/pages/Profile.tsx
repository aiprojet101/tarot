import { User } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getBotLevel, botLevelLabel } from "@/lib/botLevel";

export default function Profile() {
  const level = getBotLevel();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-20">
      <div className="glass-panel p-8 text-center space-y-4 max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-gold" />
        </div>
        <h1 className="text-2xl text-gold font-bold">Joueur</h1>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between glass-card p-3 rounded-lg">
            <span className="text-muted-foreground">Niveau IA</span>
            <span className="text-gold">{botLevelLabel(level.level)}</span>
          </div>
          <div className="flex justify-between glass-card p-3 rounded-lg">
            <span className="text-muted-foreground">Victoires consecutives</span>
            <span>{level.consecutiveWins}</span>
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Connectez-vous pour sauvegarder vos stats en ligne.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
