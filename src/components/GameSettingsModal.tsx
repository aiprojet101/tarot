import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { PlayerCount } from "@/lib/gameLogic";

interface GameSettings {
  playerCount: PlayerCount;
  difficulty: 1 | 2 | 3;
  soundEnabled: boolean;
  turnAlert: boolean;
  scoreLimit: number;
}

interface GameSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

export default function GameSettingsModal({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: GameSettingsModalProps) {
  const update = (partial: Partial<GameSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-gold">Parametres de partie</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player count */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Nombre de joueurs</label>
            <Select
              value={String(settings.playerCount)}
              onValueChange={(v) => update({ playerCount: Number(v) as PlayerCount })}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Difficulte</label>
            <Select
              value={String(settings.difficulty)}
              onValueChange={(v) => update({ difficulty: Number(v) as 1 | 2 | 3 })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Debutant</SelectItem>
                <SelectItem value="2">Intermediaire</SelectItem>
                <SelectItem value="3">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Sound */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Sons</label>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(v) => {
                update({ soundEnabled: v });
                localStorage.setItem("tarot_audio", String(v));
              }}
            />
          </div>

          {/* Turn alert */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Alerte de tour</label>
            <Switch
              checked={settings.turnAlert}
              onCheckedChange={(v) => {
                update({ turnAlert: v });
                localStorage.setItem("tarot_turn_alert", String(v));
              }}
            />
          </div>

          <Separator />

          {/* Score limit */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Limite de score</label>
            <Select
              value={String(settings.scoreLimit)}
              onValueChange={(v) => update({ scoreLimit: Number(v) })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
                <SelectItem value="2000">2000</SelectItem>
                <SelectItem value="0">Illimite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
