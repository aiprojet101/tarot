import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { BidLevel, Player } from "@/lib/gameLogic";

interface BiddingPanelProps {
  currentHighestBid: BidLevel | null;
  players: Player[];
  currentBidderIndex: number;
  onBid: (bid: BidLevel | null) => void;
  isHumanTurn: boolean;
}

const BID_OPTIONS: { level: BidLevel; label: string; description: string }[] = [
  { level: "petite", label: "Petite", description: "x1" },
  { level: "garde", label: "Garde", description: "x2" },
  { level: "garde_sans", label: "Garde Sans", description: "x4" },
  { level: "garde_contre", label: "Garde Contre", description: "x6" },
];

const BID_HIERARCHY: Record<BidLevel, number> = {
  petite: 1,
  garde: 2,
  garde_sans: 3,
  garde_contre: 4,
};

export default function BiddingPanel({
  currentHighestBid,
  players,
  currentBidderIndex,
  onBid,
  isHumanTurn,
}: BiddingPanelProps) {
  const minBidValue = currentHighestBid ? BID_HIERARCHY[currentHighestBid] : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-panel p-4 max-w-md mx-auto"
      >
        <h3 className="text-center text-gold font-semibold mb-3">Encheres</h3>

        {/* Current bids display */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "px-2 py-1 rounded text-xs",
                i === currentBidderIndex ? "bg-gold/20 text-gold border border-gold/30" : "bg-white/5 text-muted-foreground"
              )}
            >
              <span className="font-medium">{p.name}:</span>{" "}
              {p.currentBid ? p.currentBid : p.hasPassed ? "Passe" : "..."}
            </div>
          ))}
        </div>

        {/* Bid buttons for human */}
        {isHumanTurn && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBid(null)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Passe
            </Button>
            {BID_OPTIONS.map(({ level, label, description }) => {
              const isDisabled = BID_HIERARCHY[level] <= minBidValue;
              return (
                <Button
                  key={level}
                  size="sm"
                  disabled={isDisabled}
                  onClick={() => onBid(level)}
                  className={cn(
                    "transition-all",
                    !isDisabled && "bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30"
                  )}
                  variant="outline"
                >
                  {label}
                  <span className="text-[10px] ml-1 opacity-60">{description}</span>
                </Button>
              );
            })}
          </div>
        )}

        {!isHumanTurn && (
          <div className="text-center text-muted-foreground text-sm animate-pulse">
            {players[currentBidderIndex]?.name} reflechit...
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
