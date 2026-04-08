import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gamepad2, Target, Settings, LogOut, Pencil, Check, X, Flame, Lock, Coins, ShieldCheck, Mail } from 'lucide-react';
import PaywallModal from '@/components/PaywallModal';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { containsForbiddenWord } from '@/lib/forbiddenWords';
import { translateError } from '@/lib/errorMessages';

const AVATAR_CATEGORIES = [
  { label: 'Animaux', emojis: ['🦁', '🐯', '🦊', '🐺', '🦅', '🐉', '🐻', '🦈', '🐍', '🦂', '🐘', '🦋'] },
  { label: 'Visages', emojis: ['🎭', '😎', '🥶', '🤠', '😈', '🤖', '👽', '💀', '🥷', '🧙', '👹', '🤡'] },
  { label: 'Symboles', emojis: ['🃏', '⚡', '🔥', '♠️', '♥️', '♦️', '♣️', '🎯', '🎲', '🎰', '🌙', '☀️'] },
  { label: 'Prestige', emojis: ['🏆', '🎖️', '🛡️', '⚔️', '🗡️', '🏅', '🌟', '✨', '💫', '🔱', '⭐', '🪬'] },
  { label: 'Exclusifs', emojis: [
    '🐲', '🦄', '🔮', '🧿', '💰', '🪙',
    '🫅', '🧛', '👸', '🦹', '🧜', '🧞',
    '💎', '👑',
  ]},
];
const AVATARS = AVATAR_CATEGORIES.flatMap(c => c.emojis);

type ExclCtx = { elo: number; isFirst: boolean; wins: number; games: number; winnings: number; verified: boolean; streak: number };

// Avatars exclusifs — progression addictive
const EXCLUSIVE: Record<string, { label: string; hint: string; check: (c: ExclCtx) => boolean }> = {
  // Victoires
  '🐲': { label: '10 victoires',       hint: 'Gagne 10 parties',            check: c => c.wins >= 10 },
  '🦄': { label: '25 victoires',       hint: 'Gagne 25 parties',            check: c => c.wins >= 25 },
  '🔮': { label: '50 victoires',       hint: 'Gagne 50 parties',            check: c => c.wins >= 50 },
  '🧿': { label: '100 victoires',      hint: 'Gagne 100 parties',           check: c => c.wins >= 100 },
  // Gains TRZ
  '💰': { label: '1 000 TRZ gagnés',   hint: 'Cumule 1 000 TRZ de gains',   check: c => c.winnings >= 1000 },
  '🪙': { label: '5 000 TRZ gagnés',   hint: 'Cumule 5 000 TRZ de gains',   check: c => c.winnings >= 5000 },
  // Parties jouées
  '🫅': { label: '50 parties',         hint: 'Joue 50 parties',             check: c => c.games >= 50 },
  '🧛': { label: '100 parties',        hint: 'Joue 100 parties',            check: c => c.games >= 100 },
  '👸': { label: '250 parties',        hint: 'Joue 250 parties',            check: c => c.games >= 250 },
  // Spéciaux
  '🦹': { label: 'Compte vérifié',     hint: 'Vérifie ton email',           check: c => c.verified },
  '🧜': { label: 'Streak de 5',        hint: 'Enchaîne 5 victoires',        check: c => c.streak >= 5 },
  '🧞': { label: 'Streak de 10',       hint: 'Enchaîne 10 victoires',       check: c => c.streak >= 10 },
  // Rang
  '💎': { label: 'Rang Diamant',       hint: 'Atteins 13 000 EXP',          check: c => c.elo >= 13000 },
  '👑': { label: '#1 du classement',   hint: 'Sois premier au classement',  check: c => c.isFirst },
};

const getDivision = (elo: number) => {
  if (elo >= 13000) return { label: 'Diamant', emoji: '💎', color: '#67e8f9', glow: 'rgba(103,232,249,0.25)' };
  if (elo >= 8500)  return { label: 'Or',      emoji: '🥇', color: '#fbbf24', glow: 'rgba(251,191,36,0.25)'  };
  if (elo >= 4000)  return { label: 'Argent',  emoji: '🥈', color: '#cbd5e1', glow: 'rgba(203,213,225,0.2)'  };
  return                  { label: 'Bronze',  emoji: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,0.2)'   };
};

const getStreak = (): number =>
  JSON.parse(localStorage.getItem('tarot_streak') || '{"count":0}').count;

type GameRow = { id: string; won: boolean; mode: string; elo_change: number | null; created_at: string };

export default function Profile() {
  const navigate = useNavigate();
  const { profile, user, loading, signOut, refreshProfile } = useAuth();
  const [history, setHistory] = useState<GameRow[]>([]);

  // Edition username
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Edition avatar
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [isLeaderFirst, setIsLeaderFirst] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const isVerified = !!profile?.email_verified;

  const streak = getStreak();

  useEffect(() => {
    if (!user) return;
    supabase.from('tarot_games')
      .select('id, won, mode, elo_change, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setHistory(data as GameRow[]); });
  }, [user]);

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus();
  }, [editingName]);

  // Stats — division basée sur le ranked TRZ (pas le portefeuille)
  const walletElo  = profile?.tarot_elo ?? 1000;
  const rankedElo  = profile?.tarot_ranked_elo ?? 1000;
  const div        = getDivision(rankedElo);
  const wins       = profile?.tarot_wins ?? 0;
  const games      = profile?.tarot_games_played ?? 0;
  const ratio      = games > 0 ? Math.round((wins / games) * 100) : 0;
  const totalWinnings = profile?.tarot_total_winnings ?? 0;

  const exclCtx: ExclCtx = { elo: rankedElo, isFirst: isLeaderFirst, wins, games, winnings: totalWinnings, verified: isVerified, streak };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const startEditName = () => {
    setNameInput(profile?.username ?? '');
    setEditingName(true);
  };

  const [nameError, setNameError] = useState('');

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !user || trimmed === profile?.username) { setEditingName(false); return; }
    const forbidden = containsForbiddenWord(trimmed);
    if (forbidden) { setNameError(`Le mot "${forbidden}" n'est pas autorisé.`); return; }
    setNameError('');
    setSavingName(true);
    await supabase.from('profiles').update({ username: trimmed }).eq('id', user.id);
    await refreshProfile();
    setSavingName(false);
    setEditingName(false);
  };

  const saveAvatar = async (emoji: string) => {
    if (!user) return;
    setSavingAvatar(true);
    await supabase.from('profiles').update({ avatar_emoji: emoji }).eq('id', user.id);
    await refreshProfile();
    setSavingAvatar(false);
    setShowAvatarPicker(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000)  return "Aujourd'hui";
    if (diff < 172800000) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center suit-pattern">
        <div className="w-10 h-10 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 suit-pattern">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center justify-between gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h1 className="font-display text-lg text-glow-gold">Profil</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-muted">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          {user && (
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-muted">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 relative z-10">

        {/* Avatar + nom */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2">

          {/* Avatar cliquable */}
          <button onClick={async () => {
          if (!user) return;
          // Vérifier si le joueur est #1
          const { data } = await supabase.from('profiles')
            .select('id').order('tarot_ranked_elo', { ascending: false }).limit(1).single();
          setIsLeaderFirst(data?.id === user.id);
          setShowAvatarPicker(true);
        }} className="relative group">
            <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center text-3xl neon-glow-gold gold-border transition-transform active:scale-95">
              {profile?.avatar_emoji ?? '🎭'}
            </div>
            {user && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#f5c842', border: '2px solid #071a0f' }}>
                <Pencil className="w-3 h-3 text-black" />
              </div>
            )}
          </button>

          {/* Username éditable */}
          {editingName ? (
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="flex items-center gap-2">
              <input ref={nameRef} value={nameInput}
                onChange={e => { setNameInput(e.target.value); setNameError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                maxLength={20}
                className="font-display text-lg text-center bg-transparent border-b-2 border-amber-400 outline-none text-white w-36"
              />
              <button onClick={saveName} disabled={savingName}
                className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-green-400" />
              </button>
              <button onClick={() => { setEditingName(false); setNameError(''); }}
                className="w-7 h-7 rounded-full bg-white/05 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
              </div>
              {nameError && <p className="text-xs text-red-400">{nameError}</p>}
            </div>
          ) : (
            <button onClick={() => user && startEditName()}
              className="flex items-center gap-2 group mt-1">
              <h2 className="font-display text-xl text-glow-gold flex items-center gap-1.5">
                {profile?.username ?? (user ? user.email?.split('@')[0] : 'Invité')}
                {isVerified && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              </h2>
              {user && <Pencil className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          )}

          {/* Badge de division */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full mt-1"
            style={{
              background: `linear-gradient(135deg, ${div.glow.replace('0.25', '0.15')}, rgba(7,26,15,0.9))`,
              border: `1.5px solid ${div.color}55`,
              boxShadow: `0 0 18px ${div.glow}, inset 0 0 12px ${div.glow.replace('0.25','0.08')}`,
            }}>
            <span className="text-lg leading-none">{div.emoji}</span>
            <span className="font-display text-sm font-bold tracking-wide" style={{ color: div.color, textShadow: `0 0 10px ${div.color}99` }}>
              {div.label}
            </span>
            <span className="text-[9px] font-display tracking-widest uppercase ml-0.5" style={{ color: div.color, opacity: 0.6 }}>
              {rankedElo >= 2000 ? 'MAX' : `${rankedElo} EXP`}
            </span>
          </motion.div>
          <div className="flex items-center gap-4 mt-1">
            <div className="text-center">
              <p className="font-display text-base font-bold text-amber-400">{walletElo.toLocaleString('fr-FR')}</p>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Portefeuille</p>
            </div>
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <p className="font-display text-base font-bold" style={{ color: div.color }}>{rankedElo.toLocaleString('fr-FR')}</p>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Score EXP</p>
            </div>
            <>
              <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="text-center">
                <p className="font-display text-base font-bold text-green-400">+{totalWinnings.toLocaleString('fr-FR')}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">Gains TRZ</p>
              </div>
            </>
          </div>
        </motion.div>

        {/* Recharger TRZ */}
        {user && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setShowPaywall(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl transition-all active:scale-95"
            style={{ background: 'rgba(245,200,66,0.1)', border: '1.5px solid rgba(245,200,66,0.3)', color: '#f5c842' }}>
            <Coins className="w-4 h-4" />
            <span className="font-display text-sm font-semibold">Recharger mon portefeuille</span>
          </motion.button>
        )}

        {/* Vérification email */}
        {user && !isVerified && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <p className="font-display text-sm font-semibold text-emerald-400">Validez votre compte</p>
            </div>
            <p className="text-xs text-slate-400">Vérifiez votre email pour débloquer les récompenses mensuelles et la cagnotte de saison.</p>

            {verificationSent ? (
              <p className="text-xs text-emerald-400 font-display">Email envoyé ! Vérifiez votre boîte de réception.</p>
            ) : editingEmail ? (
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
                  placeholder="Votre vraie adresse email"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-transparent outline-none text-white"
                  style={{ border: '1px solid rgba(16,185,129,0.3)' }}
                />
                {emailError && <p className="text-xs text-red-400">{emailError}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={sendingVerification}
                    onClick={async () => {
                      const email = emailInput.trim();
                      if (!email || !email.includes('@') || !email.includes('.')) { setEmailError('Adresse email invalide'); return; }
                      setSendingVerification(true);
                      setEmailError('');
                      const { error } = await supabase.auth.updateUser({ email });
                      if (error) { setEmailError(translateError(error.message)); setSendingVerification(false); return; }
                      setVerificationSent(true);
                      setSendingVerification(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-display text-sm font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                    <ShieldCheck className="w-4 h-4" />
                    {sendingVerification ? 'Envoi...' : 'Vérifier'}
                  </button>
                  <button onClick={() => { setEditingEmail(false); setEmailError(''); }}
                    className="px-3 py-2 rounded-xl text-xs text-slate-400"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>Annuler</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-slate-500">Email actuel : <span className="text-slate-300">{user.email}</span></p>
                <div className="flex gap-2">
                  <button
                    disabled={sendingVerification}
                    onClick={async () => {
                      setSendingVerification(true);
                      await supabase.auth.resend({ type: 'signup', email: user.email! });
                      setVerificationSent(true);
                      setSendingVerification(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-display text-sm font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                    <ShieldCheck className="w-4 h-4" />
                    {sendingVerification ? 'Envoi...' : 'Vérifier cet email'}
                  </button>
                  <button onClick={() => { setEditingEmail(true); setEmailInput(''); }}
                    className="px-3 py-2 rounded-xl font-display text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.25)', color: '#f5c842' }}>
                    Changer
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Victoires', value: String(wins),   icon: Trophy   },
            { label: 'Parties',   value: String(games),  icon: Gamepad2 },
            { label: 'Ratio',     value: `${ratio}%`,    icon: Target   },
            { label: 'Streak',    value: `${streak}🔥`,  icon: Flame    },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="wood-row p-3 rounded-xl text-center ornate-corners">
              <s.icon className="w-4 h-4 mx-auto mb-1 text-accent relative z-10" />
              <p className="font-display text-base relative z-10">{s.value}</p>
              <p className="text-[9px] text-muted-foreground relative z-10">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Historique */}
        <div>
          <h3 className="font-display text-sm mb-3 text-accent/70 tracking-wider">HISTORIQUE</h3>
          {!user && (
            <p className="text-xs text-slate-500 text-center py-4">Connecte-toi pour voir ton historique.</p>
          )}
          {user && history.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">Aucune partie jouée pour l'instant.</p>
          )}
          <div className="space-y-2">
            {history.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.04 }}
                className="wood-row p-3 rounded-xl flex items-center justify-between ornate-corners">
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-lg">{m.won ? '🏆' : '💔'}</span>
                  <div>
                    <p className="text-sm font-medium">
                      {m.mode === 'ranked' ? 'Classé' : m.mode === 'tournament' ? 'Tournoi' : m.mode === 'private' ? 'Privé' : 'Normal'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(m.created_at)}</p>
                  </div>
                </div>
                {m.elo_change !== null && (
                  <span className={`font-display text-sm font-bold relative z-10 ${m.won ? 'text-green-400' : 'text-red-400'}`}>
                    {m.won ? '+' : ''}{m.elo_change}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {!user && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            onClick={() => navigate('/')}
            className="w-full h-12 rounded-2xl font-display text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #d4a017, #f5c842)', boxShadow: '0 0 20px rgba(212,160,23,0.3)' }}>
            Se connecter / Créer un compte
          </motion.button>
        )}
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="buy" />}

      {/* Avatar picker */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-center"
            style={{ background: 'rgba(5,16,10,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowAvatarPicker(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-4 mb-8 p-5 rounded-3xl"
              style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.3)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-display text-xs tracking-[0.2em] uppercase text-emerald-600">Personnalisation</p>
                  <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>Choisis ton avatar</h2>
                </div>
                <button onClick={() => setShowAvatarPicker(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(245,200,66,0.2) transparent' }}>
                {AVATAR_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <p className="font-display text-[10px] tracking-[0.2em] uppercase mb-2"
                      style={{ color: 'rgba(245,200,66,0.5)' }}>{cat.label}</p>
                    <div className="grid grid-cols-6 gap-2">
                      {cat.emojis.map(emoji => {
                        const excl = EXCLUSIVE[emoji];
                        const locked = excl ? !excl.check(exclCtx) : false;
                        const isSelected = profile?.avatar_emoji === emoji;
                        return (
                          <div key={emoji} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => !locked && saveAvatar(emoji)}
                              disabled={savingAvatar || locked}
                              className="w-full h-12 rounded-2xl text-2xl flex items-center justify-center transition-all active:scale-90 relative"
                              style={{
                                background: isSelected
                                  ? 'linear-gradient(135deg, rgba(245,200,66,0.25), rgba(245,200,66,0.1))'
                                  : locked ? 'rgba(255,255,255,0.02)'
                                  : 'rgba(255,255,255,0.04)',
                                border: `2px solid ${isSelected ? '#f5c842' : locked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
                                boxShadow: isSelected ? '0 0 12px rgba(245,200,66,0.2)' : 'none',
                                opacity: locked ? 0.45 : 1,
                              }}>
                              {locked ? <Lock className="w-4 h-4 text-slate-600" /> : emoji}
                              {excl && !locked && (
                                <span className="absolute -top-1.5 -right-1.5 text-[8px] px-1 rounded-full font-bold"
                                  style={{ background: emoji === '👑' ? '#f5c842' : '#67e8f9', color: '#000' }}>
                                  ✦
                                </span>
                              )}
                            </button>
                            {excl && locked && (
                              <p className="text-[7px] text-slate-600 text-center leading-tight px-0.5">{excl.hint}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
