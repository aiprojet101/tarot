import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, X, Copy, Check, UserCircle2, Share2, MessageCircle, Mail, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const APP_URL = 'https://tarot.vercel.app';
const INVITE_MESSAGE = `🃏 Viens jouer au Tarot avec moi !\n\nLe Tarot francais en ligne — encheres, atouts, strategie. Affronte des joueurs reels et monte en division 🏆\n\n👉 ${APP_URL}`;

type Player = {
  id: string;
  username: string | null;
  avatar_emoji: string;
  tarot_ranked_elo: number;
  tarot_games_played: number;
  tarot_wins: number;
  is_founder?: boolean;
};

const getDivision = (elo: number) => {
  if (elo >= 13000) return { label: 'Diamant', emoji: '💎', color: '#67e8f9' };
  if (elo >= 8500)  return { label: 'Or',      emoji: '🥇', color: '#fbbf24' };
  if (elo >= 4000)  return { label: 'Argent',  emoji: '🥈', color: '#cbd5e1' };
  return                  { label: 'Bronze',  emoji: '🥉', color: '#cd7f32' };
};

export default function Social() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [recent, setRecent] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  // Joueurs récemment actifs (classés par TRZ, hors moi)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, tarot_ranked_elo, tarot_games_played, tarot_wins, is_founder')
        .neq('id', user.id)
        .gt('tarot_games_played', 0)
        .order('tarot_ranked_elo', { ascending: false })
        .limit(10);
      if (data) setRecent(data as Player[]);
      setLoading(false);
    })();
  }, [user]);

  // Recherche par username
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, tarot_ranked_elo, tarot_games_played, tarot_wins, is_founder')
        .ilike('username', `%${query.trim()}%`)
        .neq('id', user?.id ?? '')
        .limit(10);
      if (data) setResults(data as Player[]);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const handleInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tarot — Jeu de cartes francais',
          text: INVITE_MESSAGE,
          url: APP_URL,
        });
        return;
      } catch { /* annulé par l'utilisateur */ }
    }
    // Fallback : modal desktop
    setShowShareModal(true);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(INVITE_MESSAGE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      label: 'WhatsApp',
      emoji: '💬',
      color: '#25d366',
      bg: 'rgba(37,211,102,0.1)',
      border: 'rgba(37,211,102,0.3)',
      href: `https://wa.me/?text=${encodeURIComponent(INVITE_MESSAGE)}`,
    },
    {
      label: 'Telegram',
      emoji: '✈️',
      color: '#2aabee',
      bg: 'rgba(42,171,238,0.1)',
      border: 'rgba(42,171,238,0.3)',
      href: `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(INVITE_MESSAGE)}`,
    },
    {
      label: 'SMS',
      emoji: '📱',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
      border: 'rgba(167,139,250,0.3)',
      href: `sms:?body=${encodeURIComponent(INVITE_MESSAGE)}`,
    },
    {
      label: 'Email',
      emoji: '📧',
      color: '#f5c842',
      bg: 'rgba(245,200,66,0.1)',
      border: 'rgba(245,200,66,0.3)',
      href: `mailto:?subject=${encodeURIComponent('Rejoins-moi sur Tarot 🃏')}&body=${encodeURIComponent(INVITE_MESSAGE)}`,
    },
  ];

  const displayed = query.trim() ? results : recent;

  return (
    <div className="min-h-screen pb-24 suit-pattern">
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <Users className="w-5 h-5 text-accent" />
        <h1 className="font-display text-base text-glow-gold">Joueurs</h1>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4 relative z-10">

        {/* Inviter un ami */}
        <motion.button initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onClick={handleInvite}
          className="w-full p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.35)', boxShadow: '0 0 24px rgba(245,200,66,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.25)' }}>
              🃏
            </div>
            <div className="text-left">
              <p className="font-display text-sm font-bold text-white">Inviter un ami</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Partager l'app · WhatsApp, SMS, email...</p>
            </div>
          </div>
          <Share2 className="w-4 h-4 text-amber-400" />
        </motion.button>

        {/* Recherche */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un joueur..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-600 font-display"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </motion.div>

        {/* Liste */}
        <div>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600 mb-3">
            {query.trim() ? `Résultats (${results.length})` : 'Joueurs actifs'}
          </p>

          {loading && !query && (
            <div className="flex flex-col gap-2">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          )}

          {searching && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {!searching && displayed.map((p, i) => {
              const div = getDivision(p.tarot_ranked_elo);
              const ratio = p.tarot_games_played > 0 ? Math.round((p.tarot_wins / p.tarot_games_played) * 100) : 0;
              return (
                <motion.div key={p.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="mb-2 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ background: 'linear-gradient(145deg, #0a1f10, #071a0f)', border: '1.5px solid rgba(255,255,255,0.06)' }}
                  onClick={() => navigate(`/profile/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${div.color}30` }}>
                      {p.avatar_emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {p.is_founder && <span className="text-sm">👑</span>}
                        <p className={`font-display text-sm font-semibold ${p.is_founder ? 'text-yellow-300' : 'text-white'}`}>
                          {p.username ?? 'Joueur'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px]" style={{ color: div.color }}>{div.emoji} {div.label}</span>
                        <span className="text-[10px] text-slate-600">· {ratio}% wins</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-white">{p.tarot_ranked_elo} <span className="text-[9px] text-slate-500 font-normal">EXP</span></p>
                    <p className="text-[9px] text-slate-600">{p.tarot_games_played} parties</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!loading && !searching && displayed.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12">
              <UserCircle2 className="w-12 h-12 text-slate-700" />
              <p className="font-display text-slate-500 text-sm">
                {query ? 'Aucun joueur trouvé' : 'Aucun joueur actif pour l\'instant'}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Share modal (fallback desktop) */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-center"
            style={{ background: 'rgba(5,16,10,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowShareModal(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-4 mb-8 rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.3)', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>

              {/* Message preview */}
              <div className="p-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display text-xs tracking-[0.2em] uppercase text-emerald-600">Invitation</p>
                    <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>Inviter un ami</h2>
                  </div>
                  <button onClick={() => setShowShareModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Message preview card */}
                <div className="p-4 rounded-2xl mb-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{INVITE_MESSAGE}</p>
                </div>

                {/* Share buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {shareOptions.map(opt => (
                    <a key={opt.label} href={opt.href} target="_blank" rel="noreferrer"
                      onClick={() => setShowShareModal(false)}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.97]"
                      style={{ background: opt.bg, border: `1.5px solid ${opt.border}` }}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <p className="font-display text-sm font-semibold" style={{ color: opt.color }}>{opt.label}</p>
                    </a>
                  ))}
                </div>

                {/* Copy */}
                <button onClick={() => { copyInvite(); setShowShareModal(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all active:scale-[0.98]"
                  style={{ background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span className="font-display text-sm" style={{ color: copied ? '#4ade80' : '#94a3b8' }}>
                    {copied ? 'Copié !' : 'Copier le message'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
