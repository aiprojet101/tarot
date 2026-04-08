// Tarot Francais — Regles officielles FFT
// 78 cartes, 4 ou 5 joueurs, prenneur vs defense, score cumulatif
// Pure functions, immutable state updates

// ============================================================
// TYPES
// ============================================================

export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts';
export type SuitRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'V' | 'C' | 'D' | 'R';
export type TrumpRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21';
export type CardType = 'suit' | 'trump' | 'excuse';

export interface Card {
  type: CardType;
  suit?: Suit;
  rank: string;
  id: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  cards: Card[];
  tokens: number;
  xp: number;
  level: number;
  isActive: boolean;
  wonCards: Card[];
}

export type BidLevel = 'passe' | 'petite' | 'garde' | 'garde_sans' | 'garde_contre';
export type GamePhase = 'dealing' | 'bidding' | 'chien' | 'calling' | 'playing' | 'scoring';
export type PlayerCount = 4 | 5;
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Trick {
  cards: { playerId: string; card: Card }[];
  leadCard: Card | null;
  winnerId: string | null;
}

export interface PoigneeDeclaration {
  playerId: string;
  cards: Card[];
  type: 'simple' | 'double' | 'triple';
}

export interface RoundResult {
  takerId: string;
  partnerId: string | null;
  bidLevel: BidLevel;
  boutsWon: number;
  pointsWon: number;
  pointsRequired: number;
  contractMet: boolean;
  diff: number;
  multiplier: number;
  petitAuBout: number;
  poigneeBonus: number;
  chelemBonus: number;
  finalScoreChange: number[];
}

export interface GameState {
  players: Player[];
  playerCount: PlayerCount;
  currentPlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  bids: { playerId: string; bid: BidLevel }[];
  currentBid: BidLevel | null;
  takerId: string | null;
  calledKing: { suit: Suit; rank: 'R' } | null;
  partnerId: string | null;
  partnerRevealed: boolean;
  chien: Card[];
  ecart: Card[];
  currentTrick: Trick;
  completedTricks: Trick[];
  trickNumber: number;
  scores: number[];
  lastRoundResult: RoundResult | null;
  round: number;
  gameOver: boolean;
  poigneeDeclaration: PoigneeDeclaration | null;
  petitAuBout: { lastTrickWinner: string | null; petitPlayedInLastTrick: boolean };
  difficulty: Difficulty;
  turnTimer: number;
}

// ============================================================
// CONSTANTS
// ============================================================

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '\u2660',
  clubs: '\u2663',
  diamonds: '\u2666',
  hearts: '\u2665',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: 'black',
  clubs: 'black',
  diamonds: 'red',
  hearts: 'red',
};

export const SUIT_NAMES: Record<Suit, string> = {
  spades: 'Pique',
  clubs: 'Trefle',
  diamonds: 'Carreau',
  hearts: 'Coeur',
};

export const TRUMP_NAMES: Record<string, string> = {
  '1': 'Petit',
  '21': 'Vingt-et-un',
  excuse: 'Excuse',
};

const SUITS: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
const SUIT_RANKS: SuitRank[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'C', 'D', 'R'];
const TRUMP_RANKS: TrumpRank[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

const BID_ORDER: BidLevel[] = ['passe', 'petite', 'garde', 'garde_sans', 'garde_contre'];
const BID_MULTIPLIERS: Record<BidLevel, number> = {
  passe: 0,
  petite: 1,
  garde: 2,
  garde_sans: 4,
  garde_contre: 6,
};

const BOUT_POINTS_REQUIRED: Record<number, number> = {
  0: 56,
  1: 51,
  2: 41,
  3: 36,
};

const SUIT_RANK_ORDER: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'V': 11, 'C': 12, 'D': 13, 'R': 14,
};

const POIGNEE_THRESHOLDS: Record<PlayerCount, { simple: number; double: number; triple: number }> = {
  4: { simple: 10, double: 13, triple: 15 },
  5: { simple: 8, double: 10, triple: 13 },
};

const POIGNEE_BONUS: Record<'simple' | 'double' | 'triple', number> = {
  simple: 20,
  double: 30,
  triple: 40,
};

// ============================================================
// CARD HELPERS
// ============================================================

export function getCardValue(card: Card): number {
  return card.value;
}

export function isBout(card: Card): boolean {
  if (card.type === 'excuse') return true;
  if (card.type === 'trump' && (card.rank === '1' || card.rank === '21')) return true;
  return false;
}

function computeCardValue(type: CardType, rank: string): number {
  if (type === 'excuse') return 4.5;
  if (type === 'trump') {
    if (rank === '1' || rank === '21') return 4.5;
    return 0.5;
  }
  // suit card
  switch (rank) {
    case 'R': return 4.5;
    case 'D': return 3.5;
    case 'C': return 2.5;
    case 'V': return 1.5;
    default: return 0.5;
  }
}

function isKing(card: Card): boolean {
  return card.type === 'suit' && card.rank === 'R';
}

function trumpStrength(rank: string): number {
  return parseInt(rank, 10);
}

// ============================================================
// DECK
// ============================================================

export function createDeck(): Card[] {
  const cards: Card[] = [];

  // 56 suit cards (4 suits x 14 ranks)
  for (const suit of SUITS) {
    for (const rank of SUIT_RANKS) {
      const val = computeCardValue('suit', rank);
      cards.push({ type: 'suit', suit, rank, id: `${suit}-${rank}`, value: val });
    }
  }

  // 21 trumps
  for (const rank of TRUMP_RANKS) {
    const val = computeCardValue('trump', rank);
    cards.push({ type: 'trump', rank, id: `trump-${rank}`, value: val });
  }

  // Excuse
  cards.push({ type: 'excuse', rank: 'excuse', id: 'excuse', value: 4.5 });

  return cards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ============================================================
// DEAL
// ============================================================

export function dealCards(deck: Card[], playerCount: PlayerCount): { hands: Card[][]; chien: Card[] } {
  const chienSize = playerCount === 4 ? 6 : 3;
  const cardsPerPlayer = playerCount === 4 ? 18 : 15;
  const totalDealt = playerCount * cardsPerPlayer;

  // Deal by 3s, place chien cards at intervals (not first 3 or last 3)
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  const chien: Card[] = [];

  // Chien positions: spread evenly, avoiding first and last packet
  const totalPackets = Math.ceil((totalDealt + chienSize) / 3);
  const chienPacketIndices = new Set<number>();
  const step = Math.floor(totalPackets / (chienSize + 1));
  for (let i = 0; i < chienSize; i++) {
    let idx = step * (i + 1);
    if (idx <= 0) idx = 1;
    if (idx >= totalPackets - 1) idx = totalPackets - 2;
    chienPacketIndices.add(idx);
  }

  // Simpler approach: deal sequentially by 3, picking chien slots
  let cardIdx = 0;
  let playerIdx = 0;
  let packetNum = 0;

  while (cardIdx < deck.length) {
    const remaining = deck.length - cardIdx;
    const packetSize = Math.min(3, remaining);

    if (chien.length < chienSize && chienPacketIndices.has(packetNum)) {
      // Single card to chien
      chien.push(deck[cardIdx]);
      cardIdx++;
    } else {
      // 3 cards to current player
      for (let k = 0; k < packetSize && cardIdx < deck.length; k++) {
        if (hands[playerIdx].length < cardsPerPlayer) {
          hands[playerIdx].push(deck[cardIdx]);
          cardIdx++;
        }
      }
      playerIdx = (playerIdx + 1) % playerCount;
    }
    packetNum++;
  }

  // Fallback: if distribution was uneven, redistribute cleanly
  const totalHand = hands.reduce((s, h) => s + h.length, 0);
  if (totalHand + chien.length !== 78) {
    // Simple clean distribution
    const allCards = [...deck];
    const cleanHands: Card[][] = Array.from({ length: playerCount }, () => []);
    const cleanChien: Card[] = [];
    let ci = 0;
    // First give chien
    for (let i = 0; i < chienSize; i++) {
      cleanChien.push(allCards[ci++]);
    }
    // Then distribute evenly
    for (let p = 0; p < playerCount; p++) {
      for (let c = 0; c < cardsPerPlayer; c++) {
        cleanHands[p].push(allCards[ci++]);
      }
    }
    return { hands: cleanHands, chien: cleanChien };
  }

  return { hands, chien };
}

// ============================================================
// SORT CARDS
// ============================================================

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // Excuse first
    if (a.type === 'excuse') return -1;
    if (b.type === 'excuse') return 1;
    // Trumps before suits
    if (a.type === 'trump' && b.type !== 'trump') return -1;
    if (a.type !== 'trump' && b.type === 'trump') return 1;
    // Both trumps: by number
    if (a.type === 'trump' && b.type === 'trump') {
      return trumpStrength(a.rank) - trumpStrength(b.rank);
    }
    // Both suit: by suit then rank
    const suitOrder: Record<Suit, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
    if (a.suit! !== b.suit!) return suitOrder[a.suit!] - suitOrder[b.suit!];
    return (SUIT_RANK_ORDER[a.rank] || 0) - (SUIT_RANK_ORDER[b.rank] || 0);
  });
}

// ============================================================
// GAME STATE
// ============================================================

export function createInitialGameState(playerCount: PlayerCount, difficulty: Difficulty = 'normal'): GameState {
  const players: Player[] = [];
  const names4 = ['Vous', 'Ouest', 'Nord', 'Est'];
  const names5 = ['Vous', 'Joueur 2', 'Joueur 3', 'Joueur 4', 'Joueur 5'];
  const names = playerCount === 4 ? names4 : names5;
  const avatars = ['user', 'bot1', 'bot2', 'bot3', 'bot4'];

  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `player-${i}`,
      name: names[i],
      avatar: avatars[i],
      cards: [],
      tokens: 1000,
      xp: 0,
      level: 1,
      isActive: true,
      wonCards: [],
    });
  }

  const deck = shuffleDeck(createDeck());
  const { hands, chien } = dealCards(deck, playerCount);
  for (let i = 0; i < playerCount; i++) {
    players[i].cards = sortCards(hands[i]);
  }

  const dealerIndex = 0;
  const firstBidder = (dealerIndex + 1) % playerCount;

  return {
    players,
    playerCount,
    currentPlayerIndex: firstBidder,
    dealerIndex,
    phase: 'bidding',
    bids: [],
    currentBid: null,
    takerId: null,
    calledKing: null,
    partnerId: null,
    partnerRevealed: false,
    chien,
    ecart: [],
    currentTrick: { cards: [], leadCard: null, winnerId: null },
    completedTricks: [],
    trickNumber: 0,
    scores: new Array(playerCount).fill(0),
    lastRoundResult: null,
    round: 1,
    gameOver: false,
    poigneeDeclaration: null,
    petitAuBout: { lastTrickWinner: null, petitPlayedInLastTrick: false },
    difficulty,
    turnTimer: 30,
  };
}

// ============================================================
// BIDDING
// ============================================================

function bidRank(bid: BidLevel): number {
  return BID_ORDER.indexOf(bid);
}

export function placeBid(state: GameState, playerId: string, bid: BidLevel): GameState {
  if (state.phase !== 'bidding') return state;

  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex) return state;

  // Bid must be higher than current or passe
  if (bid !== 'passe' && state.currentBid && bidRank(bid) <= bidRank(state.currentBid)) {
    return state;
  }

  const newBids = [...state.bids, { playerId, bid }];
  const newCurrentBid = bid !== 'passe' ? bid : state.currentBid;
  const newTakerId = bid !== 'passe' ? playerId : state.takerId;
  const nextPlayer = (state.currentPlayerIndex + 1) % state.playerCount;

  // Check if bidding is over: all players have bid
  const biddingComplete = newBids.length >= state.playerCount;

  if (biddingComplete) {
    if (!newTakerId) {
      // All passed — redeal
      return startNewRound(state);
    }

    const finalBid = newCurrentBid!;
    // Determine next phase
    let nextPhase: GamePhase;
    if (finalBid === 'garde_sans' || finalBid === 'garde_contre') {
      nextPhase = state.playerCount === 5 ? 'calling' : 'playing';
    } else {
      nextPhase = 'chien';
    }

    // For garde_sans: chien goes to taker's won cards
    // For garde_contre: chien goes to defense won cards (handled at scoring)
    let newPlayers = state.players.map(p => ({ ...p }));
    let newChien = [...state.chien];

    if (finalBid === 'garde_sans') {
      const takerIdx = newPlayers.findIndex(p => p.id === newTakerId);
      newPlayers[takerIdx] = {
        ...newPlayers[takerIdx],
        wonCards: [...newPlayers[takerIdx].wonCards, ...newChien],
      };
      newChien = [];
    }

    const takerIdx = newPlayers.findIndex(p => p.id === newTakerId);

    return {
      ...state,
      bids: newBids,
      currentBid: finalBid,
      takerId: newTakerId,
      phase: nextPhase,
      currentPlayerIndex: nextPhase === 'playing' ? (state.dealerIndex + 1) % state.playerCount : takerIdx,
      players: newPlayers,
      chien: newChien,
    };
  }

  return {
    ...state,
    bids: newBids,
    currentBid: newCurrentBid,
    takerId: newTakerId,
    currentPlayerIndex: nextPlayer,
  };
}

// ============================================================
// CHIEN / ECART
// ============================================================

function canDiscard(card: Card): boolean {
  if (isBout(card)) return false;
  if (isKing(card)) return false;
  return true;
}

function canDiscardTrump(card: Card, hand: Card[], ecartSize: number, currentEcart: Card[]): boolean {
  // Can only discard trumps if no other choice
  if (card.type !== 'trump') return true;
  const nonTrumpDiscardable = hand.filter(c =>
    canDiscard(c) && c.type !== 'trump' && !currentEcart.some(e => e.id === c.id)
  );
  return nonTrumpDiscardable.length < (ecartSize - currentEcart.filter(c => c.type === 'trump').length);
}

export function handleChien(state: GameState, ecart: Card[]): GameState {
  if (state.phase !== 'chien') return state;
  if (!state.takerId) return state;

  const expectedEcartSize = state.playerCount === 4 ? 6 : 3;
  if (ecart.length !== expectedEcartSize) return state;

  // Validate ecart cards
  const takerIdx = state.players.findIndex(p => p.id === state.takerId);
  const takerHand = [...state.players[takerIdx].cards, ...state.chien];

  for (const card of ecart) {
    if (!takerHand.some(c => c.id === card.id)) return state;
    if (!canDiscard(card)) return state;
  }

  // Remove ecart from hand, keep remaining as taker's hand
  const newHand = takerHand.filter(c => !ecart.some(e => e.id === c.id));

  const newPlayers = state.players.map((p, i) => {
    if (i === takerIdx) {
      return { ...p, cards: sortCards(newHand), wonCards: [...p.wonCards, ...ecart] };
    }
    return { ...p };
  });

  const nextPhase: GamePhase = state.playerCount === 5 ? 'calling' : 'playing';

  return {
    ...state,
    players: newPlayers,
    ecart,
    chien: [],
    phase: nextPhase,
    currentPlayerIndex: nextPhase === 'playing'
      ? (state.dealerIndex + 1) % state.playerCount
      : takerIdx,
  };
}

// ============================================================
// 5-PLAYER KING CALL
// ============================================================

export function callKing(state: GameState, suit: Suit): GameState {
  if (state.phase !== 'calling') return state;
  if (state.playerCount !== 5) return state;
  if (!state.takerId) return state;

  const takerIdx = state.players.findIndex(p => p.id === state.takerId);
  const takerCards = state.players[takerIdx].cards;

  // Taker cannot call a king they own
  const ownsKing = takerCards.some(c => c.type === 'suit' && c.suit === suit && c.rank === 'R');
  if (ownsKing) return state;

  // Find who has this king (partner, revealed when played)
  let partnerId: string | null = null;
  for (const player of state.players) {
    if (player.id === state.takerId) continue;
    if (player.cards.some(c => c.type === 'suit' && c.suit === suit && c.rank === 'R')) {
      partnerId = player.id;
      break;
    }
  }

  return {
    ...state,
    calledKing: { suit, rank: 'R' },
    partnerId,
    partnerRevealed: false,
    phase: 'playing',
    currentPlayerIndex: (state.dealerIndex + 1) % state.playerCount,
  };
}

// ============================================================
// PLAYABLE CARDS
// ============================================================

export function getPlayableCards(state: GameState, playerIndex: number): Card[] {
  if (state.phase !== 'playing') return [];

  const hand = state.players[playerIndex].cards;
  if (hand.length === 0) return [];

  // First card of trick — can play anything
  if (state.currentTrick.cards.length === 0) return [...hand];

  const leadCard = state.currentTrick.leadCard!;

  // If lead was Excuse, the second card determines the effective lead
  let effectiveLead = leadCard;
  if (leadCard.type === 'excuse' && state.currentTrick.cards.length > 1) {
    effectiveLead = state.currentTrick.cards[1].card;
  }
  // If only Excuse has been played, can play anything
  if (effectiveLead.type === 'excuse') return [...hand];

  const excuseCards = hand.filter(c => c.type === 'excuse');
  // Excuse can always be played
  const alwaysPlayable = [...excuseCards];

  if (effectiveLead.type === 'trump') {
    // Must play trump
    const trumps = hand.filter(c => c.type === 'trump');
    if (trumps.length > 0) {
      // Must play higher if possible (monter)
      const highestTrumpInTrick = getHighestTrumpInTrick(state.currentTrick);
      const higherTrumps = trumps.filter(c => trumpStrength(c.rank) > highestTrumpInTrick);
      if (higherTrumps.length > 0) return [...alwaysPlayable, ...higherTrumps];
      return [...alwaysPlayable, ...trumps]; // can't go higher, play any trump
    }
    // No trumps, play anything
    return [...hand];
  }

  // Lead is a suit card
  const leadSuit = effectiveLead.suit!;
  const sameSuit = hand.filter(c => c.type === 'suit' && c.suit === leadSuit);

  if (sameSuit.length > 0) {
    // Must follow suit
    return [...alwaysPlayable, ...sameSuit];
  }

  // Can't follow suit — must trump (couper)
  const trumps = hand.filter(c => c.type === 'trump');
  if (trumps.length > 0) {
    const highestTrumpInTrick = getHighestTrumpInTrick(state.currentTrick);
    const higherTrumps = trumps.filter(c => trumpStrength(c.rank) > highestTrumpInTrick);
    if (higherTrumps.length > 0) return [...alwaysPlayable, ...higherTrumps];
    return [...alwaysPlayable, ...trumps]; // sous-couper (under-trump)
  }

  // No trump either — play anything
  return [...hand];
}

function getHighestTrumpInTrick(trick: Trick): number {
  let highest = 0;
  for (const { card } of trick.cards) {
    if (card.type === 'trump') {
      const s = trumpStrength(card.rank);
      if (s > highest) highest = s;
    }
  }
  return highest;
}

// ============================================================
// PLAY CARD
// ============================================================

export function playCard(state: GameState, playerIndex: number, card: Card): GameState {
  if (state.phase !== 'playing') return state;
  if (playerIndex !== state.currentPlayerIndex) return state;

  const playable = getPlayableCards(state, playerIndex);
  if (!playable.some(c => c.id === card.id)) return state;

  const player = state.players[playerIndex];
  const newHand = player.cards.filter(c => c.id !== card.id);

  const newTrickCards = [...state.currentTrick.cards, { playerId: player.id, card }];
  const leadCard = state.currentTrick.leadCard || card;

  // Check partner reveal (5-player: called king played)
  let partnerRevealed = state.partnerRevealed;
  if (
    !partnerRevealed &&
    state.calledKing &&
    card.type === 'suit' &&
    card.suit === state.calledKing.suit &&
    card.rank === 'R'
  ) {
    partnerRevealed = true;
  }

  const newPlayers = state.players.map((p, i) => {
    if (i === playerIndex) return { ...p, cards: newHand };
    return p;
  });

  const newCurrentTrick: Trick = {
    cards: newTrickCards,
    leadCard,
    winnerId: null,
  };

  let newState: GameState = {
    ...state,
    players: newPlayers,
    currentTrick: newCurrentTrick,
    partnerRevealed,
    currentPlayerIndex: (playerIndex + 1) % state.playerCount,
  };

  // If trick is complete, resolve it
  if (newTrickCards.length === state.playerCount) {
    newState = resolveTrick(newState);
  }

  return newState;
}

// ============================================================
// RESOLVE TRICK
// ============================================================

export function resolveTrick(state: GameState): GameState {
  const trick = state.currentTrick;
  if (trick.cards.length !== state.playerCount) return state;

  const winnerId = determineTrickWinner(trick);

  // Collect cards for winner (handle Excuse)
  const trickCards = trick.cards.map(tc => tc.card);
  const excuseEntry = trick.cards.find(tc => tc.card.type === 'excuse');

  // Excuse owner keeps it; gives a 0.5-pt card to trick winner later (handled at scoring)
  // For simplicity, excuse stays with its player's won pile

  const newPlayers = state.players.map(p => {
    if (p.id === winnerId) {
      const won = trickCards.filter(c => c.type !== 'excuse' || !excuseEntry || excuseEntry.playerId === winnerId);
      return { ...p, wonCards: [...p.wonCards, ...won] };
    }
    if (excuseEntry && p.id === excuseEntry.playerId && winnerId !== excuseEntry.playerId) {
      // Excuse player keeps the Excuse in their won pile
      return { ...p, wonCards: [...p.wonCards, excuseEntry.card] };
    }
    return p;
  });

  const completedTrick: Trick = { ...trick, winnerId };
  const newTrickNumber = state.trickNumber + 1;
  const totalTricks = state.playerCount === 4 ? 18 : 15;

  // Petit au bout tracking
  const petitInTrick = trickCards.some(c => c.type === 'trump' && c.rank === '1');
  const isLastTrick = newTrickNumber === totalTricks;

  const petitAuBout = {
    lastTrickWinner: isLastTrick ? winnerId : state.petitAuBout.lastTrickWinner,
    petitPlayedInLastTrick: isLastTrick ? petitInTrick : state.petitAuBout.petitPlayedInLastTrick,
  };

  // Check if round is over
  const roundOver = isLastTrick;

  let newState: GameState = {
    ...state,
    players: newPlayers,
    currentTrick: { cards: [], leadCard: null, winnerId: null },
    completedTricks: [...state.completedTricks, completedTrick],
    trickNumber: newTrickNumber,
    currentPlayerIndex: state.players.findIndex(p => p.id === winnerId),
    petitAuBout,
  };

  if (roundOver) {
    newState = calculateScore(newState);
  }

  return newState;
}

function determineTrickWinner(trick: Trick): string {
  let leadCard = trick.leadCard!;

  // If lead is Excuse, effective lead is second card
  if (leadCard.type === 'excuse' && trick.cards.length > 1) {
    leadCard = trick.cards[1].card;
  }

  // Excuse never wins
  const candidates = trick.cards.filter(tc => tc.card.type !== 'excuse');

  // Check for trumps
  const trumpPlays = candidates.filter(tc => tc.card.type === 'trump');
  if (trumpPlays.length > 0) {
    // Highest trump wins
    let best = trumpPlays[0];
    for (let i = 1; i < trumpPlays.length; i++) {
      if (trumpStrength(trumpPlays[i].card.rank) > trumpStrength(best.card.rank)) {
        best = trumpPlays[i];
      }
    }
    return best.playerId;
  }

  // No trumps — highest of lead suit wins
  const leadSuit = leadCard.suit;
  const suitPlays = candidates.filter(tc => tc.card.type === 'suit' && tc.card.suit === leadSuit);

  if (suitPlays.length === 0) {
    // Edge case: return first non-excuse player
    return candidates[0].playerId;
  }

  let best = suitPlays[0];
  for (let i = 1; i < suitPlays.length; i++) {
    if ((SUIT_RANK_ORDER[suitPlays[i].card.rank] || 0) > (SUIT_RANK_ORDER[best.card.rank] || 0)) {
      best = suitPlays[i];
    }
  }
  return best.playerId;
}

// ============================================================
// SCORING
// ============================================================

export function calculateScore(state: GameState): GameState {
  if (!state.takerId) return state;

  const takerId = state.takerId;
  const partnerId = state.partnerId;
  const takerIdx = state.players.findIndex(p => p.id === takerId);
  const bidLevel = state.currentBid!;
  const multiplier = BID_MULTIPLIERS[bidLevel];

  // Gather taker side cards
  const takerSideIds = new Set<string>([takerId]);
  if (partnerId) takerSideIds.add(partnerId);

  // Collect won cards per side
  let takerCards: Card[] = [];
  let defenseCards: Card[] = [];

  for (const player of state.players) {
    if (takerSideIds.has(player.id)) {
      takerCards = [...takerCards, ...player.wonCards];
    } else {
      defenseCards = [...defenseCards, ...player.wonCards];
    }
  }

  // Add chien to appropriate side (garde_contre: defense)
  if (bidLevel === 'garde_contre') {
    defenseCards = [...defenseCards, ...state.chien];
  }
  // garde_sans chien already added to taker wonCards during bidding

  // Handle Excuse exchange:
  // If taker side played Excuse but lost the trick, they keep the Excuse
  // but must give a 0.5-pt card to the other side
  const excuseInTaker = takerCards.some(c => c.type === 'excuse');
  const excuseInDefense = defenseCards.some(c => c.type === 'excuse');

  // Check if Excuse was played by the opposite side (was already handled in resolveTrick)
  // Excuse holder keeps it; we adjust 0.5 pts at scoring
  let excuseAdjust = 0;
  // If taker has excuse but didn't win the trick where it was played,
  // they owe 0.5 pts (a low card) to defense. Simplified: adjust points.
  // For simplicity, always count cards as-is and adjust:
  // If a side has the Excuse, they keep its 4.5 pts but give back 0.5 to other side
  if (excuseInTaker) {
    // Taker keeps Excuse (4.5) but owes 0.5 card to defense => net +4 for taker
    excuseAdjust = -0.5; // taker loses 0.5 from their count (they give a card)
  }

  // Count points
  // Official FFT counting: cards counted in pairs (each pair = sum of values)
  // Simplified: sum all individual values (equivalent result)
  let takerPoints = takerCards.reduce((sum, c) => sum + c.value, 0) + excuseAdjust;
  const defensePoints = 91 - takerPoints;

  // Count bouts won by taker
  const boutsWon = takerCards.filter(c => isBout(c)).length;
  const pointsRequired = BOUT_POINTS_REQUIRED[boutsWon] || 56;

  const contractMet = takerPoints >= pointsRequired;
  const diff = takerPoints - pointsRequired;

  // Petit au bout
  let petitAuBoutBonus = 0;
  if (state.petitAuBout.petitPlayedInLastTrick) {
    const lastWinner = state.petitAuBout.lastTrickWinner;
    if (lastWinner && takerSideIds.has(lastWinner)) {
      petitAuBoutBonus = 10;
    } else {
      petitAuBoutBonus = -10;
    }
  }

  // Poignee
  let poigneeBonus = 0;
  if (state.poigneeDeclaration) {
    poigneeBonus = POIGNEE_BONUS[state.poigneeDeclaration.type];
    // Poignee always goes to the winning side
    if (!contractMet) {
      // Defense wins, so bonus goes to defense (negative for taker)
      poigneeBonus = -poigneeBonus;
    }
  }

  // Chelem (slam)
  let chelemBonus = 0;
  const totalTricks = state.playerCount === 4 ? 18 : 15;
  const takerTricksWon = state.completedTricks.filter(t =>
    t.winnerId && takerSideIds.has(t.winnerId)
  ).length;
  if (takerTricksWon === totalTricks) {
    chelemBonus = 200; // grand chelem not announced
  } else if (takerTricksWon === totalTricks - 1) {
    chelemBonus = 0; // petit chelem, debated rule — skip
  }

  // Final score calculation
  const baseScore = 25 + Math.abs(diff);
  const signedScore = contractMet
    ? baseScore * multiplier + petitAuBoutBonus * multiplier + poigneeBonus + chelemBonus
    : -(baseScore * multiplier + Math.abs(petitAuBoutBonus) * multiplier) + poigneeBonus - Math.abs(chelemBonus);

  // Distribute score changes
  const finalScoreChange = new Array(state.playerCount).fill(0);

  if (state.playerCount === 4) {
    // Taker vs 3 defenders
    finalScoreChange[takerIdx] = signedScore * 3;
    for (let i = 0; i < 4; i++) {
      if (i !== takerIdx) {
        finalScoreChange[i] = -signedScore;
      }
    }
  } else {
    // 5 players
    const partnerIdx = partnerId ? state.players.findIndex(p => p.id === partnerId) : -1;
    if (partnerIdx >= 0 && partnerId !== takerId) {
      // Taker x2, partner x1, 3 defenders x-1 each
      finalScoreChange[takerIdx] = signedScore * 2;
      finalScoreChange[partnerIdx] = signedScore;
      for (let i = 0; i < 5; i++) {
        if (i !== takerIdx && i !== partnerIdx) {
          finalScoreChange[i] = -signedScore;
        }
      }
    } else {
      // Taker plays alone (called own king or no partner) x4
      finalScoreChange[takerIdx] = signedScore * 4;
      for (let i = 0; i < 5; i++) {
        if (i !== takerIdx) {
          finalScoreChange[i] = -signedScore;
        }
      }
    }
  }

  const newScores = state.scores.map((s, i) => s + finalScoreChange[i]);

  const roundResult: RoundResult = {
    takerId,
    partnerId,
    bidLevel,
    boutsWon,
    pointsWon: takerPoints,
    pointsRequired,
    contractMet,
    diff,
    multiplier,
    petitAuBout: petitAuBoutBonus,
    poigneeBonus,
    chelemBonus,
    finalScoreChange,
  };

  return {
    ...state,
    phase: 'scoring',
    scores: newScores,
    lastRoundResult: roundResult,
  };
}

// ============================================================
// NEW ROUND
// ============================================================

export function startNewRound(state: GameState): GameState {
  const newDealerIndex = (state.dealerIndex + 1) % state.playerCount;
  const deck = shuffleDeck(createDeck());
  const { hands, chien } = dealCards(deck, state.playerCount);

  const players = state.players.map((p, i) => ({
    ...p,
    cards: sortCards(hands[i]),
    wonCards: [],
  }));

  const firstBidder = (newDealerIndex + 1) % state.playerCount;

  return {
    ...state,
    players,
    currentPlayerIndex: firstBidder,
    dealerIndex: newDealerIndex,
    phase: 'bidding',
    bids: [],
    currentBid: null,
    takerId: null,
    calledKing: null,
    partnerId: null,
    partnerRevealed: false,
    chien,
    ecart: [],
    currentTrick: { cards: [], leadCard: null, winnerId: null },
    completedTricks: [],
    trickNumber: 0,
    lastRoundResult: null,
    round: state.round + 1,
    poigneeDeclaration: null,
    petitAuBout: { lastTrickWinner: null, petitPlayedInLastTrick: false },
  };
}

// ============================================================
// POIGNEE
// ============================================================

export function canDeclarePoignee(cards: Card[], playerCount: PlayerCount): { possible: boolean; type?: 'simple' | 'double' | 'triple' } {
  const trumpCount = cards.filter(c => c.type === 'trump' || c.type === 'excuse').length;
  const thresholds = POIGNEE_THRESHOLDS[playerCount];

  if (trumpCount >= thresholds.triple) return { possible: true, type: 'triple' };
  if (trumpCount >= thresholds.double) return { possible: true, type: 'double' };
  if (trumpCount >= thresholds.simple) return { possible: true, type: 'simple' };
  return { possible: false };
}

export function declarePoignee(state: GameState, playerId: string, cards: Card[]): GameState {
  if (state.phase !== 'playing' || state.trickNumber !== 0) return state;
  if (state.currentTrick.cards.length !== 0) return state;

  const playerIdx = state.players.findIndex(p => p.id === playerId);
  const hand = state.players[playerIdx].cards;

  // Verify all shown cards are trumps (or excuse) and belong to player
  for (const card of cards) {
    if (card.type !== 'trump' && card.type !== 'excuse') return state;
    if (!hand.some(c => c.id === card.id)) return state;
  }

  const check = canDeclarePoignee(hand, state.playerCount);
  if (!check.possible) return state;

  return {
    ...state,
    poigneeDeclaration: { playerId, cards, type: check.type! },
  };
}

// ============================================================
// BOT AI
// ============================================================

export function getBotBid(state: GameState, playerIndex: number): BidLevel {
  const hand = state.players[playerIndex].cards;
  const trumpCount = hand.filter(c => c.type === 'trump').length;
  const boutCount = hand.filter(c => isBout(c)).length;
  const kingCount = hand.filter(c => isKing(c)).length;
  const hasExcuse = hand.some(c => c.type === 'excuse');

  // Strength heuristic
  let strength = trumpCount * 2 + boutCount * 4 + kingCount * 2 + (hasExcuse ? 3 : 0);

  const difficultyMod = state.difficulty === 'easy' ? -3 : state.difficulty === 'hard' ? 3 : 0;
  strength += difficultyMod;

  const currentBidRank = state.currentBid ? bidRank(state.currentBid) : 0;

  if (strength >= 28 && currentBidRank < bidRank('garde_contre')) return 'garde_contre';
  if (strength >= 22 && currentBidRank < bidRank('garde_sans')) return 'garde_sans';
  if (strength >= 16 && currentBidRank < bidRank('garde')) return 'garde';
  if (strength >= 11 && currentBidRank < bidRank('petite')) return 'petite';
  return 'passe';
}

export function getBotEcart(state: GameState, playerIndex: number): Card[] {
  if (!state.takerId) return [];
  const ecartSize = state.playerCount === 4 ? 6 : 3;
  const takerIdx = state.players.findIndex(p => p.id === state.takerId);
  const hand = [...state.players[takerIdx].cards, ...state.chien];

  // Discard lowest value non-trump, non-king, non-bout cards
  const discardable = hand.filter(c => canDiscard(c) && c.type !== 'trump');

  // Sort by value ascending, then by rank ascending
  discardable.sort((a, b) => {
    if (a.value !== b.value) return a.value - b.value;
    return (SUIT_RANK_ORDER[a.rank] || 0) - (SUIT_RANK_ORDER[b.rank] || 0);
  });

  const ecart = discardable.slice(0, ecartSize);

  // If not enough, add trumps (non-bout)
  if (ecart.length < ecartSize) {
    const trumpDiscardable = hand.filter(c =>
      c.type === 'trump' && !isBout(c) && !ecart.some(e => e.id === c.id)
    );
    trumpDiscardable.sort((a, b) => trumpStrength(a.rank) - trumpStrength(b.rank));
    while (ecart.length < ecartSize && trumpDiscardable.length > 0) {
      ecart.push(trumpDiscardable.shift()!);
    }
  }

  return ecart.slice(0, ecartSize);
}

export function getBotPlay(state: GameState, playerIndex: number): Card {
  const playable = getPlayableCards(state, playerIndex);
  if (playable.length === 0) return state.players[playerIndex].cards[0]; // shouldn't happen
  if (playable.length === 1) return playable[0];

  const hand = state.players[playerIndex].cards;
  const isTaker = state.players[playerIndex].id === state.takerId;
  const isPartner = state.players[playerIndex].id === state.partnerId;
  const isAttacking = isTaker || isPartner;

  const trick = state.currentTrick;
  const isLeading = trick.cards.length === 0;

  if (isLeading) {
    return botLeadCard(playable, hand, isAttacking, state);
  }

  return botFollowCard(playable, hand, isAttacking, state);
}

function botLeadCard(playable: Card[], hand: Card[], isAttacking: boolean, state: GameState): Card {
  if (isAttacking) {
    // Lead with strong trumps to draw out opponent's trumps
    const strongTrumps = playable.filter(c => c.type === 'trump' && trumpStrength(c.rank) >= 15);
    if (strongTrumps.length > 0) return strongTrumps[strongTrumps.length - 1];

    // Lead with Kings (high value)
    const kings = playable.filter(c => isKing(c));
    if (kings.length > 0) return kings[0];

    // Lead with longest suit
    return leadLongestSuit(playable, hand);
  }

  // Defense: lead low cards, save trumps
  const lowSuitCards = playable.filter(c => c.type === 'suit' && !isKing(c));
  if (lowSuitCards.length > 0) {
    lowSuitCards.sort((a, b) => (SUIT_RANK_ORDER[a.rank] || 0) - (SUIT_RANK_ORDER[b.rank] || 0));
    return lowSuitCards[0];
  }

  // Low trumps
  const lowTrumps = playable.filter(c => c.type === 'trump');
  if (lowTrumps.length > 0) {
    lowTrumps.sort((a, b) => trumpStrength(a.rank) - trumpStrength(b.rank));
    return lowTrumps[0];
  }

  return playable[0];
}

function botFollowCard(playable: Card[], hand: Card[], isAttacking: boolean, state: GameState): Card {
  const trick = state.currentTrick;
  const leadCard = trick.leadCard!;
  const winnerId = determineTrickWinner({
    ...trick,
    cards: trick.cards,
    leadCard,
    winnerId: null,
  });

  // Check if partner is currently winning
  const partnerWinning = isAttacking
    ? (winnerId === state.takerId || winnerId === state.partnerId)
    : (!state.takerId || winnerId !== state.takerId) && winnerId !== state.partnerId;

  if (partnerWinning) {
    // Play lowest valid card
    return getLowestCard(playable);
  }

  // Try to win the trick
  const winningCards = playable.filter(c => {
    if (c.type === 'excuse') return false;
    const hypothetical: Trick = {
      cards: [...trick.cards, { playerId: 'test', card: c }],
      leadCard,
      winnerId: null,
    };
    return determineTrickWinner(hypothetical) === 'test';
  });

  if (winningCards.length > 0) {
    // Play lowest winning card
    return getLowestCard(winningCards);
  }

  // Can't win — play lowest
  return getLowestCard(playable);
}

function getLowestCard(cards: Card[]): Card {
  let lowest = cards[0];
  for (let i = 1; i < cards.length; i++) {
    const c = cards[i];
    if (c.type === 'excuse') { lowest = c; continue; } // Excuse is "free"
    if (c.value < lowest.value || (c.value === lowest.value && cardOrdinal(c) < cardOrdinal(lowest))) {
      lowest = c;
    }
  }
  return lowest;
}

function cardOrdinal(card: Card): number {
  if (card.type === 'excuse') return -1;
  if (card.type === 'trump') return trumpStrength(card.rank);
  return SUIT_RANK_ORDER[card.rank] || 0;
}

function leadLongestSuit(playable: Card[], hand: Card[]): Card {
  const suitCounts: Partial<Record<Suit, number>> = {};
  for (const c of hand) {
    if (c.type === 'suit' && c.suit) {
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    }
  }

  let bestSuit: Suit | null = null;
  let bestCount = 0;
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count! > bestCount) {
      bestCount = count!;
      bestSuit = suit as Suit;
    }
  }

  if (bestSuit) {
    const suitCards = playable.filter(c => c.type === 'suit' && c.suit === bestSuit);
    if (suitCards.length > 0) {
      // Lead highest of longest suit
      suitCards.sort((a, b) => (SUIT_RANK_ORDER[b.rank] || 0) - (SUIT_RANK_ORDER[a.rank] || 0));
      return suitCards[0];
    }
  }

  return playable[0];
}
