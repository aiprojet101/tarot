import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Card, CardType, Suit } from "@/lib/gameLogic";
import { isBout, SUIT_SYMBOLS, SUIT_COLORS } from "@/lib/gameLogic";

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  size?: "small" | "compact" | "full";
  faceDown?: boolean;
}

const sizeClasses = {
  small: "w-10 h-14 text-[10px]",
  compact: "w-14 h-20 text-xs",
  full: "w-20 h-28 text-sm",
};

function getSuitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit] || "?";
}

function getSuitColor(suit: Suit): string {
  return SUIT_COLORS[suit] || "text-white";
}

function CardBack({ size }: { size: "small" | "compact" | "full" }) {
  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-lg relative overflow-hidden card-shadow",
        "bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950",
        "border border-purple-500/30"
      )}
    >
      <div className="absolute inset-1 rounded border border-gold/20 stars-pattern" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-gold/40 text-lg">&#x2726;</div>
      </div>
    </div>
  );
}

function SuitCard({ card, size }: { card: Card; size: "small" | "compact" | "full" }) {
  const symbol = getSuitSymbol(card.suit!);
  const colorClass = getSuitColor(card.suit!);
  const label = card.rank || "";

  return (
    <>
      <div className={cn("absolute top-1 left-1 flex flex-col items-center leading-none font-bold", colorClass)}>
        <span>{label}</span>
        <span className={size === "small" ? "text-[8px]" : "text-xs"}>{symbol}</span>
      </div>
      <div className={cn("absolute bottom-1 right-1 flex flex-col items-center leading-none font-bold rotate-180", colorClass)}>
        <span>{label}</span>
        <span className={size === "small" ? "text-[8px]" : "text-xs"}>{symbol}</span>
      </div>
      <div className={cn("absolute inset-0 flex items-center justify-center", colorClass)}>
        <span className={size === "full" ? "text-2xl" : size === "compact" ? "text-xl" : "text-base"}>
          {symbol}
        </span>
      </div>
    </>
  );
}

function TrumpCard({ card, size }: { card: Card; size: "small" | "compact" | "full" }) {
  const isBoutCard = isBout(card);
  return (
    <>
      <div className="absolute top-1 left-1 flex flex-col items-center leading-none font-bold text-gold">
        <span>{card.rank}</span>
        <span className={size === "small" ? "text-[6px]" : "text-[8px]"}>&#x2605;</span>
      </div>
      <div className="absolute bottom-1 right-1 flex flex-col items-center leading-none font-bold rotate-180 text-gold">
        <span>{card.rank}</span>
        <span className={size === "small" ? "text-[6px]" : "text-[8px]"}>&#x2605;</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className={cn(
            "font-bold",
            isBoutCard ? "text-purple-300" : "text-gold",
            size === "full" ? "text-2xl" : size === "compact" ? "text-xl" : "text-base"
          )}>
            {card.rank}
          </span>
          <span className={cn("text-gold/60", size === "small" ? "text-[6px]" : "text-[8px]")}>
            ATOUT
          </span>
        </div>
      </div>
    </>
  );
}

function ExcuseCard({ size }: { size: "small" | "compact" | "full" }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <span className={cn(
          "text-purple-300",
          size === "full" ? "text-2xl" : size === "compact" ? "text-lg" : "text-sm"
        )}>
          &#x2606;
        </span>
        <span className={cn(
          "font-bold text-purple-200",
          size === "full" ? "text-xs" : "text-[8px]"
        )}>
          EXCUSE
        </span>
      </div>
    </div>
  );
}

export default function PlayingCard({
  card,
  onClick,
  disabled = false,
  selected = false,
  size = "full",
  faceDown = false,
}: PlayingCardProps) {
  if (faceDown) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <CardBack size={size} />
      </motion.div>
    );
  }

  const isBoutCard = isBout(card);
  const isTrump = card.type === "trump";
  const isExcuse = card.type === "excuse";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: selected ? -12 : 0,
      }}
      whileHover={!disabled ? { y: -6, scale: 1.05 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        sizeClasses[size],
        "rounded-lg relative overflow-hidden cursor-pointer select-none transition-shadow",
        "bg-gradient-to-br from-gray-100 to-gray-200",
        disabled && "opacity-50 cursor-not-allowed",
        selected && "ring-2 ring-gold",
        isTrump && !isExcuse && "trump-border",
        isBoutCard && "bout-border",
        isExcuse && "border-2 border-purple-400/50",
        !isTrump && !isExcuse && "border border-gray-300/50",
        "card-shadow hover:card-shadow-hover"
      )}
    >
      {card.type === "suit" && <SuitCard card={card} size={size} />}
      {card.type === "trump" && <TrumpCard card={card} size={size} />}
      {card.type === "excuse" && <ExcuseCard size={size} />}
    </motion.div>
  );
}
