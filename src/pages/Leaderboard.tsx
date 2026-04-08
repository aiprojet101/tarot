import { Trophy } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function Leaderboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-20">
      <div className="glass-panel p-8 text-center space-y-4 max-w-sm">
        <Trophy className="w-12 h-12 text-gold mx-auto" />
        <h1 className="text-2xl text-gold font-bold">Classement</h1>
        <p className="text-muted-foreground text-sm">
          Le classement en ligne arrive bientot. Jouez des parties solo pour vous entrainer en attendant !
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
