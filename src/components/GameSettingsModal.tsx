import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BellRing, Vibrate, Zap, LogOut, Bug, ChevronRight } from 'lucide-react';

export type GameSettings = {
  animations: boolean;
  autoSort: boolean;
  cardSize: 'compact' | 'normal';
  sounds: boolean;
  haptic: boolean;
  confirmPlay: boolean;
  showHints: boolean;
};

const SETTINGS_KEY = 'tarot_game_settings';

export function loadGameSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {}
  return defaultSettings();
}

function defaultSettings(): GameSettings {
  return {
    animations: true,
    autoSort: false,
    cardSize: 'normal',
    sounds: true,
    haptic: true,
    confirmPlay: false,
    showHints: false,
  };
}

function saveSettings(s: GameSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

type Props = {
  open: boolean;
  onClose: () => void;
  onQuit: () => void;
  isRanked?: boolean;
};

export default function GameSettingsModal({ open, onClose, onQuit, isRanked }: Props) {
  const [settings, setSettings] = useState<GameSettings>(loadGameSettings);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [turnAlert, setTurnAlert] = useState(() => localStorage.getItem('tarot_turn_alert') !== 'false');

  useEffect(() => { saveSettings(settings); }, [settings]);

  const toggle = (key: keyof GameSettings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  const Section = ({ title }: { title: string }) => (
    <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2 mt-4 first:mt-0">{title}</p>
  );

  const Toggle = ({ label, desc, value, onToggle, icon }: {
    label: string; desc?: string; value: boolean; onToggle: () => void; icon?: React.ReactNode;
  }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-1 border-b border-white/5 active:opacity-70 transition-opacity"
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-slate-400">{icon}</span>}
        <div className="text-left">
          <p className="text-sm text-white font-medium">{label}</p>
          {desc && <p className="text-[11px] text-slate-500">{desc}</p>}
        </div>
      </div>
      <div
        className="w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0"
        style={{ background: value ? 'linear-gradient(135deg, #d4a017, #b8860b)' : 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: value ? '26px' : '4px' }}
        />
      </div>
    </button>
  );

  const cardSizes: { key: GameSettings['cardSize']; label: string }[] = [
    { key: 'compact', label: 'Compact' },
    { key: 'normal', label: 'Normal' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0f1e14 0%, #0a150e 100%)', borderLeft: '1px solid rgba(212,160,23,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-display text-base font-semibold text-white tracking-wide">Paramètres</p>
                <p className="text-[11px] text-slate-500">Préférences de jeu</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-2">

              <Section title="Affichage" />
              <Toggle label="Animations" desc="Animations de cartes et effets visuels" value={settings.animations} onToggle={() => toggle('animations')} icon={<Zap className="w-4 h-4" />} />

              {/* Taille des cartes */}
              <div className="py-3 border-b border-white/5">
                <p className="text-sm text-white font-medium mb-2">Taille des cartes</p>
                <div className="flex gap-2">
                  {cardSizes.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSettings(s => ({ ...s, cardSize: key }))}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: settings.cardSize === key ? 'linear-gradient(135deg, #d4a017, #b8860b)' : 'rgba(255,255,255,0.07)',
                        color: settings.cardSize === key ? '#0a150e' : '#94a3b8',
                        border: settings.cardSize === key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Section title="Son & Retour" />
              <Toggle label="Alerte de tour" desc="Sonnerie quand c'est ton tour" value={turnAlert} onToggle={() => { const next = !turnAlert; localStorage.setItem('tarot_turn_alert', String(next)); setTurnAlert(next); }} icon={<BellRing className="w-4 h-4" />} />
              <Toggle label="Vibration" desc="Retour haptique sur mobile" value={settings.haptic} onToggle={() => toggle('haptic')} icon={<Vibrate className="w-4 h-4" />} />

              <Section title="Jeu" />
              <Toggle label="Confirmation de coup" desc="Confirmer avant de jouer ses cartes" value={settings.confirmPlay} onToggle={() => toggle('confirmPlay')} />

              <Section title="Partie" />

              {/* Signaler un bug */}
              <a href="mailto:support@tarot-app.com?subject=Bug%20Tarot" className="w-full flex items-center justify-between py-3 px-1 border-b border-white/5 active:opacity-70 transition-opacity">
                <div className="flex items-center gap-3">
                  <Bug className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-white font-medium">Signaler un bug</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>

              {/* Quitter */}
              {!confirmQuit ? (
                <button
                  onClick={() => setConfirmQuit(true)}
                  className="w-full flex items-center gap-3 py-3 px-1 active:opacity-70 transition-opacity"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <div className="text-left">
                    <p className="text-sm text-red-400 font-medium">Quitter la partie</p>
                    {isRanked && <p className="text-[11px] text-slate-500">La partie sera sauvegardée, tu peux reprendre</p>}
                  </div>
                </button>
              ) : (
                <div className="py-3">
                  <p className="text-sm text-slate-300 mb-3">
                    {isRanked ? 'La partie sera sauvegardée. Reprendre depuis le lobby.' : 'Confirmer quitter la partie ?'}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmQuit(false)} className="flex-1 py-2 rounded-xl text-xs text-slate-300" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      Annuler
                    </button>
                    <button onClick={onQuit} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'rgba(239,68,68,0.8)' }}>
                      Quitter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
