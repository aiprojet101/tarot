import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Settings, Clock, ArrowLeftRight } from 'lucide-react';
import GameSettingsModal, { loadGameSettings, GameSettings } from '@/components/GameSettingsModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import PaywallModal from '@/components/PaywallModal';
import { createNotification } from '@/hooks/useNotifications';
import PlayingCard from '@/components/PlayingCard';
import {
  Card, GameState, GamePhase, BidLevel, Suit, PlayerCount, Difficulty, RoundResult,
  createInitialGameState, placeBid, handleChien, callKing, getPlayableCards, playCard,
  sortCards, isBout, getCardValue, getBotBid, getBotPlay, getBotEcart, startNewRound,
  canDeclarePoignee, SUIT_SYMBOLS, SUIT_COLORS, SUIT_NAMES,
} from '@/lib/gameLogic';
import { getBotLevel, recordBotResult, botLevelLabel } from '@/lib/botLevel';
import { playCardSound, playDealSound, playWinSound, playLoseSound, playTurnAlertSound, playTrumpSound } from '@/lib/sounds';
import {
  DndContext, closestCenter, DragEndEvent,
  TouchSensor, MouseSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BID_LABELS: Record<BidLevel, string> = {
  passe: 'Passe', petite: 'Petite', garde: 'Garde',
  garde_sans: 'Garde Sans', garde_contre: 'Garde Contre',
};

const BID_COLORS: Record<BidLevel, string> = {
  passe: '#94a3b8', petite: '#4ade80', garde: '#fbbf24',
  garde_sans: '#f97316', garde_contre: '#ef4444',
};

const THROW_ORIGINS_4 = [
  { x: 0,    y: 200,  rotate: -6  },
  { x: -140, y: 30,   rotate: 20  },
  { x: 0,    y: -140, rotate: -14 },
  { x: 140,  y: 30,   rotate: -20 },
];

const THROW_ORIGINS_5 = [
  { x: 0,    y: 200,  rotate: -6  },
  { x: -150, y: 80,   rotate: 16  },
  { x: -90,  y: -130, rotate: -10 },
  { x: 90,   y: -130, rotate: 10  },
  { x: 150,  y: 80,   rotate: -16 },
];

// -- Sortable card --
function SortableCard({
  card, index, selected, onClick, sortMode, playable, compact = true,
}: {
  card: Card; index: number; selected: boolean; onClick: () => void;
  sortMode: boolean; playable: boolean; compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style: React.CSSProperties = {
    marginLeft: index > 0 ? (compact ? '-39px' : '-54px') : '0',
    zIndex: isDragging ? 999 : index,
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: !sortMode && !playable ? 0.45 : 1,
    cursor: sortMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    touchAction: sortMode ? 'none' : 'auto',
  };
  const cardTranslate = isDragging
    ? 'translateY(-14px) scale(1.06)'
    : !sortMode && selected
    ? 'translateY(-12px)'
    : 'none';

  return (
    <div ref={setNodeRef} style={style} {...(sortMode ? { ...attributes, ...listeners } : {})}>
      <div style={{
        transform: isDragging ? `${cardTranslate} translateY(-8px) scale(1.08)` : cardTranslate,
        transition: 'transform 0.15s ease',
        borderRadius: 9,
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? '0 14px 32px rgba(0,0,0,0.7), 0 0 0 2px rgba(245,200,66,1)' : 'none',
      }}>
        <PlayingCard
          card={card}
          selected={!sortMode && selected}
          onClick={sortMode ? undefined : onClick}
          compact={compact}
          highlight={!sortMode && playable && !selected}
        />
      </div>
    </div>
  );
}

// -- Player slot --
function PlayerSlot({ player, isActive, justPlayed, isTaker, isPartner, score, isFounder = false }: {
  player: any; isActive: boolean; justPlayed: boolean; isTaker: boolean; isPartner: boolean; score: number; isFounder?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        animate={isActive ? { scale: [1, 1.07, 1] } : { scale: 1 }}
        transition={{ duration: 1.1, repeat: isActive ? Infinity : 0 }}
        className="relative"
      >
        {isFounder && (
          <motion.div animate={{ y: [0, -2, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg z-10 select-none">
            {''}
          </motion.div>
        )}
        <AnimatePresence>
          {justPlayed && (
            <motion.div key="burst" initial={{ scale: 1, opacity: 1 }} animate={{ scale: 2.6, opacity: 0 }} exit={{}}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: '2px solid #f5c842', boxShadow: '0 0 16px rgba(245,200,66,0.9)' }} />
          )}
        </AnimatePresence>
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center text-2xl
          bg-gradient-to-br from-[#1a2e20] to-[#0d1a11] transition-all duration-500
          ${isTaker
            ? 'border-2 border-red-400 shadow-[0_0_18px_rgba(248,113,113,0.7),0_0_35px_rgba(248,113,113,0.3)]'
            : isPartner
              ? 'border-2 border-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.7),0_0_35px_rgba(96,165,250,0.3)]'
              : isActive
                ? 'border-2 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.7),0_0_35px_rgba(251,191,36,0.3)]'
                : 'border-2 border-emerald-900 shadow-[0_2px_12px_rgba(0,0,0,0.6)]'
          }
        `}>
          {player.avatar === 'user' ? '🧑' : player.avatar === 'bot1' ? '🤖' : player.avatar === 'bot2' ? '🤖' : player.avatar === 'bot3' ? '🤖' : '🤖'}
        </div>
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border border-[#071a0f] animate-pulse" />
        )}
      </motion.div>
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-semibold text-slate-300 tracking-wide">{player.name}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-400">{player.cards.length} cartes</span>
        {isTaker && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold uppercase tracking-wider">Preneur</span>}
        {isPartner && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider">Appele</span>}
      </div>
      <span className="font-display text-[13px] font-bold" style={{ color: score >= 0 ? '#4ade80' : '#f87171' }}>{score}</span>
    </div>
  );
}

const SOLO_SAVE_KEY = 'tarot_solo_game';

// -- GameTable --
export default function GameTable() {
  const { user, profile, refreshProfile } = useAuth();
  const isFounder = !!profile?.is_founder;
  const difficulty: Difficulty = 'normal';
  const playerCount: PlayerCount = 4;

  const isRestoringRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(SOLO_SAVE_KEY);
      if (raw) {
        const { gs, ts } = JSON.parse(raw);
        if (gs && ts && Date.now() - ts < 4 * 60 * 60 * 1000 && !gs.gameOver) {
          isRestoringRef.current = true;
          return gs as GameState;
        }
      }
    } catch {}
    return createInitialGameState(playerCount, difficulty);
  });

  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [ecartSelection, setEcartSelection] = useState<Card[]>([]);
  const [timer, setTimer] = useState(30);
  const [sortMode, setSortMode] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [isDealing, setIsDealing] = useState(true);
  const [justPlayedIdx, setJustPlayedIdx] = useState<number | null>(null);
  const [showBossAnnounce, setShowBossAnnounce] = useState(false);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(loadGameSettings);
  const [showPaywall, setShowPaywall] = useState(false);
  const [bidAnimations, setBidAnimations] = useState<{ playerId: string; bid: BidLevel; key: number }[]>([]);

  const myPlayer = gameState.players[0];
  const isMyTurn = gameState.currentPlayerIndex === 0;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const bidAnimKey = useRef(0);

  // Sync card order when hand changes
  const cardIds = myPlayer.cards.map(c => c.id).join(',');
  useEffect(() => {
    setCardOrder(prev => {
      const existing = prev.filter(id => myPlayer.cards.some(c => c.id === id));
      const newCards = myPlayer.cards.filter(c => !prev.includes(c.id)).map(c => c.id);
      return [...existing, ...newCards];
    });
  }, [cardIds]);

  const orderedCards = cardOrder
    .map(id => myPlayer.cards.find(c => c.id === id))
    .filter(Boolean) as Card[];

  // Drag sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
  );
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder(prev => arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string)));
    }
  };

  // localStorage persistence
  useEffect(() => {
    if (gameState.gameOver) {
      localStorage.removeItem(SOLO_SAVE_KEY);
    } else {
      localStorage.setItem(SOLO_SAVE_KEY, JSON.stringify({ gs: gameState, ts: Date.now() }));
    }
  }, [gameState]);

  // Boss announce
  useEffect(() => {
    if (!isRestoringRef.current && isFounder) {
      setShowBossAnnounce(true);
      const t = setTimeout(() => setShowBossAnnounce(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isFounder]);

  // Deal animation
  useEffect(() => {
    if (isRestoringRef.current) { setIsDealing(false); return; }
    const cardCount = myPlayer.cards.length;
    const dealDuration = cardCount * 120 + 900;
    playDealSound(cardCount, cardCount * 120);
    const t = setTimeout(() => setIsDealing(false), dealDuration);
    return () => clearTimeout(t);
  }, []);

  // Timer
  useEffect(() => { setTimer(30); }, [gameState.currentPlayerIndex]);
  useEffect(() => {
    if (gameState.gameOver || gameState.phase !== 'playing') return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          // Auto-play on timeout
          const s = gameStateRef.current;
          if (s.phase !== 'playing' || s.gameOver) return 30;
          const pi = s.currentPlayerIndex;
          const playable = getPlayableCards(s, pi);
          if (playable.length > 0) {
            const card = getBotPlay(s, pi);
            const result = playCard(s, pi, card);
            setGameState(result);
          }
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.gameOver, gameState.phase]);

  // Turn alert
  useEffect(() => {
    if (!isMyTurn || gameState.gameOver || isRestoringRef.current) return;
    if (gameState.phase === 'playing' || gameState.phase === 'bidding') {
      playTurnAlertSound();
      try {
        const gs = JSON.parse(localStorage.getItem('tarot_game_settings') || '{}');
        if (gs.haptic !== false && navigator.vibrate) navigator.vibrate([80, 40, 80]);
      } catch {}
    }
  }, [isMyTurn, gameState.phase, gameState.gameOver]);

  // Bot bidding
  useEffect(() => {
    if (isDealing || gameState.phase !== 'bidding' || gameState.gameOver || isMyTurn) return;
    const delay = 1200 + Math.random() * 800;
    const timeout = setTimeout(() => {
      const s = gameStateRef.current;
      if (s.phase !== 'bidding') return;
      const pi = s.currentPlayerIndex;
      if (pi === 0) return;
      const bid = getBotBid(s, pi);
      bidAnimKey.current++;
      setBidAnimations(prev => [...prev, { playerId: s.players[pi].id, bid, key: bidAnimKey.current }]);
      setTimeout(() => {
        const ns = placeBid(gameStateRef.current, gameStateRef.current.players[pi].id, bid);
        setGameState(ns);
      }, 600);
    }, delay);
    return () => clearTimeout(timeout);
  }, [gameState.currentPlayerIndex, gameState.phase, isDealing, gameState.gameOver]);

  // Bot chien (ecart)
  useEffect(() => {
    if (gameState.phase !== 'chien' || gameState.gameOver) return;
    const takerIdx = gameState.players.findIndex(p => p.id === gameState.takerId);
    if (takerIdx === 0) return; // human handles chien
    const delay = 1500 + Math.random() * 1000;
    const timeout = setTimeout(() => {
      const s = gameStateRef.current;
      if (s.phase !== 'chien') return;
      const ecart = getBotEcart(s, takerIdx);
      const ns = handleChien(s, ecart);
      setGameState(ns);
    }, delay);
    return () => clearTimeout(timeout);
  }, [gameState.phase, gameState.takerId, gameState.gameOver]);

  // Bot calling (5 players)
  useEffect(() => {
    if (gameState.phase !== 'calling' || gameState.gameOver) return;
    const takerIdx = gameState.players.findIndex(p => p.id === gameState.takerId);
    if (takerIdx === 0) return;
    const delay = 1000 + Math.random() * 600;
    const timeout = setTimeout(() => {
      const s = gameStateRef.current;
      if (s.phase !== 'calling') return;
      const takerCards = s.players[takerIdx].cards;
      const suits: Suit[] = ['hearts', 'spades', 'diamonds', 'clubs'];
      for (const suit of suits) {
        if (!takerCards.some(c => c.type === 'suit' && c.suit === suit && c.rank === 'R')) {
          const ns = callKing(s, suit);
          setGameState(ns);
          return;
        }
      }
      // Fallback: call hearts
      setGameState(callKing(s, 'hearts'));
    }, delay);
    return () => clearTimeout(timeout);
  }, [gameState.phase, gameState.takerId, gameState.gameOver]);

  // Bot play
  useEffect(() => {
    if (isDealing || gameState.phase !== 'playing' || gameState.gameOver || isMyTurn) return;
    const delay = 1400 + Math.random() * 1000;
    const timeout = setTimeout(() => {
      const s = gameStateRef.current;
      if (s.phase !== 'playing' || s.currentPlayerIndex === 0) return;
      const pi = s.currentPlayerIndex;
      const card = getBotPlay(s, pi);
      setTimeout(() => playCardSound(), 300);
      setJustPlayedIdx(pi);
      setTimeout(() => setJustPlayedIdx(null), 600);
      const ns = playCard(s, pi, card);
      setGameState(ns);
    }, delay);
    return () => clearTimeout(timeout);
  }, [gameState.currentPlayerIndex, gameState.phase, gameState.gameOver, isDealing]);

  // End game
  useEffect(() => {
    if (!gameState.gameOver) return;
    const playerWon = gameState.winner === gameState.players[0]?.id;
    setTimeout(() => { playerWon ? playWinSound() : playLoseSound(); }, 300);
  }, [gameState.gameOver]);

  // -- Handlers --
  const handleBid = (bid: BidLevel) => {
    if (!isMyTurn || gameState.phase !== 'bidding') return;
    bidAnimKey.current++;
    setBidAnimations(prev => [...prev, { playerId: myPlayer.id, bid, key: bidAnimKey.current }]);
    setTimeout(() => {
      const ns = placeBid(gameStateRef.current, myPlayer.id, bid);
      setGameState(ns);
    }, 400);
  };

  const handlePlayCard = (card: Card) => {
    if (!isMyTurn || gameState.phase !== 'playing' || sortMode) return;
    const playable = getPlayableCards(gameState, 0);
    if (!playable.some(c => c.id === card.id)) return;
    setTimeout(() => playCardSound(), 300);
    setJustPlayedIdx(0);
    setTimeout(() => setJustPlayedIdx(null), 600);
    const ns = playCard(gameState, 0, card);
    setGameState(ns);
    setSelectedCards([]);
  };

  const toggleEcartCard = (card: Card) => {
    setEcartSelection(prev =>
      prev.some(c => c.id === card.id) ? prev.filter(c => c.id !== card.id) : [...prev, card]
    );
  };

  const handleConfirmEcart = () => {
    const expectedSize = gameState.playerCount === 4 ? 6 : 3;
    if (ecartSelection.length !== expectedSize) return;
    const ns = handleChien(gameState, ecartSelection);
    setGameState(ns);
    setEcartSelection([]);
  };

  const handleCallKing = (suit: Suit) => {
    if (!isMyTurn || gameState.phase !== 'calling') return;
    const ns = callKing(gameState, suit);
    setGameState(ns);
  };

  const handleNewRound = () => {
    const ns = startNewRound(gameState);
    setGameState(ns);
    setSelectedCards([]);
    setEcartSelection([]);
    setBidAnimations([]);
    setIsDealing(true);
    setTimeout(() => setIsDealing(false), 2500);
  };

  const handleRestart = () => {
    const ns = createInitialGameState(playerCount, difficulty);
    setGameState(ns);
    setSelectedCards([]);
    setEcartSelection([]);
    setBidAnimations([]);
    setIsDealing(true);
    setTimeout(() => setIsDealing(false), 2500);
  };

  // Playable cards for current human turn
  const playableCards = gameState.phase === 'playing' && isMyTurn
    ? getPlayableCards(gameState, 0) : [];
  const playableIds = new Set(playableCards.map(c => c.id));

  // Chien phase: taker's hand + chien combined
  const isTakerHuman = gameState.takerId === myPlayer.id;
  const chienCards = gameState.phase === 'chien' && isTakerHuman
    ? [...myPlayer.cards, ...gameState.chien] : [];
  const expectedEcartSize = gameState.playerCount === 4 ? 6 : 3;

  // Trick display positions
  const throwOrigins = gameState.playerCount === 4 ? THROW_ORIGINS_4 : THROW_ORIGINS_5;

  // Current trick cards with positions
  const trickEntries = gameState.currentTrick.cards.map(tc => {
    const pi = gameState.players.findIndex(p => p.id === tc.playerId);
    return { card: tc.card, playerIdx: pi };
  });

  // Player positions
  const players = gameState.players;

  // Get available bids for human
  const getAvailableBids = (): BidLevel[] => {
    if (gameState.phase !== 'bidding' || !isMyTurn) return [];
    const bids: BidLevel[] = ['passe'];
    const levels: BidLevel[] = ['petite', 'garde', 'garde_sans', 'garde_contre'];
    const currentRank = gameState.currentBid
      ? ['passe', 'petite', 'garde', 'garde_sans', 'garde_contre'].indexOf(gameState.currentBid)
      : 0;
    for (const l of levels) {
      const rank = ['passe', 'petite', 'garde', 'garde_sans', 'garde_contre'].indexOf(l);
      if (rank > currentRank) bids.push(l);
    }
    return bids;
  };

  // Round info
  const currentContract = gameState.currentBid ? BID_LABELS[gameState.currentBid] : null;
  const takerName = gameState.takerId ? gameState.players.find(p => p.id === gameState.takerId)?.name : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#071a0f' }}>

      {/* Boss announce */}
      <AnimatePresence>
        {showBossAnnounce && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(245,200,66,0.18) 0%, rgba(7,26,15,0.92) 70%)' }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex flex-col items-center gap-3">
              <p className="font-display text-4xl font-black tracking-widest"
                style={{ color: '#f5c842', textShadow: '0 0 40px rgba(245,200,66,0.8)' }}>TAROT</p>
              <p className="font-display text-sm tracking-[0.3em] uppercase text-slate-400">la partie commence</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 z-50 relative"
        style={{ background: 'rgba(7,26,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => { window.location.hash = '#/lobby'; }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center gap-0.5">
          {gameState.phase === 'playing' && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className={`font-display text-sm font-semibold tracking-widest transition-colors ${timer <= 10 ? 'text-red-400' : 'text-slate-200'}`}>
                {timer}s
              </span>
            </div>
          )}
          <span className="text-[10px] text-amber-400/70 tracking-wider">
            {gameState.phase === 'bidding' ? 'Encheres' :
             gameState.phase === 'chien' ? 'Ecart' :
             gameState.phase === 'calling' ? 'Appel au Roi' :
             gameState.phase === 'scoring' ? 'Scores' :
             `Pli ${gameState.trickNumber + 1}/${gameState.playerCount === 4 ? 18 : 15}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <MessageCircle className="w-4 h-4" />
          </button>
          <button onClick={() => setShowGameSettings(true)} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Table area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, #0d2518 0%, #071a0f 70%)' }} />

        {/* Felt oval */}
        <div className="absolute"
          style={{
            left: '8%', right: '8%', top: '14%', bottom: '10%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse 80% 60% at 50% 38%, #1e5c35 0%, #14401f 35%, #0c2914 65%, #071a0f 100%)',
            border: '2px solid rgba(80,160,100,0.25)',
            boxShadow: '0 0 60px rgba(20,90,40,0.35), inset 0 0 80px rgba(0,0,0,0.5), inset 0 30px 60px rgba(30,92,53,0.15)',
          }}>
          <div className="absolute" style={{ inset: '8%', borderRadius: '50%', border: '1px solid rgba(80,150,90,0.15)', pointerEvents: 'none' }} />

          {/* Round info engraved in felt */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '18%' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1.2 }}
              className="flex flex-col items-center select-none">
              <span className="font-display text-[10px] font-bold tracking-[0.4em] uppercase"
                style={{ color: 'rgba(120,180,130,0.4)' }}>Donne {gameState.round}</span>
              {currentContract && (
                <span className="font-display text-[9px] tracking-[0.3em] uppercase"
                  style={{ color: 'rgba(120,180,130,0.3)' }}>{currentContract} {takerName ? `- ${takerName}` : ''}</span>
              )}
              <span className="font-display text-2xl font-black tracking-wider"
                style={{ color: 'rgba(212,160,23,0.2)', textShadow: '0 0 30px rgba(212,160,23,0.08)' }}>TAROT</span>
            </motion.div>
          </div>

          {/* "Your turn" indicator */}
          <AnimatePresence>
            {isMyTurn && gameState.phase === 'playing' && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute left-0 right-0 text-center z-20" style={{ bottom: '14%' }}>
                <span className="font-script text-2xl"
                  style={{ color: '#f5c842', textShadow: '0 0 18px rgba(245,200,66,0.55), 0 1px 3px rgba(0,0,0,0.8)' }}>
                  A votre tour !
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Players - 4 player layout: S, W, N, E */}
        {gameState.playerCount === 4 && (
          <>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <PlayerSlot player={players[2]} isActive={gameState.currentPlayerIndex === 2} justPlayed={justPlayedIdx === 2}
                isTaker={gameState.takerId === players[2].id} isPartner={gameState.partnerId === players[2].id}
                score={gameState.scores[2]} />
            </div>
            <div className="absolute left-1 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              <PlayerSlot player={players[1]} isActive={gameState.currentPlayerIndex === 1} justPlayed={justPlayedIdx === 1}
                isTaker={gameState.takerId === players[1].id} isPartner={gameState.partnerId === players[1].id}
                score={gameState.scores[1]} />
            </div>
            <div className="absolute right-1 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              <PlayerSlot player={players[3]} isActive={gameState.currentPlayerIndex === 3} justPlayed={justPlayedIdx === 3}
                isTaker={gameState.takerId === players[3].id} isPartner={gameState.partnerId === players[3].id}
                score={gameState.scores[3]} />
            </div>
          </>
        )}

        {/* Players - 5 player layout */}
        {gameState.playerCount === 5 && (
          <>
            <div className="absolute z-20" style={{ top: '8%', left: '22%' }}>
              <PlayerSlot player={players[2]} isActive={gameState.currentPlayerIndex === 2} justPlayed={justPlayedIdx === 2}
                isTaker={gameState.takerId === players[2].id} isPartner={gameState.partnerId === players[2].id}
                score={gameState.scores[2]} />
            </div>
            <div className="absolute z-20" style={{ top: '8%', right: '22%' }}>
              <PlayerSlot player={players[3]} isActive={gameState.currentPlayerIndex === 3} justPlayed={justPlayedIdx === 3}
                isTaker={gameState.takerId === players[3].id} isPartner={gameState.partnerId === players[3].id}
                score={gameState.scores[3]} />
            </div>
            <div className="absolute left-1 z-20" style={{ top: '55%', transform: 'translateY(-50%)' }}>
              <PlayerSlot player={players[1]} isActive={gameState.currentPlayerIndex === 1} justPlayed={justPlayedIdx === 1}
                isTaker={gameState.takerId === players[1].id} isPartner={gameState.partnerId === players[1].id}
                score={gameState.scores[1]} />
            </div>
            <div className="absolute right-1 z-20" style={{ top: '55%', transform: 'translateY(-50%)' }}>
              <PlayerSlot player={players[4]} isActive={gameState.currentPlayerIndex === 4} justPlayed={justPlayedIdx === 4}
                isTaker={gameState.takerId === players[4].id} isPartner={gameState.partnerId === players[4].id}
                score={gameState.scores[4]} />
            </div>
          </>
        )}

        {/* Score panel (top right) */}
        <div className="absolute top-2 right-2 z-30 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(5,16,10,0.92)', border: '1px solid rgba(212,160,23,0.3)', backdropFilter: 'blur(8px)', minWidth: 96 }}>
          <div className="px-3 py-1.5 text-center" style={{ borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
            <p className="font-display text-[9px] tracking-widest uppercase" style={{ color: '#d4a017' }}>Scores</p>
          </div>
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between px-2.5 py-1 gap-2">
              <span className="text-[10px] text-slate-400 truncate" style={{ maxWidth: 44 }}>{p.name}</span>
              <span className="font-display text-[12px] font-bold" style={{ color: gameState.scores[i] >= 0 ? '#4ade80' : '#f87171' }}>
                {gameState.scores[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Bid animations floating */}
        <AnimatePresence>
          {bidAnimations.slice(-4).map(ba => {
            const pi = players.findIndex(p => p.id === ba.playerId);
            const origins = gameState.playerCount === 4 ? THROW_ORIGINS_4 : THROW_ORIGINS_5;
            const origin = origins[pi] || { x: 0, y: 0 };
            return (
              <motion.div key={ba.key}
                initial={{ opacity: 0, scale: 0.7, x: origin.x, y: origin.y }}
                animate={{ opacity: 1, scale: 1, x: origin.x * 0.5, y: origin.y * 0.5 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5 }}
                className="absolute z-50 pointer-events-none"
                style={{ top: '42%', left: '50%' }}>
                <div className="px-3 py-1.5 rounded-full font-display text-xs font-bold tracking-wider"
                  style={{ background: 'rgba(5,16,10,0.9)', border: `1.5px solid ${BID_COLORS[ba.bid]}50`, color: BID_COLORS[ba.bid] }}>
                  {BID_LABELS[ba.bid]}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Center trick cards */}
        <div className="absolute z-40 pointer-events-none" style={{ top: '42%', left: '50%' }}>
          <AnimatePresence>
            {trickEntries.map((entry, idx) => {
              const origin = throwOrigins[entry.playerIdx] || { x: 0, y: 0, rotate: 0 };
              const angle = (idx - (trickEntries.length - 1) / 2) * 12;
              const ox = Math.cos((angle * Math.PI) / 180) * 20 - 30;
              const oy = Math.sin((angle * Math.PI) / 180) * 10 - 20;
              return (
                <motion.div key={`trick-${entry.card.id}`}
                  initial={{ x: origin.x, y: origin.y, rotate: origin.rotate, scale: 0.7, opacity: 0.75 }}
                  animate={{ x: ox, y: oy, rotate: angle * 0.5, scale: 1, opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ position: 'absolute', zIndex: idx }}>
                  <div style={{ filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.85))' }}>
                    <PlayingCard card={entry.card} small />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bidding panel (human) */}
        <AnimatePresence>
          {gameState.phase === 'bidding' && isMyTurn && !isDealing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute z-50 bottom-4 left-1/2 -translate-x-1/2">
              <div className="px-4 py-3 rounded-2xl flex flex-col items-center gap-2"
                style={{ background: 'rgba(5,16,10,0.95)', border: '1.5px solid rgba(212,160,23,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 0 40px rgba(212,160,23,0.15)' }}>
                <p className="font-display text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-1">Vos encheres</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {getAvailableBids().map(bid => (
                    <button key={bid} onClick={() => handleBid(bid)}
                      className="px-3 py-2 rounded-xl font-display text-xs font-semibold tracking-wide transition-all active:scale-95"
                      style={{
                        background: bid === 'passe' ? 'rgba(255,255,255,0.06)' : `${BID_COLORS[bid]}15`,
                        border: `1.5px solid ${BID_COLORS[bid]}60`,
                        color: BID_COLORS[bid],
                      }}>
                      {BID_LABELS[bid]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chien display + ecart selection (human taker) */}
        <AnimatePresence>
          {gameState.phase === 'chien' && isTakerHuman && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute z-50 bottom-2 left-1/2 -translate-x-1/2 w-[95%] max-w-lg">
              <div className="px-4 py-3 rounded-2xl flex flex-col items-center gap-2"
                style={{ background: 'rgba(5,16,10,0.95)', border: '1.5px solid rgba(212,160,23,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 0 40px rgba(212,160,23,0.15)' }}>
                <p className="font-display text-[10px] tracking-[0.3em] uppercase text-slate-400">
                  Chien - Selectionnez {expectedEcartSize} cartes pour l'ecart ({ecartSelection.length}/{expectedEcartSize})
                </p>
                <div className="flex flex-wrap justify-center gap-1 max-h-40 overflow-y-auto">
                  {sortCards([...myPlayer.cards, ...gameState.chien]).map(card => {
                    const isChienCard = gameState.chien.some(c => c.id === card.id);
                    const isSelected = ecartSelection.some(c => c.id === card.id);
                    const canDiscard = !isBout(card) && !(card.type === 'suit' && card.rank === 'R');
                    return (
                      <div key={card.id} className="relative" onClick={() => canDiscard && toggleEcartCard(card)}>
                        <div style={{
                          opacity: canDiscard ? 1 : 0.4,
                          transform: isSelected ? 'translateY(-8px)' : 'none',
                          transition: 'transform 0.15s ease',
                          cursor: canDiscard ? 'pointer' : 'not-allowed',
                        }}>
                          <PlayingCard card={card} selected={isSelected} compact />
                        </div>
                        {isChienCard && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border border-black text-[7px] flex items-center justify-center font-bold text-black">C</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleConfirmEcart}
                  disabled={ecartSelection.length !== expectedEcartSize}
                  className="w-full h-10 rounded-xl font-display text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #d4a017 0%, #8b6914 100%)', boxShadow: '0 0 20px rgba(212,160,23,0.35)', border: '1px solid rgba(212,160,23,0.4)' }}>
                  Confirmer l'ecart
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* King calling panel (5 players, human taker) */}
        <AnimatePresence>
          {gameState.phase === 'calling' && isMyTurn && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute z-50 bottom-4 left-1/2 -translate-x-1/2">
              <div className="px-5 py-3 rounded-2xl flex flex-col items-center gap-3"
                style={{ background: 'rgba(5,16,10,0.95)', border: '1.5px solid rgba(212,160,23,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 0 40px rgba(212,160,23,0.15)' }}>
                <p className="font-display text-[10px] tracking-[0.3em] uppercase text-slate-400">Appelez un Roi</p>
                <div className="flex gap-3">
                  {(['hearts', 'spades', 'diamonds', 'clubs'] as Suit[]).map(suit => {
                    const ownsKing = myPlayer.cards.some(c => c.type === 'suit' && c.suit === suit && c.rank === 'R');
                    return (
                      <button key={suit} onClick={() => !ownsKing && handleCallKing(suit)}
                        disabled={ownsKing}
                        className="w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${SUIT_COLORS[suit] === 'red' ? 'rgba(239,68,68,0.4)' : 'rgba(148,163,184,0.4)'}`,
                        }}>
                        <span className="text-2xl" style={{ color: SUIT_COLORS[suit] === 'red' ? '#ef4444' : '#e2e8f0' }}>
                          {SUIT_SYMBOLS[suit]}
                        </span>
                        <span className="text-[8px] text-slate-500">{SUIT_NAMES[suit]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scoring / Round result */}
        <AnimatePresence>
          {gameState.phase === 'scoring' && gameState.lastRoundResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-center justify-center"
              style={{ background: 'rgba(5,16,10,0.9)', backdropFilter: 'blur(16px)' }}>
              <motion.div initial={{ scale: 0.82, y: 28 }} animate={{ scale: 1, y: 0 }}
                className="mx-5 p-6 rounded-3xl w-full max-w-sm flex flex-col items-center gap-4"
                style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.4)', boxShadow: '0 0 60px rgba(212,160,23,0.2), 0 24px 48px rgba(0,0,0,0.8)' }}>
                {(() => {
                  const r = gameState.lastRoundResult!;
                  const takerName = players.find(p => p.id === r.takerId)?.name ?? '?';
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-5xl mb-2">{r.contractMet ? '🏆' : '😔'}</div>
                        <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>
                          {r.contractMet ? 'Contrat rempli !' : 'Contrat chute !'}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">{takerName} en {BID_LABELS[r.bidLevel]}</p>
                      </div>

                      {/* Points breakdown */}
                      <div className="w-full space-y-1.5">
                        <div className="flex justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <span className="text-xs text-slate-400">Points gagnes</span>
                          <span className="text-xs font-bold text-slate-200">{Math.round(r.pointsWon * 10) / 10}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <span className="text-xs text-slate-400">Points requis ({r.boutsWon} bout{r.boutsWon !== 1 ? 's' : ''})</span>
                          <span className="text-xs font-bold text-slate-200">{r.pointsRequired}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <span className="text-xs text-slate-400">Difference</span>
                          <span className="text-xs font-bold" style={{ color: r.diff >= 0 ? '#4ade80' : '#f87171' }}>
                            {r.diff >= 0 ? '+' : ''}{Math.round(r.diff * 10) / 10}
                          </span>
                        </div>
                        <div className="flex justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <span className="text-xs text-slate-400">Multiplicateur</span>
                          <span className="text-xs font-bold text-amber-400">x{r.multiplier}</span>
                        </div>
                        {r.petitAuBout !== 0 && (
                          <div className="flex justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-slate-400">Petit au bout</span>
                            <span className="text-xs font-bold" style={{ color: r.petitAuBout > 0 ? '#4ade80' : '#f87171' }}>
                              {r.petitAuBout > 0 ? '+' : ''}{r.petitAuBout}
                            </span>
                          </div>
                        )}
                        {r.poigneeBonus !== 0 && (
                          <div className="flex justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-slate-400">Poignee</span>
                            <span className="text-xs font-bold" style={{ color: r.poigneeBonus > 0 ? '#4ade80' : '#f87171' }}>
                              {r.poigneeBonus > 0 ? '+' : ''}{r.poigneeBonus}
                            </span>
                          </div>
                        )}
                        {r.chelemBonus !== 0 && (
                          <div className="flex justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-slate-400">Chelem</span>
                            <span className="text-xs font-bold text-amber-400">+{r.chelemBonus}</span>
                          </div>
                        )}
                      </div>

                      {/* Score changes */}
                      <div className="w-full space-y-1">
                        <p className="font-display text-[9px] tracking-widest uppercase text-slate-500 px-1">Variation des scores</p>
                        {players.map((p, i) => (
                          <div key={p.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                            style={{ background: p.id === r.takerId ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.id === r.takerId ? 'rgba(212,160,23,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-300">{p.name}</span>
                              {p.id === r.takerId && <span className="text-[7px] px-1 rounded bg-red-500/20 text-red-300 font-bold">P</span>}
                              {p.id === r.partnerId && <span className="text-[7px] px-1 rounded bg-blue-500/20 text-blue-300 font-bold">A</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold" style={{ color: r.finalScoreChange[i] >= 0 ? '#4ade80' : '#f87171' }}>
                                {r.finalScoreChange[i] >= 0 ? '+' : ''}{r.finalScoreChange[i]}
                              </span>
                              <span className="text-[10px] text-slate-400">{gameState.scores[i]}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 w-full">
                        {gameState.gameOver ? (
                          <>
                            <button onClick={() => { window.location.hash = '#/lobby'; }}
                              className="flex-1 h-11 rounded-2xl text-sm font-display text-slate-300"
                              style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                              Quitter
                            </button>
                            <button onClick={handleRestart}
                              className="flex-[2] h-11 rounded-2xl text-sm font-display font-semibold text-white"
                              style={{ background: 'linear-gradient(135deg, #d4a017, #8b6914)', boxShadow: '0 0 20px rgba(212,160,23,0.35)' }}>
                              Nouvelle partie
                            </button>
                          </>
                        ) : (
                          <button onClick={handleNewRound}
                            className="w-full h-11 rounded-2xl text-sm font-display font-semibold text-white active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #d4a017, #8b6914)', boxShadow: '0 0 20px rgba(212,160,23,0.35)' }}>
                            Donne suivante
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game over overlay (not scoring phase) */}
        <AnimatePresence>
          {gameState.gameOver && gameState.phase !== 'scoring' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-center justify-center"
              style={{ background: 'rgba(5,16,10,0.9)', backdropFilter: 'blur(16px)' }}>
              <motion.div initial={{ scale: 0.82, y: 28 }} animate={{ scale: 1, y: 0 }}
                className="mx-5 p-8 rounded-3xl w-full max-w-sm flex flex-col items-center gap-5"
                style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.4)', boxShadow: '0 0 60px rgba(212,160,23,0.2), 0 24px 48px rgba(0,0,0,0.8)' }}>
                <div className="text-center">
                  <div className="text-6xl mb-2">{gameState.winner === myPlayer.id ? '🏆' : '😔'}</div>
                  <h2 className="font-script text-3xl" style={{ color: '#f5c842' }}>
                    {gameState.winner === myPlayer.id ? 'Victoire !' : 'Defaite'}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {players.find(p => p.id === gameState.winner)?.name} remporte la partie
                  </p>
                </div>
                <div className="w-full space-y-1">
                  {[...players.map((p, i) => ({ p, i, score: gameState.scores[i] }))]
                    .sort((a, b) => b.score - a.score)
                    .map((item, rank) => {
                      const medals = ['1er', '2e', '3e', '4e', '5e'];
                      return (
                        <div key={item.p.id} className="flex items-center justify-between px-4 py-2 rounded-xl"
                          style={{ background: rank === 0 ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${rank === 0 ? 'rgba(212,160,23,0.4)' : 'rgba(255,255,255,0.07)'}` }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 w-4">{medals[rank]}</span>
                            <span className="text-sm text-slate-300">{item.p.name}</span>
                          </div>
                          <span className="font-display text-base font-bold" style={{ color: rank === 0 ? '#f5c842' : '#94a3b8' }}>
                            {item.score}
                          </span>
                        </div>
                      );
                    })}
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => { window.location.hash = '#/lobby'; }}
                    className="flex-1 h-11 rounded-2xl text-sm font-display text-slate-300"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                    Quitter
                  </button>
                  <button onClick={handleRestart}
                    className="flex-[2] h-11 rounded-2xl text-sm font-display font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #d4a017, #8b6914)', boxShadow: '0 0 20px rgba(212,160,23,0.35)' }}>
                    Rejouer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hand panel */}
      <div className="z-50 relative flex flex-col"
        style={{ background: 'rgba(5,16,10,0.97)', borderTop: '1px solid rgba(80,150,90,0.18)', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>

        {/* Sort mode banner */}
        <AnimatePresence>
          {sortMode && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="text-center text-[10px] pt-2 font-display tracking-widest" style={{ color: '#f5c842' }}>
              Glissez les cartes pour les reordonner
            </motion.p>
          )}
        </AnimatePresence>

        {/* Phase-specific info */}
        {gameState.phase === 'bidding' && !isMyTurn && !isDealing && (
          <p className="text-center text-[10px] pt-2 font-display tracking-widest text-slate-500">
            {players[gameState.currentPlayerIndex]?.name} reflechit...
          </p>
        )}

        {/* Cards row */}
        <div className="flex items-end pt-2 pb-1 px-1">
          <div className="flex-1 flex justify-center overflow-visible">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cardOrder} strategy={horizontalListSortingStrategy}>
                <div className="flex items-end">
                  {orderedCards.map((card, i) => {
                    const isPlayable = playableIds.has(card.id);
                    return (
                      <motion.div key={card.id}
                        style={{ zIndex: i, position: 'relative' }}
                        initial={(gameSettings.animations && !isRestoringRef.current && isDealing) ? { opacity: 0, y: -80, scale: 0.75, rotateZ: -8 } : false}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
                        transition={(gameSettings.animations && !isRestoringRef.current && isDealing) ? {
                          delay: i * 0.12, duration: 0.45, type: 'spring', stiffness: 220, damping: 22,
                        } : { duration: 0 }}>
                        <SortableCard
                          card={card} index={i}
                          selected={selectedCards.some(c => c.id === card.id)}
                          onClick={() => {
                            if (gameState.phase === 'playing' && isMyTurn) handlePlayCard(card);
                          }}
                          sortMode={sortMode}
                          playable={gameState.phase !== 'playing' || isPlayable}
                          compact={gameSettings.cardSize === 'compact'}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex items-center gap-2 px-5 pb-3 pt-2">
          <button onClick={() => { setSortMode(m => !m); setSelectedCards([]); }}
            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200"
            style={{
              background: sortMode ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.07)',
              border: sortMode ? '1.5px solid rgba(245,200,66,0.6)' : '1.5px solid rgba(255,255,255,0.1)',
              color: sortMode ? '#f5c842' : '#64748b',
            }}>
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          {/* Phase-specific right-side button */}
          {gameState.phase === 'playing' && (
            <div className="flex-1 h-12 rounded-2xl flex items-center justify-center font-display text-sm tracking-wide"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              {isMyTurn ? 'Touchez une carte pour jouer' : `${players[gameState.currentPlayerIndex]?.name} joue...`}
            </div>
          )}
          {gameState.phase === 'bidding' && (
            <div className="flex-1 h-12 rounded-2xl flex items-center justify-center font-display text-sm tracking-wide"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              Phase d'encheres
            </div>
          )}
          {gameState.phase === 'chien' && (
            <div className="flex-1 h-12 rounded-2xl flex items-center justify-center font-display text-sm tracking-wide"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              {isTakerHuman ? 'Choisissez votre ecart' : 'Le preneur ecarte...'}
            </div>
          )}
          {gameState.phase === 'calling' && (
            <div className="flex-1 h-12 rounded-2xl flex items-center justify-center font-display text-sm tracking-wide"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              {isMyTurn ? 'Appelez un Roi' : 'Le preneur appelle...'}
            </div>
          )}
          {(gameState.phase === 'scoring' || gameState.phase === 'dealing') && (
            <div className="flex-1 h-12 rounded-2xl flex items-center justify-center font-display text-sm tracking-wide"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              {gameState.phase === 'dealing' ? 'Distribution...' : 'Resultats'}
            </div>
          )}
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="zero" />}

      <GameSettingsModal
        open={showGameSettings}
        onClose={() => { setGameSettings(loadGameSettings()); setShowGameSettings(false); }}
        onQuit={() => {
          if (!gameState.gameOver) {
            localStorage.setItem(SOLO_SAVE_KEY, JSON.stringify({ gs: gameState, ts: Date.now() }));
          }
          setShowGameSettings(false);
          window.location.hash = '#/lobby';
        }}
        isRanked={false}
      />
    </div>
  );
}
