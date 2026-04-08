import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlayingCard from "@/components/PlayingCard";
import BiddingPanel from "@/components/BiddingPanel";
import ChienPanel from "@/components/ChienPanel";
import ScoreBoard from "@/components/ScoreBoard";
import PoigneeModal from "@/components/PoigneeModal";
import { cn } from "@/lib/utils";
import {
  playCardSound,
  playDealSound,
  playWinSound,
  playLoseSound,
  playTurnAlertSound,
  playTrumpSound,
  playPassSound,
  playRoundEndSound,
} from "@/lib/sounds";
import {
  createInitialGameState,
  placeBid,
  handleChien,
  callKing,
  getPlayableCards,
  playCard,
  resolveTrick,
  calculateScore,
  startNewRound,
  sortCards,
  isBout,
  getBotBid,
  getBotPlay,
  getBotEcart,
  canDeclarePoignee,
  SUIT_SYMBOLS,
} from "@/lib/gameLogic";
import type {
  Card,
  Player,
  GameState,
  GamePhase,
  BidLevel,
  Suit,
  Trick,
  RoundResult,
  PlayerCount,
} from "@/lib/gameLogic";

const SAVE_KEY = "tarot_solo_game";
const BOT_DELAY = 800;
const DEAL_DELAY = 1500;
const TRICK_RESOLVE_DELAY = 1200;

// Position layouts
const POSITIONS_4: Record<number, string> = {
  0: "bottom-4 left-1/2 -translate-x-1/2", // human
  1: "left-4 top-1/2 -translate-y-1/2",     // left
  2: "top-4 left-1/2 -translate-x-1/2",     // top
  3: "right-4 top-1/2 -translate-y-1/2",    // right
};

const POSITIONS_5: Record<number, string> = {
  0: "bottom-4 left-1/2 -translate-x-1/2",
  1: "left-4 top-1/2 -translate-y-1/2",
  2: "top-8 left-1/4 -translate-x-1/2",
  3: "top-8 right-1/4 translate-x-1/2",
  4: "right-4 top-1/2 -translate-y-1/2",
};

const NAME_POSITIONS_4: Record<number, string> = {
  0: "bottom-24 left-1/2 -translate-x-1/2",
  1: "left-4 top-[calc(50%-80px)]",
  2: "top-20 left-1/2 -translate-x-1/2",
  3: "right-4 top-[calc(50%-80px)]",
};

const NAME_POSITIONS_5: Record<number, string> = {
  0: "bottom-24 left-1/2 -translate-x-1/2",
  1: "left-4 top-[calc(50%-80px)]",
  2: "top-24 left-1/4 -translate-x-1/2",
  3: "top-24 right-1/4 translate-x-1/2",
  4: "right-4 top-[calc(50%-80px)]",
};

const TRICK_CARD_POS_4: Record<number, string> = {
  0: "bottom-0 left-1/2 -translate-x-1/2",
  1: "-left-16 top-1/2 -translate-y-1/2",
  2: "top-0 left-1/2 -translate-x-1/2",
  3: "-right-16 top-1/2 -translate-y-1/2",
};

const TRICK_CARD_POS_5: Record<number, string> = {
  0: "bottom-0 left-1/2 -translate-x-1/2",
  1: "-left-16 top-1/2 -translate-y-1/2",
  2: "top-0 left-1/3",
  3: "top-0 right-1/3",
  4: "-right-16 top-1/2 -translate-y-1/2",
};

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveGame(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {}
}

export default function GameTable() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showPoignee, setShowPoignee] = useState(false);
  const [poigneeData, setPoigneeData] = useState<{
    trumps: Card[];
    type: "simple" | "double" | "triple";
    bonus: number;
  } | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize or load game
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setGameState(saved);
    }
  }, []);

  // Auto-save
  useEffect(() => {
    if (gameState) saveGame(gameState);
  }, [gameState]);

  // Start new game
  const startGame = useCallback((playerCount: PlayerCount = 4, difficulty: 1 | 2 | 3 = 1) => {
    const state = createInitialGameState(playerCount, difficulty);
    setGameState(state);
    setRoundResult(null);
    playDealSound(playerCount === 4 ? 18 : 15, 1200);
  }, []);

  // Bot logic
  useEffect(() => {
    if (!gameState || isProcessing) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isBot) return;

    const phase = gameState.phase;

    if (phase === "bidding") {
      botTimerRef.current = setTimeout(() => {
        const bid = getBotBid(gameState, gameState.currentPlayerIndex);
        if (bid) {
          playCardSound();
        } else {
          playPassSound();
        }
        const newState = placeBid(gameState, gameState.currentPlayerIndex, bid);
        setGameState(newState);
      }, BOT_DELAY);
    }

    if (phase === "chien" && currentPlayer.isTaker) {
      botTimerRef.current = setTimeout(() => {
        const ecart = getBotEcart(gameState, gameState.currentPlayerIndex);
        const newState = handleChien(gameState, ecart);
        setGameState(newState);
      }, BOT_DELAY);
    }

    if (phase === "playing") {
      botTimerRef.current = setTimeout(() => {
        const card = getBotPlay(gameState, gameState.currentPlayerIndex);
        if (card.type === "trump") {
          playTrumpSound();
        } else {
          playCardSound();
        }
        const newState = playCard(gameState, gameState.currentPlayerIndex, card);

        // Check if trick is complete
        if (newState.currentTrick && newState.currentTrick.cards.length === gameState.players.length) {
          setIsProcessing(true);
          setTimeout(() => {
            const resolved = resolveTrick(newState);

            // Check if round is over
            if (resolved.players[0].hand.length === 0) {
              playRoundEndSound();
              const result = calculateScore(resolved);
              setRoundResult(result);
              if (result.takerWon) playWinSound();
              else playLoseSound();
              const scored = { ...resolved, phase: "scoring" as GamePhase };
              setGameState(scored);
            } else {
              setGameState(resolved);
            }
            setIsProcessing(false);
          }, TRICK_RESOLVE_DELAY);
        } else {
          setGameState(newState);
        }
      }, BOT_DELAY);
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [gameState, isProcessing]);

  // Human actions
  const handleHumanBid = useCallback((bid: BidLevel | null) => {
    if (!gameState) return;
    if (bid) playCardSound();
    else playPassSound();
    const newState = placeBid(gameState, 0, bid);
    setGameState(newState);
  }, [gameState]);

  const handleHumanChien = useCallback((ecart: Card[]) => {
    if (!gameState) return;
    const newState = handleChien(gameState, ecart);
    setGameState(newState);
  }, [gameState]);

  const handleHumanPlay = useCallback((card: Card) => {
    if (!gameState || gameState.currentPlayerIndex !== 0 || isProcessing) return;

    const playable = getPlayableCards(gameState, 0);
    const isPlayable = playable.some(
      (c) => c.type === card.type && c.rank === card.rank && c.suit === card.suit
    );
    if (!isPlayable) return;

    // Check poignee before first card
    if (gameState.players[0].hand.length === (gameState.playerCount === 4 ? 18 : 15)) {
      const poignee = canDeclarePoignee(gameState, 0);
      if (poignee && !showPoignee) {
        setPoigneeData({
          trumps: poignee.trumps,
          type: poignee.type,
          bonus: poignee.bonus,
        });
        setShowPoignee(true);
        return;
      }
    }

    if (card.type === "trump") playTrumpSound();
    else playCardSound();

    const newState = playCard(gameState, 0, card);

    // Check trick completion
    if (newState.currentTrick && newState.currentTrick.cards.length === gameState.players.length) {
      setIsProcessing(true);
      setTimeout(() => {
        const resolved = resolveTrick(newState);
        if (resolved.players[0].hand.length === 0) {
          playRoundEndSound();
          const result = calculateScore(resolved);
          setRoundResult(result);
          if (result.takerWon) playWinSound();
          else playLoseSound();
          setGameState({ ...resolved, phase: "scoring" as GamePhase });
        } else {
          setGameState(resolved);
        }
        setIsProcessing(false);
      }, TRICK_RESOLVE_DELAY);
    } else {
      setGameState(newState);
    }
  }, [gameState, isProcessing, showPoignee]);

  const handlePoigneeDeclare = useCallback(() => {
    setShowPoignee(false);
    // Poignee is declared, continue with play
  }, []);

  const handlePoigneeSkip = useCallback(() => {
    setShowPoignee(false);
  }, []);

  const handleNextRound = useCallback(() => {
    if (!gameState) return;
    const newState = startNewRound(gameState);
    setGameState(newState);
    setRoundResult(null);
    playDealSound(gameState.playerCount === 4 ? 18 : 15, 1200);
  }, [gameState]);

  const handleCallKing = useCallback((suit: Suit) => {
    if (!gameState) return;
    const newState = callKing(gameState, suit);
    setGameState(newState);
  }, [gameState]);

  // If no game, show start screen
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 text-center space-y-6 max-w-sm">
          <h2 className="text-2xl text-gold font-bold">Tarot</h2>
          <p className="text-muted-foreground text-sm">Choisissez le nombre de joueurs</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => startGame(4)} className="btn-primary">
              4 Joueurs
            </button>
            <button onClick={() => startGame(5)} className="btn-primary">
              5 Joueurs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const positions = gameState.playerCount === 5 ? POSITIONS_5 : POSITIONS_4;
  const namePositions = gameState.playerCount === 5 ? NAME_POSITIONS_5 : NAME_POSITIONS_4;
  const trickPositions = gameState.playerCount === 5 ? TRICK_CARD_POS_5 : TRICK_CARD_POS_4;
  const humanPlayer = gameState.players[0];
  const playableCards = gameState.phase === "playing" && gameState.currentPlayerIndex === 0
    ? getPlayableCards(gameState, 0)
    : [];

  const isCardPlayable = (card: Card) =>
    playableCards.some((c) => c.type === card.type && c.rank === card.rank && c.suit === card.suit);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Table felt */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f1528] to-[#0a0e1a]" />

      {/* Player name labels */}
      {gameState.players.map((player, i) => (
        <div
          key={player.id}
          className={cn(
            "absolute z-10 text-center",
            namePositions[i]
          )}
        >
          <div className={cn(
            "px-3 py-1 rounded-lg text-xs font-medium",
            gameState.currentPlayerIndex === i ? "bg-gold/20 text-gold border border-gold/30" : "bg-white/5 text-muted-foreground",
            player.isTaker && "ring-1 ring-gold/40"
          )}>
            {player.name}
            {player.isTaker && <span className="ml-1 text-[10px] text-gold">P</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {player.score > 0 ? "+" : ""}{player.score}
          </div>
        </div>
      ))}

      {/* Bot cards (face down) */}
      {gameState.players.slice(1).map((player, idx) => {
        const i = idx + 1;
        const isVertical = (gameState.playerCount === 4 && (i === 1 || i === 3)) ||
                           (gameState.playerCount === 5 && (i === 1 || i === 4));
        return (
          <div
            key={player.id}
            className={cn("absolute z-10", positions[i])}
          >
            <div className={cn(
              "flex gap-0.5",
              isVertical ? "flex-col" : "flex-row"
            )}>
              {Array.from({ length: Math.min(player.hand.length, 6) }).map((_, ci) => (
                <PlayingCard
                  key={ci}
                  card={{ type: "suit", suit: "spades", rank: "1" } as Card}
                  faceDown
                  size="small"
                />
              ))}
              {player.hand.length > 6 && (
                <span className="text-[10px] text-muted-foreground self-center ml-1">
                  +{player.hand.length - 6}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Current trick in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 z-20">
        <AnimatePresence>
          {gameState.currentTrick?.cards.map(({ card, playerIndex }) => (
            <motion.div
              key={`${card.type}-${card.suit}-${card.rank}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={cn("absolute", trickPositions[playerIndex])}
            >
              <PlayingCard card={card} size="compact" disabled />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Human player's hand */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30">
        <div className="flex gap-0.5 justify-center" style={{ marginLeft: -humanPlayer.hand.length * 2 }}>
          {sortCards(humanPlayer.hand).map((card, i) => {
            const playable = isCardPlayable(card);
            return (
              <div
                key={`${card.type}-${card.suit}-${card.rank}`}
                style={{ marginLeft: i > 0 ? -16 : 0, zIndex: i }}
                className="relative"
              >
                <PlayingCard
                  card={card}
                  size="compact"
                  onClick={() => handleHumanPlay(card)}
                  disabled={gameState.phase !== "playing" || gameState.currentPlayerIndex !== 0 || !playable || isProcessing}
                  selected={false}
                />
                {gameState.phase === "playing" && gameState.currentPlayerIndex === 0 && !playable && (
                  <div className="absolute inset-0 bg-black/40 rounded-lg pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase-specific UI */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-xl px-4">
        {/* Dealing phase */}
        {gameState.phase === "dealing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-gold text-xl font-bold animate-pulse">Distribution...</div>
          </motion.div>
        )}

        {/* Bidding phase */}
        {gameState.phase === "bidding" && (
          <BiddingPanel
            currentHighestBid={gameState.currentBid}
            players={gameState.players}
            currentBidderIndex={gameState.currentPlayerIndex}
            onBid={handleHumanBid}
            isHumanTurn={gameState.currentPlayerIndex === 0}
          />
        )}

        {/* Chien phase */}
        {gameState.phase === "chien" && gameState.players[0].isTaker && (
          <ChienPanel
            chienCards={gameState.chien}
            handCards={humanPlayer.hand}
            requiredCount={gameState.playerCount === 5 ? 3 : 6}
            onConfirm={handleHumanChien}
          />
        )}

        {/* Calling phase (5 players) */}
        {gameState.phase === "calling" && gameState.currentPlayerIndex === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 text-center space-y-3"
          >
            <h3 className="text-gold font-semibold">Appeler un Roi</h3>
            <p className="text-sm text-muted-foreground">Choisissez la couleur du roi a appeler</p>
            <div className="flex gap-3 justify-center">
              {(["spades", "hearts", "diamonds", "clubs"] as Suit[]).map((suit) => (
                <button
                  key={suit}
                  onClick={() => handleCallKing(suit)}
                  className={cn(
                    "w-14 h-14 rounded-lg text-2xl border transition-all hover:scale-110",
                    (suit === "hearts" || suit === "diamonds")
                      ? "border-red-500/30 hover:bg-red-500/10 text-red-500"
                      : "border-white/20 hover:bg-white/5 text-white"
                  )}
                >
                  {SUIT_SYMBOLS[suit]}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Turn indicator during play */}
        {gameState.phase === "playing" && gameState.currentPlayerIndex === 0 && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center pointer-events-none"
          >
            <span className="text-gold text-sm animate-pulse-glow">A vous de jouer</span>
          </motion.div>
        )}

        {/* Scoring phase */}
        {gameState.phase === "scoring" && (
          <ScoreBoard
            players={gameState.players}
            roundResult={roundResult}
            onContinue={handleNextRound}
          />
        )}

        {/* All passed - no taker */}
        {gameState.phase === "allPassed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-6 text-center space-y-4"
          >
            <h3 className="text-xl text-muted-foreground">Tout le monde a passe</h3>
            <p className="text-sm text-muted-foreground">Nouvelle distribution...</p>
            <button onClick={handleNextRound} className="btn-primary">
              Redistribuer
            </button>
          </motion.div>
        )}
      </div>

      {/* Poignee modal */}
      {poigneeData && (
        <PoigneeModal
          open={showPoignee}
          trumps={poigneeData.trumps}
          poigneeType={poigneeData.type}
          bonusValue={poigneeData.bonus}
          onDeclare={handlePoigneeDeclare}
          onSkip={handlePoigneeSkip}
        />
      )}

      {/* Round info bar */}
      <div className="absolute top-2 left-2 z-50">
        <div className="glass-card px-3 py-1.5 text-xs text-muted-foreground space-y-0.5">
          <div>Donne {gameState.roundNumber}</div>
          {gameState.currentBid && (
            <div className="text-gold">{gameState.currentBid}</div>
          )}
        </div>
      </div>
    </div>
  );
}
