import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Gift, Flame, CheckCircle2, Trophy, Star, Lock, Zap, Calendar } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ── Constantes ────────────────────────────────────────────────────────────────
const DAILY = [
  { id: 'd1', icon: '⚡', title: 'Jouer 3 parties',         key: 'games_today',  target: 3,  reward: 50,  xp: 30  },
  { id: 'd2', icon: '🏆', title: 'Remporter une victoire',  key: 'wins_today',   target: 1,  reward: 100, xp: 50  },
  { id: 'd3', icon: '⚔️', title: 'Jouer en mode classé',    key: 'ranked_today', target: 1,  reward: 75,  xp: 40  },
  { id: 'd4', icon: '🎯', title: 'Jouer 5 parties',         key: 'games_today',  target: 5,  reward: 150, xp: 80  },
];

const WEEKLY = [
  { id: 'w1', icon: '🔥', title: 'Gagner 5 parties cette semaine', key: 'wins_week',  target: 5,  reward: 300, xp: 200 },
  { id: 'w2', icon: '🃏', title: 'Jouer 15 parties',               key: 'games_week', target: 15, reward: 200, xp: 150 },
  { id: 'w3', icon: '📅', title: 'Streak de 3 jours consécutifs',  key: 'streak',     target: 3,  reward: 400, xp: 250 },
];

const ACHIEVEMENTS = [
  { id: 'a1', emoji: '🏆', title: 'Première victoire',    desc: 'Remporter sa première partie',      key: 'wins_total',  target: 1,    reward: 100  },
  { id: 'a2', emoji: '🎖️', title: 'Vétéran',              desc: '10 parties jouées',                 key: 'games_total', target: 10,   reward: 200  },
  { id: 'a3', emoji: '⚔️', title: 'Guerrier',              desc: '50 parties jouées',                 key: 'games_total', target: 50,   reward: 500  },
  { id: 'a4', emoji: '👑', title: 'Légende',               desc: '100 parties jouées',                key: 'games_total', target: 100,  reward: 1000 },
  { id: 'a5', emoji: '🥈', title: 'Rang Argent',           desc: 'Atteindre 1200 TRZ classé',        key: 'ranked_elo',  target: 1200, reward: 300  },
  { id: 'a6', emoji: '🥇', title: 'Rang Or',               desc: 'Atteindre 1600 TRZ classé',        key: 'ranked_elo',  target: 1600, reward: 600  },
  { id: 'a7', emoji: '💎', title: 'Rang Diamant',          desc: 'Atteindre 2000 TRZ classé',        key: 'ranked_elo',  target: 2000, reward: 1500 },
  { id: 'a8', emoji: '🌟', title: 'Invincible',            desc: 'Gagner 25 parties au total',        key: 'wins_total',  target: 25,   reward: 800  },
];

const SEASON_LEVELS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

// ── Helpers localStorage ──────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().split('T')[0];
};

const getStreak = (): { count: number; lastDate: string } =>
  JSON.parse(localStorage.getItem('tarot_streak') || '{"count":0,"lastDate":""}');

const updateStreak = (playedToday: boolean): number => {
  const s = getStreak();
  const t = today();
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const y = yest.toISOString().split('T')[0];
  if (s.lastDate === t) return s.count;
  if (!playedToday) return s.count;
  const count = s.lastDate === y ? s.count + 1 : 1;
  localStorage.setItem('tarot_streak', JSON.stringify({ count, lastDate: t }));
  return count;
};

const getClaimedDaily  = (): string[] => JSON.parse(localStorage.getItem(`tarot_daily_${today()}`)    || '[]');
const getClaimedWeekly = (): string[] => JSON.parse(localStorage.getItem(`tarot_weekly_${weekStart()}`) || '[]');
const getClaimedAch    = (): string[] => JSON.parse(localStorage.getItem('tarot_achievements_claimed') || '[]');
const getSeasonXP      = (): number   => parseInt(localStorage.getItem('tarot_season_xp') || '0', 10);

const addSeasonXP = (xp: number) => {
  localStorage.setItem('tarot_season_xp', String(getSeasonXP() + xp));
};

const seasonLevel = (xp: number) => {
  let lvl = 0;
  for (let i = 0; i < SEASON_LEVELS.length; i++) {
    if (xp >= SEASON_LEVELS[i]) lvl = i + 1; else break;
  }
  const cur = SEASON_LEVELS[Math.min(lvl - 1, SEASON_LEVELS.length - 1)] ?? 0;
  const next = SEASON_LEVELS[lvl] ?? SEASON_LEVELS[SEASON_LEVELS.length - 1];
  return { level: lvl, cur, next, pct: Math.min(((xp - cur) / (next - cur)) * 100, 100) };
};

// ── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color = '#f5c842' }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full" style={{ background: color }} />
    </div>
  );
}

// ── Mission card ──────────────────────────────────────────────────────────────
function MissionCard({ mission, progress, claimed, onClaim, claimable }: {
  mission: typeof DAILY[0]; progress: number; claimed: boolean; claimable: boolean; onClaim: () => void;
}) {
  const pct = Math.min((progress / mission.target) * 100, 100);
  const done = progress >= mission.target;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl flex flex-col gap-2.5"
      style={{
        background: claimed ? 'rgba(255,255,255,0.02)' : 'linear-gradient(145deg, #0f2a18, #071a0f)',
        border: `1.5px solid ${claimed ? 'rgba(255,255,255,0.05)' : done ? 'rgba(74,222,128,0.3)' : 'rgba(212,160,23,0.15)'}`,
        opacity: claimed ? 0.5 : 1,
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{mission.icon}</span>
          <div>
            <p className={`font-display text-sm font-semibold ${claimed ? 'text-slate-500' : 'text-white'}`}>
              {mission.title}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">{progress}/{mission.target}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.15)' }}>
          <Gift className="w-3 h-3 text-amber-400" />
          <span className="font-display text-xs text-amber-400 font-bold">{mission.reward}</span>
        </div>
      </div>

      <Bar pct={pct} color={done ? '#4ade80' : '#f5c842'} />

      {done && !claimed && (
        <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          onClick={onClaim} disabled={!claimable}
          className="h-9 rounded-xl font-display text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000', boxShadow: '0 0 14px rgba(74,222,128,0.3)' }}>
          <Gift className="w-3.5 h-3.5" />
          Récupérer {mission.reward} TRZ
        </motion.button>
      )}

      {claimed && (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[10px] text-slate-600 font-display">Récompense récupérée</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Achievement card ──────────────────────────────────────────────────────────
function AchCard({ ach, progress, claimed, onClaim }: {
  ach: typeof ACHIEVEMENTS[0]; progress: number; claimed: boolean; onClaim: () => void;
}) {
  const done = progress >= ach.target;
  const pct = Math.min((progress / ach.target) * 100, 100);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="p-3.5 rounded-2xl flex flex-col gap-2"
      style={{
        background: claimed ? 'rgba(255,255,255,0.02)' : done ? 'linear-gradient(145deg, #142e1a, #071a0f)' : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${claimed ? 'rgba(255,255,255,0.05)' : done ? 'rgba(245,200,66,0.35)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: done && !claimed ? '0 0 20px rgba(245,200,66,0.1)' : 'none',
      }}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${!done ? 'grayscale opacity-30' : ''}`}
          style={{ background: done ? 'rgba(245,200,66,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
          {done ? ach.emoji : <Lock className="w-4 h-4 text-slate-700" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-display text-sm font-bold ${done ? 'text-white' : 'text-slate-600'}`}>{ach.title}</p>
          <p className="text-[10px] text-slate-600 mt-0.5 truncate">{ach.desc}</p>
          <Bar pct={pct} color={claimed ? '#334155' : '#f5c842'} />
          <p className="text-[9px] text-slate-700 mt-1">{Math.min(progress, ach.target)}/{ach.target}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-display text-xs font-bold text-amber-500">{ach.reward}</p>
          <p className="text-[9px] text-slate-600">TRZ</p>
        </div>
      </div>

      {done && !claimed && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={onClaim}
          className="h-8 rounded-xl font-display text-[11px] font-bold active:scale-95 flex items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg, #f5c842, #d4a017)', color: '#000', boxShadow: '0 0 12px rgba(245,200,66,0.25)' }}>
          <Trophy className="w-3 h-3" /> Débloquer
        </motion.button>
      )}
      {claimed && (
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-amber-700" />
          <span className="text-[9px] text-amber-800 font-display">Débloqué</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Missions() {
  const { user, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'daily' | 'weekly' | 'achievements'>('daily');

  // Stats depuis la DB
  const [gamesTotal, setGamesTotal] = useState(0);
  const [winsTotal, setWinsTotal]   = useState(0);
  const [gamesToday, setGamesToday] = useState(0);
  const [winsToday, setWinsToday]   = useState(0);
  const [rankedToday, setRankedToday] = useState(0);
  const [gamesWeek, setGamesWeek]   = useState(0);
  const [winsWeek, setWinsWeek]     = useState(0);

  // Streak + saison
  const [streak, setStreak] = useState(0);
  const [seasonXP, setSeasonXP] = useState(getSeasonXP());

  // Claimed states
  const [claimedDaily,  setClaimedDaily]  = useState<string[]>(getClaimedDaily());
  const [claimedWeekly, setClaimedWeekly] = useState<string[]>(getClaimedWeekly());
  const [claimedAch,    setClaimedAch]    = useState<string[]>(getClaimedAch());
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const t = today();
    const w = weekStart();

    (async () => {
      const { data: all } = await supabase.from('tarot_games')
        .select('won, mode, created_at').eq('user_id', user.id);
      if (!all) return;

      const todayGames  = all.filter(g => g.created_at?.startsWith(t));
      const weekGames   = all.filter(g => g.created_at >= w);

      setGamesTotal(all.length);
      setWinsTotal(all.filter(g => g.won).length);
      setGamesToday(todayGames.length);
      setWinsToday(todayGames.filter(g => g.won).length);
      setRankedToday(todayGames.filter(g => g.mode === 'ranked').length);
      setGamesWeek(weekGames.length);
      setWinsWeek(weekGames.filter(g => g.won).length);

      // Mise à jour streak si a joué aujourd'hui
      const s = updateStreak(todayGames.length > 0);
      setStreak(s);
    })();
  }, [user]);

  // Stats par clé
  const stat = (key: string): number => ({
    games_today: gamesToday, wins_today: winsToday, ranked_today: rankedToday,
    games_week: gamesWeek,   wins_week: winsWeek,   streak,
    games_total: gamesTotal, wins_total: winsTotal,
    ranked_elo: profile?.tarot_ranked_elo ?? 0,
  }[key] ?? 0);

  const claim = async (id: string, reward: number, xp: number, type: 'daily' | 'weekly' | 'ach') => {
    if (!user || claiming) return;
    setClaiming(id);
    await supabase.rpc('update_elo_balance', { uid: user.id, delta: reward });
    await refreshProfile();
    addSeasonXP(xp);
    setSeasonXP(getSeasonXP());

    if (type === 'daily') {
      const next = [...claimedDaily, id];
      localStorage.setItem(`tarot_daily_${today()}`, JSON.stringify(next));
      setClaimedDaily(next);
    } else if (type === 'weekly') {
      const next = [...claimedWeekly, id];
      localStorage.setItem(`tarot_weekly_${weekStart()}`, JSON.stringify(next));
      setClaimedWeekly(next);
    } else {
      const next = [...claimedAch, id];
      localStorage.setItem('tarot_achievements_claimed', JSON.stringify(next));
      setClaimedAch(next);
    }
    setClaiming(null);
  };

  const season = seasonLevel(seasonXP);

  const streakDays = [1, 2, 3, 5, 7, 10, 14, 21, 30];

  return (
    <div className="min-h-screen pb-24 suit-pattern">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <Target className="w-5 h-5 text-accent" />
        <h1 className="font-display text-base text-glow-gold">Missions</h1>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4 relative z-10">

        {/* Season XP bar */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.25)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f5c842, #d4a017)' }}>
                <Star className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="font-display text-xs text-slate-400 tracking-widest uppercase">Saison · Niveau</p>
                <p className="font-display text-lg font-bold text-white">{season.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-xs text-amber-400">{seasonXP} XP</p>
              <p className="text-[10px] text-slate-600">→ {season.next} XP</p>
            </div>
          </div>
          <Bar pct={season.pct} />
          <p className="text-[9px] text-slate-700 mt-1.5 text-right">
            {season.next - seasonXP} XP pour le niveau {season.level + 1}
          </p>
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl"
          style={{ background: 'linear-gradient(145deg, #1a0f00, #0d0800)', border: `1.5px solid ${streak >= 3 ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: streak >= 3 ? '0 0 24px rgba(251,146,60,0.15)' : 'none' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className={`w-6 h-6 ${streak >= 3 ? 'text-orange-400' : 'text-slate-600'}`} />
              <div>
                <p className="font-display text-xs text-slate-500 uppercase tracking-widest">Streak</p>
                <p className={`font-display text-2xl font-bold ${streak >= 3 ? 'text-orange-400' : 'text-slate-400'}`}>
                  {streak} <span className="text-sm font-normal text-slate-500">jour{streak > 1 ? 's' : ''}</span>
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 text-right">Joue chaque jour<br/>pour maintenir ta série</p>
          </div>
          <div className="flex gap-1.5">
            {streakDays.map(d => (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-1.5 rounded-full transition-all ${streak >= d ? 'bg-orange-400' : 'bg-white/5'}`} />
                <span className="text-[8px] text-slate-700">{d}j</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {([
            { key: 'daily',        label: 'Quotidien',  icon: Zap      },
            { key: 'weekly',       label: 'Semaine',    icon: Calendar },
            { key: 'achievements', label: 'Succès',     icon: Trophy   },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-all"
              style={{
                background: tab === key ? 'rgba(245,200,66,0.1)' : 'transparent',
                borderBottom: `2px solid ${tab === key ? '#f5c842' : 'transparent'}`,
              }}>
              <Icon className="w-3.5 h-3.5" style={{ color: tab === key ? '#f5c842' : '#475569' }} />
              <span className="text-[10px] font-display" style={{ color: tab === key ? '#f5c842' : '#475569' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'daily' && (
            <motion.div key="daily" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="flex flex-col gap-3">
              <p className="text-[10px] text-slate-600 text-right">Reset à minuit</p>
              {DAILY.map(m => (
                <MissionCard key={m.id} mission={m}
                  progress={stat(m.key)}
                  claimed={claimedDaily.includes(m.id)}
                  claimable={!claiming}
                  onClaim={() => claim(m.id, m.reward, m.xp, 'daily')} />
              ))}
            </motion.div>
          )}

          {tab === 'weekly' && (
            <motion.div key="weekly" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="flex flex-col gap-3">
              <p className="text-[10px] text-slate-600 text-right">Reset le lundi</p>
              {WEEKLY.map(m => (
                <MissionCard key={m.id} mission={m}
                  progress={stat(m.key)}
                  claimed={claimedWeekly.includes(m.id)}
                  claimable={!claiming}
                  onClaim={() => claim(m.id, m.reward, m.xp, 'weekly')} />
              ))}
            </motion.div>
          )}

          {tab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="flex flex-col gap-3">
              <p className="text-[10px] text-slate-600 text-right">{claimedAch.length}/{ACHIEVEMENTS.length} débloqués</p>
              {ACHIEVEMENTS.map(a => (
                <AchCard key={a.id} ach={a}
                  progress={stat(a.key)}
                  claimed={claimedAch.includes(a.id)}
                  onClaim={() => claim(a.id, a.reward, 0, 'ach')} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
