import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, Coins, Zap, Trophy, Swords, Users, ChevronRight, Crown, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';
import PrivateRoomModal from '@/components/PrivateRoomModal';
import NotificationPanel from '@/components/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';

const getDivision = (elo: number) => {
  if (elo >= 13000) return { label: 'Diamant', emoji: '💎', color: '#67e8f9', glow: 'rgba(103,232,249,0.3)', border: 'rgba(103,232,249,0.4)', difficulty: 'hard' };
  if (elo >= 8500) return { label: 'Or', emoji: '🥇', color: '#fbbf24', glow: 'rgba(251,191,36,0.3)', border: 'rgba(251,191,36,0.4)', difficulty: 'hard' };
  if (elo >= 4000) return { label: 'Argent', emoji: '🥈', color: '#cbd5e1', glow: 'rgba(203,213,225,0.3)', border: 'rgba(203,213,225,0.4)', difficulty: 'normal' };
  return { label: 'Bronze', emoji: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,0.3)', border: 'rgba(205,127,50,0.4)', difficulty: 'easy' };
};

const getElo = (profileElo?: number) => profileElo ?? parseInt(localStorage.getItem('tarot_elo') || '1000');
const getRankedElo = (profile?: { tarot_ranked_elo?: number; tarot_elo?: number } | null) =>
  profile?.tarot_ranked_elo ?? 1000;

const quickModes = [
  { icon: Zap, label: 'Rapide', desc: '5 min' },
  { icon: Swords, label: 'Classé', desc: 'EXP' },
  { icon: Trophy, label: 'Tournoi', desc: 'Top 3' },
  { icon: Users, label: 'Privé', desc: 'Amis' },
];

const difficulties = [
  {
    key: 'easy',
    emoji: '🌱',
    label: 'Débutant',
    desc: 'Joueurs qui font des erreurs, idéal pour apprendre',
    color: '#4ade80',
    glow: 'rgba(74,222,128,0.3)',
    border: 'rgba(74,222,128,0.4)',
  },
  {
    key: 'normal',
    emoji: '⚔️',
    label: 'Intermédiaire',
    desc: 'Joueurs équilibrés, une vraie partie de jeu',
    color: '#f5c842',
    glow: 'rgba(245,200,66,0.3)',
    border: 'rgba(245,200,66,0.4)',
  },
  {
    key: 'hard',
    emoji: '🔥',
    label: 'Expert',
    desc: 'Joueurs redoutables, ils ne vous feront aucun cadeau',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.3)',
    border: 'rgba(248,113,113,0.4)',
  },
];


export default function Lobby() {
  const navigate = useNavigate();
  const { profile, user, loading, refreshProfile } = useAuth();
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showRanked, setShowRanked] = useState(false);
  const currentElo = getElo(profile?.tarot_elo);
  const currentDiv = getDivision(getRankedElo(profile));
  const [showTournament, setShowTournament] = useState(false);
  const [tournamentStep, setTournamentStep] = useState<'difficulty' | 'limit'>('difficulty');
  const [tournamentDifficulty, setTournamentDifficulty] = useState<string>('normal');
  const [showPaywall, setShowPaywall] = useState(false);
  const [quickStep, setQuickStep] = useState<'difficulty' | 'stake'>('difficulty');
  const [quickDifficulty, setQuickDifficulty] = useState<string>('normal');
  const [quickMode, setQuickMode] = useState<'4p' | '3mort'>('4p');
  const [launching, setLaunching] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [prizePool, setPrizePool] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAllRead, deleteNotification, deleteAllNotifications } = useNotifications();

  // Parties en cours détectées depuis localStorage — initialisé synchrone au montage
  const [resumableSave, setResumableSave] = useState<{ type: 'ranked' | 'tournament' | 'quick'; label: string; state: any } | null>(() => {
    try {
      const ranked = localStorage.getItem('tarot_ranked_game');
      if (ranked) {
        const p = JSON.parse(ranked);
        if (p?.gs && !p.gs.gameOver && Date.now() - p.ts < 4 * 60 * 60 * 1000)
          return { type: 'ranked', label: 'Partie classée', state: p };
      }
      const tournament = localStorage.getItem('tarot_tournament_game');
      if (tournament) {
        const p = JSON.parse(tournament);
        if (p?.gs && !p.gs.gameOver && Date.now() - p.ts < 4 * 60 * 60 * 1000)
          return { type: 'tournament', label: 'Partie tournoi', state: p };
      }
      const solo = localStorage.getItem('tarot_solo_game');
      if (solo) {
        const p = JSON.parse(solo);
        if (p?.gs && !p.gs.gameOver && Date.now() - p.ts < 4 * 60 * 60 * 1000)
          return { type: 'quick', label: 'Partie rapide', state: p };
      }
    } catch {}
    return null;
  });
  const [myActiveRoom, setMyActiveRoom] = useState<string | null>(null);
  const [myActiveRoomSolo, setMyActiveRoomSolo] = useState(false);

  // Bfcache (back button mobile) + focus : re-scanner localStorage à chaque retour sur la page
  useEffect(() => {
    const checkLS = () => {
      try {
        const ranked = localStorage.getItem('tarot_ranked_game');
        if (ranked) {
          const p = JSON.parse(ranked);
          if (p?.gs && !p.gs.gameOver && Date.now() - p.ts < 4 * 60 * 60 * 1000) {
            setResumableSave({ type: 'ranked', label: 'Partie classée', state: p });
            return;
          }
        }
        const tournament = localStorage.getItem('tarot_tournament_game');
        if (tournament) {
          const p = JSON.parse(tournament);
          if (p?.gs && !p.gs.gameOver && Date.now() - p.ts < 4 * 60 * 60 * 1000) {
            setResumableSave({ type: 'tournament', label: 'Partie tournoi', state: p });
            return;
          }
        }
        const solo = localStorage.getItem('tarot_solo_game');
        if (solo) {
          const p = JSON.parse(solo);
          if (p?.gs && !p.gs.gameOver && Date.now() - p.ts < 4 * 60 * 60 * 1000) {
            setResumableSave({ type: 'quick', label: 'Partie rapide', state: p });
            return;
          }
        }
      } catch {}
      setResumableSave(null);
    };
    // pageshow couvre le bfcache (retour arrière mobile)
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) checkLS(); };
    // visibilitychange couvre le retour depuis une autre app
    const onVisible = () => { if (document.visibilityState === 'visible') checkLS(); };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkLS);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', checkLS);
    };
  }, []);

  // Rediriger si non connecté après restauration de session
  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user]);

  // Rafraîchir l'TRZ + salons actifs + rang à chaque retour sur le Lobby
  useEffect(() => {
    refreshProfile();
    const freshThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    supabase.from('tarot_season').select('prize_pool').eq('id', 1).single()
      .then(({ data }) => { if (data) setPrizePool(data.prize_pool); });
    supabase.from('rooms').select('code, players, stake, status')
      .eq('status', 'waiting').gt('created_at', freshThreshold)
      .order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => { if (data) setActiveRooms(data); });
    if (user) {
      supabase.from('profiles')
        .select('id')
        .order('tarot_ranked_elo', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const rank = data.findIndex(p => p.id === user.id);
            if (rank >= 0) setMyRank(rank + 1);
          }
        });
      // Détecter salon privé en cours
      supabase.from('rooms').select('code, status, players')
        .eq('status', 'playing')
        .then(({ data }) => {
          if (data) {
            const myRoom = data.find((r: any) => r.players?.some((p: any) => p.id === user.id));
            setMyActiveRoom(myRoom?.code ?? null);
            setMyActiveRoomSolo(myRoom ? (myRoom.players?.length ?? 0) <= 1 : false);
          }
        });
    }
  }, [user]);


  const deductAndNavigate = async (path: string, state: object, cost: number) => {
    if (launching) return;
    if (currentElo < cost) { setShowPaywall(true); return; }
    setLaunching(true);
    if (user) {
      await supabase.rpc('update_elo_balance', { uid: user.id, delta: -cost });
      if ('ranked' in state) {
        await supabase.rpc('add_to_season_pool', { amount: cost });
        localStorage.removeItem('tarot_ranked_game');
      }
      if ('tournament' in state) {
        localStorage.removeItem('tarot_tournament_game');
      }
      await refreshProfile();
    }
    navigate(path, { state });
    setLaunching(false);
  };

  // Attendre que la session soit restaurée après un refresh
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
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center justify-between gold-border" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-lg gold-border">
            {profile?.avatar_emoji ?? '🎭'}
          </div>
          <div>
            <p className="font-semibold text-sm">{profile?.username ?? (user ? 'Joueur' : 'Invité')}</p>
            <p className="text-xs text-muted-foreground">{currentDiv.emoji} {currentDiv.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaywall(true)}
            className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-full gold-border hover:bg-accent/10 transition-colors">
            <Coins className="w-4 h-4 text-accent" />
            <span className="font-display text-sm text-accent">{currentElo.toLocaleString('fr-FR')}</span>
          </button>
          <button onClick={() => { setShowNotifications(true); markAllRead(); }}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Play Now CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={() => setShowDifficulty(true)}
            className="w-full h-16 text-xl font-display gradient-gold text-primary-foreground border-0 neon-glow-gold hover:scale-[1.01] transition-transform rounded-xl gold-border"
          >
            <Crown className="w-6 h-6 mr-3" />
            Jouer maintenant
          </Button>
        </motion.div>

        {/* Bannière partie en cours */}
        {(resumableSave || myActiveRoom) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid rgba(245,200,66,0.4)', background: 'linear-gradient(135deg, rgba(15,42,24,0.95), rgba(7,26,15,0.95))', boxShadow: '0 0 20px rgba(245,200,66,0.15)' }}>
            {resumableSave && (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-2xl">🃏</span>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-white">{resumableSave.label} en cours</p>
                  <p className="text-[10px] text-slate-400">Reprends là où tu t'es arrêté</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (resumableSave.type === 'ranked') navigate('/game', { state: { difficulty: resumableSave.state.gs.difficulty ?? 'normal', ranked: resumableSave.state.mode } });
                      else if (resumableSave.type === 'tournament') navigate('/game', { state: { difficulty: resumableSave.state.gs.difficulty ?? 'normal', tournament: resumableSave.state.mode } });
                      else navigate('/game', { state: { difficulty: resumableSave.state.gs.difficulty ?? 'normal', stake: resumableSave.state.stake, deadHand: resumableSave.state.deadHand } });
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-display font-bold"
                    style={{ background: 'linear-gradient(135deg, #f5c842, #d4a017)', color: '#000' }}>
                    Reprendre
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Abandonner cette partie ? Tu perdras ta progression.')) {
                        localStorage.removeItem(resumableSave.type === 'ranked' ? 'tarot_ranked_game' : resumableSave.type === 'tournament' ? 'tarot_tournament_game' : 'tarot_solo_game');
                        setResumableSave(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-display text-slate-400"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Abandonner
                  </button>
                </div>
              </div>
            )}
            {myActiveRoom && (
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: resumableSave ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span className="text-2xl">🏠</span>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-white">Salon privé #{myActiveRoom}</p>
                  <p className="text-[10px] text-slate-400">Une partie est en cours dans ce salon</p>
                </div>
                <div className="flex gap-2">
                  {myActiveRoomSolo && (
                    <button
                      onClick={async () => {
                        await supabase.from('rooms').delete().eq('code', myActiveRoom!);
                        setMyActiveRoom(null);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-display text-slate-400"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Quitter
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/room/${myActiveRoom}`)}
                    className="px-3 py-1.5 rounded-xl text-xs font-display font-bold"
                    style={{ background: 'linear-gradient(135deg, #f5c842, #d4a017)', color: '#000' }}>
                    Rejoindre
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Modes */}
        <div className="grid grid-cols-4 gap-2">
          {quickModes.map((mode, i) => (
            <motion.button
              key={mode.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => {
                if (mode.label === 'Rapide') { setShowDifficulty(true); return; }
                if (mode.label === 'Tournoi') { setTournamentStep('difficulty'); setShowTournament(true); return; }
                if (mode.label === 'Classé') { setShowRanked(true); return; }
                if (mode.label === 'Privé') { setShowPrivate(true); return; }
                navigate('/rooms');
              }}
              className="wood-row hover-glow p-3 flex flex-col items-center gap-1.5 rounded-lg ornate-corners"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/30 flex items-center justify-center border border-border">
                <mode.icon className="w-5 h-5 text-accent" />
              </div>
              <span className="text-xs font-medium relative z-10">{mode.label}</span>
              <span className="text-[10px] text-muted-foreground relative z-10">{mode.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* Rooms shortcut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <button
            onClick={() => navigate('/rooms')}
            className="w-full wood-row hover-glow p-4 rounded-lg flex items-center justify-between ornate-corners"
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center border border-border">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Voir les salons</p>
                <p className="text-xs text-muted-foreground">{activeRooms.length > 0 ? `${activeRooms.length} salon${activeRooms.length > 1 ? 's' : ''} ouvert${activeRooms.length > 1 ? 's' : ''}` : 'Rejoindre ou créer un salon'}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground relative z-10" />
          </button>
        </motion.div>

        {/* Salons ouverts */}
        {activeRooms.length > 0 && (
          <div>
            <h2 className="font-display text-sm mb-3 text-accent/70 tracking-wider">SALONS OUVERTS</h2>
            <div className="space-y-2">
              {activeRooms.map((room, i) => (
                <motion.button key={room.code}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  onClick={() => navigate('/rooms')}
                  className="w-full wood-row hover-glow p-3 rounded-lg flex items-center justify-between ornate-corners">
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-2xl">🃏</span>
                    <div className="text-left">
                      <p className="font-medium text-sm">Salon #{room.code}</p>
                      <p className="text-xs text-muted-foreground">{room.stake} TRZ · {4 - room.players.length} place{4 - room.players.length > 1 ? 's' : ''} libre{4 - room.players.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <p className="text-sm font-display text-accent">{room.players.length}/4</p>
                    <p className="text-[10px] text-muted-foreground">joueurs</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Difficulty selector overlay */}
      <AnimatePresence>
        {showDifficulty && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center"
            style={{ background: 'rgba(5,16,10,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDifficulty(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-4 mb-8 p-5 rounded-3xl flex flex-col gap-4"
              style={{
                background: 'linear-gradient(145deg, #0f2a18, #071a0f)',
                border: '1.5px solid rgba(212,160,23,0.3)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xs tracking-[0.2em] uppercase text-emerald-600">Partie Rapide</p>
                  <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>
                    {quickStep === 'difficulty' ? 'Choisissez votre niveau' : 'Choisissez votre mise'}
                  </h2>
                </div>
                <button onClick={() => { setShowDifficulty(false); setQuickStep('difficulty'); setQuickMode('4p'); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {quickStep === 'difficulty' ? (
                <div className="flex flex-col gap-3">
                  {/* Mode toggle */}
                  <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {([
                      { key: '4p',    emoji: '👥', label: '4 joueurs',    sub: 'Standard' },
                      { key: '3mort', emoji: '💀', label: '3 + Le Mort', sub: 'Classique vietnamien' },
                    ] as const).map(m => {
                      const active = quickMode === m.key;
                      return (
                        <button key={m.key} onClick={() => setQuickMode(m.key)}
                          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-xl transition-all duration-200"
                          style={{
                            background: active ? 'rgba(245,200,66,0.12)' : 'transparent',
                            border: active ? '1.5px solid rgba(245,200,66,0.45)' : '1.5px solid transparent',
                          }}>
                          <span className="text-xl">{m.emoji}</span>
                          <p className="font-display text-xs font-semibold" style={{ color: active ? '#f5c842' : '#94a3b8' }}>{m.label}</p>
                          <p className="text-[9px]" style={{ color: active ? '#a16207' : '#475569' }}>{m.sub}</p>
                        </button>
                      );
                    })}
                  </div>

                  {difficulties.map((d, i) => (
                    <motion.button key={d.key} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => { setQuickDifficulty(d.key); setQuickStep('stake'); }}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${d.border}`, boxShadow: `0 0 16px ${d.glow}` }}>
                      <span className="text-3xl">{d.emoji}</span>
                      <div className="flex-1">
                        <p className="font-display text-base font-semibold" style={{ color: d.color }}>{d.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{d.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5" style={{ color: d.color }} />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500 text-center -mt-1">Mise déduite au lancement · Gains et pertes nets</p>
                  {(quickDifficulty === 'easy'
                    ? [
                        { elo: 25,  label: 'Petite partie',  emoji: '🌿', color: '#4ade80', glow: 'rgba(74,222,128,0.25)' },
                        { elo: 50,  label: 'Partie normale',  emoji: '⚡', color: '#f5c842', glow: 'rgba(245,200,66,0.25)', badge: 'Recommandé' },
                        { elo: 100, label: 'Grosse partie',   emoji: '🔥', color: '#f87171', glow: 'rgba(248,113,113,0.25)' },
                      ]
                    : quickDifficulty === 'normal'
                    ? [
                        { elo: 200,  label: 'Petite partie',  emoji: '🌿', color: '#4ade80', glow: 'rgba(74,222,128,0.25)' },
                        { elo: 500,  label: 'Partie normale',  emoji: '⚡', color: '#f5c842', glow: 'rgba(245,200,66,0.25)', badge: 'Recommandé' },
                        { elo: 1000, label: 'Grosse partie',   emoji: '🔥', color: '#f87171', glow: 'rgba(248,113,113,0.25)' },
                      ]
                    : [
                        { elo: 1000, label: 'Petite partie',  emoji: '🌿', color: '#4ade80', glow: 'rgba(74,222,128,0.25)' },
                        { elo: 1500, label: 'Partie normale',  emoji: '⚡', color: '#f5c842', glow: 'rgba(245,200,66,0.25)', badge: 'Recommandé' },
                        { elo: 3000, label: 'Grosse partie',   emoji: '🔥', color: '#f87171', glow: 'rgba(248,113,113,0.25)' },
                      ]
                  ).map((s, i) => (
                    <motion.button key={s.elo} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={async () => {
                        await deductAndNavigate('/game', { difficulty: quickDifficulty, stake: s.elo, deadHand: quickMode === '3mort' }, s.elo);
                        setShowDifficulty(false); setQuickStep('difficulty'); setQuickMode('4p');
                      }}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98] relative"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${s.color}40`, boxShadow: `0 0 14px ${s.glow}` }}>
                      {s.badge && <span className="absolute top-2 left-[105px] text-[10px] font-display px-2 py-0.5 rounded-full" style={{ background: s.color, color: '#000' }}>{s.badge}</span>}
                      <span className="text-3xl">{s.emoji}</span>
                      <div className="flex-1">
                        <p className="font-display text-base font-semibold" style={{ color: s.color }}>{s.elo} TRZ</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-400 font-display">+{s.elo} TRZ</p>
                        <p className="text-xs text-red-400 font-display">-{s.elo} TRZ</p>
                      </div>
                    </motion.button>
                  ))}
                  <button onClick={() => setQuickStep('difficulty')} className="text-xs text-slate-500 underline text-center mt-1">
                    ← Changer de niveau
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ranked selector */}
      <AnimatePresence>
        {showRanked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center"
            style={{ background: 'rgba(5,16,10,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowRanked(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-4 mb-8 p-5 rounded-3xl flex flex-col gap-4"
              style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.3)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xs tracking-[0.2em] uppercase text-emerald-600">Partie Classée</p>
                  <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>Votre classement</h2>
                </div>
                <button onClick={() => setShowRanked(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Current rank card */}
              <div className="p-5 rounded-2xl flex items-center gap-5"
                style={{ background: `linear-gradient(135deg, rgba(5,16,10,0.9), rgba(15,42,24,0.9))`, border: `1.5px solid ${currentDiv.border}`, boxShadow: `0 0 30px ${currentDiv.glow}` }}>
                <span className="text-5xl">{currentDiv.emoji}</span>
                <div className="flex-1">
                  <p className="font-display text-xl font-bold" style={{ color: currentDiv.color }}>{currentDiv.label}</p>
                  <p className="font-display text-3xl font-bold text-white mt-0.5">{getRankedElo(profile)} <span className="text-sm text-slate-400 font-normal">EXP</span></p>
                </div>
                <TrendingUp className="w-6 h-6" style={{ color: currentDiv.color }} />
              </div>

              {/* Divisions info */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { emoji: '🥉', label: 'Bronze', min: 0, max: 1199, color: '#cd7f32' },
                  { emoji: '🥈', label: 'Argent', min: 1200, max: 1599, color: '#cbd5e1' },
                  { emoji: '🥇', label: 'Or', min: 1600, max: 1999, color: '#fbbf24' },
                  { emoji: '💎', label: 'Diamant', min: 2000, max: null, color: '#67e8f9' },
                ].map(d => {
                  const active = currentDiv.label === d.label;
                  return (
                    <div key={d.label} className="flex flex-col items-center gap-1 p-2 rounded-xl"
                      style={{ background: active ? `rgba(255,255,255,0.06)` : 'transparent', border: active ? `1px solid ${d.color}40` : '1px solid transparent' }}>
                      <span className="text-xl">{d.emoji}</span>
                      <p className="text-[9px] font-display" style={{ color: active ? d.color : '#475569' }}>{d.label}</p>
                      <p className="text-[8px] text-slate-600">{d.min}{d.max ? `-${d.max}` : '+'}</p>
                    </div>
                  );
                })}
              </div>

              {/* Paliers de mise */}
              <div>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600">Choisissez votre engagement</p>
                <p className="text-[10px] text-cyan-400 mt-0.5">
                  Jouez 5 parties ce mois pour participer à la cagnotte de saison
                  {prizePool !== null && <span className="font-bold ml-1">— {prizePool.toLocaleString('fr-FR')} TRZ</span>}
                </p>
                {user && !profile?.email_verified && (
                  <p className="text-[10px] text-amber-400/70 mt-0.5">Cagnotte réservée aux comptes vérifiés</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Prudent',   icon: '🛡️', mise: 25,  gain: 75,  perte: 15, color: '#4ade80', bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.25)'  },
                  { label: 'Standard',  icon: '⚔️', mise: 75,  gain: 225, perte: 45, color: '#f5c842', bg: 'rgba(245,200,66,0.07)',  border: 'rgba(245,200,66,0.3)',  badge: 'Recommandé' },
                  { label: 'Audacieux', icon: '🔥', mise: 150, gain: 450, perte: 90, color: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.25)' },
                ].map(p => (
                  <button key={p.label}
                    onClick={async () => {
                      await deductAndNavigate('/game', { difficulty: currentDiv.difficulty, ranked: { elo: getRankedElo(profile), division: currentDiv.label, gain: p.gain, perte: p.perte, mise: p.mise } }, p.mise);
                      setShowRanked(false);
                    }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98] relative"
                    style={{ background: p.bg, border: `1.5px solid ${p.border}` }}>
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-sm font-bold" style={{ color: p.color }}>{p.label}</p>
                        {p.badge && (
                          <span className="text-[9px] font-display px-1.5 py-0.5 rounded-full"
                            style={{ background: p.color, color: '#000' }}>{p.badge}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Mise {p.mise} TRZ · <span className="text-green-400">+{p.gain - p.mise} net si victoire</span> · <span className="text-red-400">-{p.perte} net si défaite</span></p>
                    </div>
                    <p className="font-display text-base font-bold" style={{ color: p.color }}>{p.mise}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setShowRanked(false); setShowPaywall(true); }}
                className="h-9 rounded-xl font-display text-xs font-semibold active:scale-95 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5c842' }}>
                + Recharger mon portefeuille
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament selector */}
      <AnimatePresence>
        {showTournament && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center"
            style={{ background: 'rgba(5,16,10,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowTournament(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-4 mb-8 p-5 rounded-3xl flex flex-col gap-4"
              style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.3)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xs tracking-[0.2em] uppercase text-emerald-600">Tournoi</p>
                  <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>
                    {tournamentStep === 'difficulty' ? 'Choisissez votre niveau' : 'Limite de points'}
                  </h2>
                </div>
                <button onClick={() => setShowTournament(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {tournamentStep === 'difficulty' ? (
                <div className="flex flex-col gap-3">
                  {difficulties.map((d, i) => (
                    <motion.button key={d.key} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => { setTournamentDifficulty(d.key); setTournamentStep('limit'); }}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${d.border}`, boxShadow: `0 0 16px ${d.glow}` }}>
                      <span className="text-3xl">{d.emoji}</span>
                      <div className="flex-1">
                        <p className="font-display text-base font-semibold" style={{ color: d.color }}>{d.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{d.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5" style={{ color: d.color }} />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500 text-center -mt-1">Le joueur qui atteint la limite est éliminé · Le moins de points gagne</p>
                  {(tournamentDifficulty === 'easy'
                    ? [
                        { limit: 30, entry: 50, label: 'Partie courte', emoji: '⚡' },
                        { limit: 40, entry: 100, label: 'Partie équilibrée', emoji: '⚔️' },
                        { limit: 50, entry: 200, label: 'Partie longue', emoji: '🔥' },
                      ]
                    : tournamentDifficulty === 'normal'
                    ? [
                        { limit: 30, entry: 200, label: 'Partie courte', emoji: '⚡' },
                        { limit: 40, entry: 500, label: 'Partie équilibrée', emoji: '⚔️' },
                        { limit: 50, entry: 1000, label: 'Partie longue', emoji: '🔥' },
                      ]
                    : [
                        { limit: 30, entry: 1000, label: 'Partie courte', emoji: '⚡' },
                        { limit: 40, entry: 1500, label: 'Partie équilibrée', emoji: '⚔️' },
                        { limit: 50, entry: 3000, label: 'Partie longue', emoji: '🔥' },
                      ]
                  ).map((t, i) => (
                    <motion.button key={t.limit} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={async () => {
                        await deductAndNavigate('/game', { difficulty: tournamentDifficulty, tournament: { scoreLimit: t.limit, scores: [0,0,0,0], round: 1 }, stake: t.entry }, t.entry);
                        setShowTournament(false);
                      }}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(212,160,23,0.3)', boxShadow: '0 0 12px rgba(212,160,23,0.1)' }}>
                      <span className="text-3xl">{t.emoji}</span>
                      <div className="flex-1">
                        <p className="font-display text-base font-semibold" style={{ color: '#f5c842' }}>{t.limit} points</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-sm font-bold text-amber-400">{t.entry} TRZ</p>
                        <p className="text-[10px] text-green-400">+{t.entry * 3} net</p>
                        <p className="text-[10px] text-red-400">-{t.entry} net</p>
                      </div>
                    </motion.button>
                  ))}
                  <button onClick={() => setTournamentStep('difficulty')}
                    className="text-xs text-slate-500 underline text-center mt-1">
                    ← Changer de niveau
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPrivate && <PrivateRoomModal onClose={() => setShowPrivate(false)} />}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="buy" />}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onClose={() => setShowNotifications(false)}
          onMarkAllRead={markAllRead}
          onDelete={deleteNotification}
          onDeleteAll={deleteAllNotifications}
        />
      )}
      <BottomNav />
    </div>
  );
}
