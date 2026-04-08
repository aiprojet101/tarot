import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { getBotLevel, resetBotLevel, botLevelLabel } from "@/lib/botLevel";
import { useState } from "react";

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem("tarot_audio") !== "false");
  const [turnAlert, setTurnAlert] = useState(localStorage.getItem("tarot_turn_alert") !== "false");
  const [level, setLevel] = useState(getBotLevel());

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-sm mx-auto space-y-6">
        <h1 className="text-2xl text-gold font-bold text-center">Reglages</h1>

        <div className="glass-panel p-4 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Audio</h2>

          <div className="flex items-center justify-between">
            <label className="text-sm">Sons du jeu</label>
            <Switch
              checked={soundEnabled}
              onCheckedChange={(v) => {
                setSoundEnabled(v);
                localStorage.setItem("tarot_audio", String(v));
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">Alerte de tour</label>
            <Switch
              checked={turnAlert}
              onCheckedChange={(v) => {
                setTurnAlert(v);
                localStorage.setItem("tarot_turn_alert", String(v));
              }}
            />
          </div>
        </div>

        <div className="glass-panel p-4 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Difficulte</h2>

          <div className="flex items-center justify-between">
            <span className="text-sm">Niveau actuel</span>
            <span className="text-gold text-sm font-medium">{botLevelLabel(level.level)}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Le niveau s'ajuste automatiquement selon vos performances (3 victoires = niveau+, 1 defaite = niveau-).
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetBotLevel();
              setLevel(getBotLevel());
            }}
          >
            Reinitialiser le niveau
          </Button>
        </div>

        <div className="glass-panel p-4 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Donnees</h2>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              localStorage.removeItem("tarot_solo_game");
              alert("Partie sauvegardee supprimee");
            }}
          >
            Supprimer la partie en cours
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
