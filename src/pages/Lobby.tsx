import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Settings, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import GameSettingsModal from "@/components/GameSettingsModal";
import { getBotLevel, botLevelLabel } from "@/lib/botLevel";
import type { PlayerCount } from "@/lib/gameLogic";

const SAVE_KEY = "tarot_solo_game";

export default function Lobby() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    playerCount: 4 as PlayerCount,
    difficulty: getBotLevel().level,
    soundEnabled: localStorage.getItem("tarot_audio") !== "false",
    turnAlert: localStorage.getItem("tarot_turn_alert") !== "false",
    scoreLimit: 1000,
  });

  const hasSavedGame = !!localStorage.getItem(SAVE_KEY);

  function startNewGame() {
    localStorage.removeItem(SAVE_KEY);
    navigate("/game");
  }

  function continueGame() {
    navigate("/game");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl text-gold font-bold">Tarot</h1>
          <p className="text-muted-foreground text-sm">Jeu de cartes francais</p>
        </div>

        {/* Stats card */}
        <div className="glass-panel p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Niveau actuel</span>
            <span className="text-gold">{botLevelLabel(getBotLevel().level)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Joueurs</span>
            <span>{settings.playerCount}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={startNewGame}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
          >
            <Play className="w-5 h-5" />
            Nouvelle Partie
          </button>

          {hasSavedGame && (
            <Button
              variant="outline"
              className="w-full"
              onClick={continueGame}
            >
              Continuer la partie
            </Button>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Reglages
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => navigate("/rules")}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Regles
            </Button>
          </div>
        </div>
      </motion.div>

      <GameSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
