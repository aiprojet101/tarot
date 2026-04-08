import { Card, SUIT_SYMBOLS, isBout } from '@/lib/gameLogic';
import { motion } from 'framer-motion';

interface PlayingCardProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
  compact?: boolean;
  highlight?: boolean;
  delay?: number;
}

const isRed = (suit: string) => suit === 'diamonds' || suit === 'hearts';

export default function PlayingCard({ card, selected, onClick, faceDown, small, compact, highlight, delay = 0 }: PlayingCardProps) {
  const isTrump = card.type === 'trump';
  const isExcuse = card.type === 'excuse';
  const bout = isBout(card);

  // Colors
  let suitColor = '#1a1a2e';
  if (card.type === 'suit' && isRed(card.suit)) suitColor = '#d42b2b';
  if (isTrump) suitColor = '#b8860b';
  if (isExcuse) suitColor = '#6b21a8';

  if (faceDown) {
    return (
      <div style={{
        width: small ? 32 : 56, height: small ? 44 : 80,
        borderRadius: 7,
        background: 'linear-gradient(145deg, #1a3a24, #0d2014)',
        border: '1.5px solid rgba(80,150,90,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
      }}>
        <span style={{ fontSize: 10, color: 'rgba(245,200,66,0.4)', fontFamily: 'Cinzel, serif' }}>T</span>
      </div>
    );
  }

  const w = small ? 32 : compact ? 64 : 76;
  const h = small ? 44 : compact ? 92 : 108;
  const rankSize = small ? 9 : compact ? 13 : 15;
  const suitCenterSize = small ? 13 : compact ? 19 : 23;

  // Display values
  let displayRank = card.rank;
  let centerSymbol = '';

  if (card.type === 'suit') {
    centerSymbol = SUIT_SYMBOLS[card.suit] ?? '';
  } else if (isTrump) {
    centerSymbol = '\u2605'; // star for trump
  } else if (isExcuse) {
    displayRank = '\u2606';
    centerSymbol = '\u2606'; // star outline for excuse
  }

  // Border styles for bouts
  const boutBorder = bout ? '2px solid #d4a017' : undefined;
  const boutGlow = bout ? '0 0 12px rgba(212,160,23,0.5)' : undefined;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: delay * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
      onClick={onClick}
      style={{
        width: w, height: h,
        borderRadius: small ? 5 : 8,
        background: isTrump
          ? selected
            ? 'linear-gradient(180deg, #fff8e1 0%, #ffe0b2 100%)'
            : 'linear-gradient(180deg, #fffde7 0%, #fff3e0 100%)'
          : isExcuse
          ? selected
            ? 'linear-gradient(180deg, #f3e5f5 0%, #e1bee7 100%)'
            : 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)'
          : selected
          ? 'linear-gradient(180deg, #fffef8 0%, #faf8ee 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f5f3e8 100%)',
        border: selected
          ? '2px solid #d4a017'
          : highlight
          ? '2px solid #d42b2b'
          : boutBorder
          ?? '1.5px solid rgba(0,0,0,0.12)',
        boxShadow: selected
          ? '0 0 0 2px rgba(212,160,23,0.4), 0 6px 18px rgba(0,0,0,0.5)'
          : highlight
          ? '0 0 0 3px rgba(212,43,43,0.35), 0 4px 14px rgba(0,0,0,0.5)'
          : boutGlow
          ? `${boutGlow}, 0 3px 10px rgba(0,0,0,0.5)`
          : '0 3px 10px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Top-left rank + suit */}
      <div style={{ position: 'absolute', top: 2, left: 3, lineHeight: 1.1, textAlign: 'center' }}>
        <div style={{ fontSize: rankSize, fontWeight: 800, color: suitColor, fontFamily: 'Arial, sans-serif', lineHeight: 1 }}>
          {displayRank}
        </div>
        {!small && card.type === 'suit' && (
          <div style={{ fontSize: rankSize - 1, color: suitColor, lineHeight: 1 }}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
        )}
        {!small && isTrump && (
          <div style={{ fontSize: rankSize - 2, color: suitColor, lineHeight: 1 }}>
            \u2605
          </div>
        )}
      </div>

      {/* Center symbol */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: suitCenterSize, color: suitColor, lineHeight: 1,
      }}>
        {centerSymbol}
      </div>

      {/* Bout indicator */}
      {bout && !small && (
        <div style={{
          position: 'absolute', top: 1, right: 2,
          fontSize: 8, color: '#d4a017', fontWeight: 'bold',
        }}>
          B
        </div>
      )}

      {/* Bottom-right rank (rotated 180) */}
      {!small && (
        <div style={{
          position: 'absolute', bottom: 2, right: 3,
          lineHeight: 1.1, textAlign: 'center',
          transform: 'rotate(180deg)',
          transformOrigin: 'center center',
        }}>
          <div style={{ fontSize: rankSize, fontWeight: 800, color: suitColor, fontFamily: 'Arial, sans-serif', lineHeight: 1 }}>
            {displayRank}
          </div>
          {card.type === 'suit' && (
            <div style={{ fontSize: rankSize - 1, color: suitColor, lineHeight: 1 }}>
              {SUIT_SYMBOLS[card.suit]}
            </div>
          )}
          {isTrump && (
            <div style={{ fontSize: rankSize - 2, color: suitColor, lineHeight: 1 }}>
              \u2605
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
