import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const PACKS = [
  { key: 'starter', emoji: '⚡', label: 'Starter', elo: 1000, price: '0,99€', color: '#4ade80', glow: 'rgba(74,222,128,0.3)' },
  { key: 'pro', emoji: '🔥', label: 'Pro', elo: 5000, price: '3,99€', color: '#f5c842', glow: 'rgba(245,200,66,0.3)', badge: 'Populaire' },
  { key: 'champion', emoji: '💎', label: 'Champion', elo: 15000, price: '9,99€', color: '#67e8f9', glow: 'rgba(103,232,249,0.3)' },
];

export default function PaywallModal({ onClose, reason = 'buy' }: { onClose: () => void; reason?: 'zero' | 'buy' }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleBuy = async (pack: string) => {
    if (!session) {
      onClose();
      navigate('/');
      return;
    }
    setLoading(pack);
    setError('');
    try {
      const res = await fetch(
        'https://aidumgvazzuxjvnjpuuj.supabase.co/functions/v1/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pack }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data?.url) {
        setError(`Erreur ${res.status}: ${data?.error || data?.detail || data?.message || JSON.stringify(data)}`);
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Connexion impossible. Vérifie ta connexion internet.');
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end justify-center"
        style={{ background: 'rgba(5,16,10,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}>
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg mx-4 mb-8 p-5 rounded-3xl flex flex-col gap-4"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.3)', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>

          <div className="flex items-center justify-between">
            <div>
              {reason === 'zero' && (
                <p className="font-display text-xs tracking-[0.2em] uppercase text-red-400">TRZ épuisé</p>
              )}
              <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>
                {reason === 'zero' ? 'Rechargez votre TRZ' : 'Acheter des TRZ'}
              </h2>
              {reason === 'zero' && (
                <p className="text-xs text-slate-400 mt-0.5">Votre TRZ est à 0 — rechargez pour continuer à jouer</p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {PACKS.map((pack) => (
              <motion.button key={pack.key}
                onClick={() => handleBuy(pack.key)}
                disabled={!!loading}
                className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98] relative"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${pack.color}40`, boxShadow: `0 0 16px ${pack.glow}` }}>

                <span className="text-3xl">{pack.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base font-semibold" style={{ color: pack.color }}>
                      {pack.elo.toLocaleString('fr-FR')} TRZ
                    </p>
                    {pack.badge && (
                      <span className="text-[10px] font-display px-2 py-0.5 rounded-full"
                        style={{ background: pack.color, color: '#000' }}>{pack.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Pack {pack.label}</p>
                </div>
                <div className="text-right">
                  {loading === pack.key ? (
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: pack.color, borderTopColor: 'transparent' }} />
                  ) : (
                    <p className="font-display text-lg font-bold" style={{ color: pack.color }}>{pack.price}</p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {!session && (
            <p className="text-xs text-amber-400 text-center">Connecte-toi pour acheter des TRZ</p>
          )}
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
          <p className="text-[10px] text-slate-600 text-center">
            Paiement sécurisé via Stripe · Les TRZ sont crédités immédiatement
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
