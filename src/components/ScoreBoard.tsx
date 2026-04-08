import { motion } from "framer-motion";
import type { Player, RoundResult } from "@/lib/gameLogic";
import { cn } from "@/lib/utils";

interface ScoreBoardProps {
  players: Player[];
  roundResult?: RoundResult | null;
  onContinue?: () => void;
}

export default function ScoreBoard({ players, roundResult, onContinue }: ScoreBoardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 max-w-lg mx-auto space-y-4"
    >
      <h3 className="text-center text-gold font-semibold text-xl">Scores</h3>

      {/* Cumulative scores */}
      <div className="grid gap-2">
        {players.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex items-center justify-between px-4 py-2 rounded-lg",
              player.isTaker ? "bg-gold/10 border border-gold/20" : "bg-white/5"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{player.name}</span>
              {player.isTaker && (
                <span className="text-[10px] text-gold bg-gold/20 px-1.5 py-0.5 rounded">
                  Preneur
                </span>
              )}
            </div>
            <span className={cn(
              "font-bold text-lg",
              player.score >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {player.score > 0 ? "+" : ""}{player.score}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Round result breakdown */}
      {roundResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-white/10 pt-4 space-y-2"
        >
          <h4 className="text-sm font-semibold text-muted-foreground">Detail de la donne</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Points du preneur</div>
            <div className="text-right">{roundResult.takerPoints}</div>
            <div className="text-muted-foreground">Objectif</div>
            <div className="text-right">{roundResult.targetPoints}</div>
            <div className="text-muted-foreground">Ecart</div>
            <div className={cn(
              "text-right font-medium",
              roundResult.takerPoints >= roundResult.targetPoints ? "text-green-400" : "text-red-400"
            )}>
              {roundResult.takerPoints - roundResult.targetPoints}
            </div>
            <div className="text-muted-foreground">Multiplicateur</div>
            <div className="text-right">x{roundResult.multiplier}</div>
            {roundResult.poigneeBonus !== 0 && (
              <>
                <div className="text-muted-foreground">Bonus poignee</div>
                <div className="text-right text-purple-400">{roundResult.poigneeBonus}</div>
              </>
            )}
            {roundResult.petitAuBoutBonus !== 0 && (
              <>
                <div className="text-muted-foreground">Petit au bout</div>
                <div className="text-right text-gold">{roundResult.petitAuBoutBonus}</div>
              </>
            )}
            <div className="text-muted-foreground font-semibold border-t border-white/10 pt-1">Resultat</div>
            <div className={cn(
              "text-right font-bold border-t border-white/10 pt-1",
              roundResult.takerWon ? "text-green-400" : "text-red-400"
            )}>
              {roundResult.takerWon ? "Contrat reussi" : "Chute"}
            </div>
          </div>
        </motion.div>
      )}

      {onContinue && (
        <button
          onClick={onContinue}
          className="w-full btn-primary mt-4"
        >
          Donne suivante
        </button>
      )}
    </motion.div>
  );
}
