import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PlayingCard from "./PlayingCard";
import type { Card } from "@/lib/gameLogic";
import { isBout } from "@/lib/gameLogic";
import { cn } from "@/lib/utils";

interface ChienPanelProps {
  chienCards: Card[];
  handCards: Card[];
  requiredCount: number;
  onConfirm: (ecart: Card[]) => void;
}

export default function ChienPanel({ chienCards, handCards, requiredCount, onConfirm }: ChienPanelProps) {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const cardId = (c: Card) => `${c.type}-${c.suit || ""}-${c.rank}`;

  const allCards = [...handCards, ...chienCards];

  function toggleCard(card: Card) {
    const id = cardId(card);

    // Can't discard bouts
    if (isBout(card)) return;

    // Can't discard kings
    if (card.type === "suit" && card.rank === "R") return;

    const next = new Set(selectedCards);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < requiredCount) {
      next.add(id);
    }
    setSelectedCards(next);
  }

  function isSelected(card: Card) {
    return selectedCards.has(cardId(card));
  }

  function canSelect(card: Card) {
    if (isBout(card)) return false;
    if (card.type === "suit" && card.rank === "R") return false;
    return true;
  }

  const isTrumpInEcart = allCards.some(
    (c) => c.type === "trump" && selectedCards.has(cardId(c))
  );

  const canConfirm = selectedCards.size === requiredCount;

  function handleConfirm() {
    const ecart = allCards.filter((c) => selectedCards.has(cardId(c)));
    onConfirm(ecart);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 max-w-2xl mx-auto space-y-4"
    >
      <h3 className="text-center text-gold font-semibold">Le Chien</h3>

      {/* Chien cards */}
      <div className="flex justify-center gap-2 flex-wrap">
        {chienCards.map((card) => (
          <PlayingCard
            key={cardId(card)}
            card={card}
            size="compact"
            onClick={() => toggleCard(card)}
            selected={isSelected(card)}
            disabled={!canSelect(card)}
          />
        ))}
      </div>

      <div className="h-px bg-white/10" />

      <h4 className="text-center text-sm text-muted-foreground">
        Votre main - Selectionnez {requiredCount} cartes pour l'ecart
      </h4>

      {/* Hand cards */}
      <div className="flex justify-center gap-1 flex-wrap">
        {handCards.map((card) => (
          <PlayingCard
            key={cardId(card)}
            card={card}
            size="compact"
            onClick={() => toggleCard(card)}
            selected={isSelected(card)}
            disabled={!canSelect(card)}
          />
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCards.size}/{requiredCount} selectionnees
        </div>

        {isTrumpInEcart && (
          <div className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
            Attention : atout dans l'ecart (sera visible)
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={cn(
            "btn-primary",
            !canConfirm && "opacity-50 cursor-not-allowed"
          )}
        >
          Confirmer l'ecart
        </Button>
      </div>
    </motion.div>
  );
}
