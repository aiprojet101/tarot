import { motion } from "framer-motion";
import type { GameState, RoundResult } from "@/lib/gameLogic";
import { cn } from "@/lib/utils";

interface ScoreBoardProps {
  gameState: GameState;
  roundResult?: RoundResult | null;
  onContinue?: () => void;
}

export default function ScoreBoard({ gameState, roundResult, onContinue }: ScoreBoardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 max-w-lg mx-auto space-y-4"
    >
      <h3 className="text-center text-gold font-semibold text-xl">Scores</h3>

      {/* Cumulative scores */}
      <div className="grid gap-2">
        {gameState.players.map((player, i) => {
          const isTaker = gameState.takerId === player.id;
          const isPartner = gameState.partnerId === player.id;
          const score = gameState.scores[i] || 0;
          return (
            <motion.div
              key={player.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "flex items-center justify-between px-4 py-2 rounded-lg",
                isTaker ? "bg-gold/10 border border-gold/20" : isPartner ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{player.name}</span>
                {isTaker && (
                  <span className="text-[10px] text-gold bg-gold/20 px-1.5 py-0.5 rounded">
                    Preneur
                  </span>
                )}
                {isPartner && (
                  <span className="text-[10px] text-purple-400 bg-purple-400/20 px-1.5 py-0.5 rounded">
                    Partenaire
                  </span>
                )}
              </div>
              <span className={cn(
                "font-bold text-lg",
                score >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {score > 0 ? "+" : ""}{score}
              </span>
            </motion.div>
          );
        })}
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
            <div className="text-right">{roundResult.pointsWon}</div>
            <div className="text-muted-foreground">Objectif ({roundResult.boutsWon} bout{roundResult.boutsWon !== 1 ? 's' : ''})</div>
            <div className="text-right">{roundResult.pointsRequired}</div>
            <div className="text-muted-foreground">Ecart</div>
            <div className={cn(
              "text-right font-medium",
              roundResult.diff >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {roundResult.diff > 0 ? "+" : ""}{roundResult.diff}
            </div>
            <div className="text-muted-foreground">Multiplicateur</div>
            <div className="text-right">x{roundResult.multiplier}</div>
            {roundResult.poigneeBonus !== 0 && (
              <>
                <div className="text-muted-foreground">Bonus poignee</div>
                <div className="text-right text-purple-400">+{roundResult.poigneeBonus}</div>
              </>
            )}
            {roundResult.petitAuBout !== 0 && (
              <>
                <div className="text-muted-foreground">Petit au bout</div>
                <div className="text-right text-gold">{roundResult.petitAuBout > 0 ? "+" : ""}{roundResult.petitAuBout}</div>
              </>
            )}
            {roundResult.chelemBonus !== 0 && (
              <>
                <div className="text-muted-foreground">Chelem</div>
                <div className="text-right text-amber-400">{roundResult.chelemBonus > 0 ? "+" : ""}{roundResult.chelemBonus}</div>
              </>
            )}
            <div className="text-muted-foreground font-semibold border-t border-white/10 pt-1">Resultat</div>
            <div className={cn(
              "text-right font-bold border-t border-white/10 pt-1",
              roundResult.contractMet ? "text-green-400" : "text-red-400"
            )}>
              {roundResult.contractMet ? "Contrat reussi !" : "Chute !"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Game over */}
      {gameState.gameOver && gameState.winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="border-t border-gold/30 pt-4 text-center"
        >
          <div className="text-gold text-lg font-bold">
            Partie terminee !
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {gameState.players.find(p => p.id === gameState.winner)?.name} remporte la partie
          </div>
        </motion.div>
      )}

      {onContinue && !gameState.gameOver && (
        <button
          onClick={onContinue}
          className="w-full btn-primary mt-4"
        >
          Donne suivante
        </button>
      )}

      {gameState.gameOver && (
        <button
          onClick={() => window.location.hash = '#/lobby'}
          className="w-full btn-primary mt-4"
        >
          Retour au lobby
        </button>
      )}
    </motion.div>
  );
}
