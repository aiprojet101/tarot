import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Gamepad2, Target, Flame } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';

const getDivision = (elo: number) => {
  if (elo >= 13000) return { label: 'Diamant', emoji: '💎', color: '#67e8f9', glow: 'rgba(103,232,249,0.25)' };
  if (elo >= 8500)  return { label: 'Or',      emoji: '🥇', color: '#fbbf24', glow: 'rgba(251,191,36,0.25)'  };
  if (elo >= 4000)  return { label: 'Argent',  emoji: '🥈', color: '#cbd5e1', glow: 'rgba(203,213,225,0.2)'  };
  return                  { label: 'Bronze',  emoji: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,0.2)'   };
};

type Profile = {
  id: string;
  username: string | null;
  avatar_emoji: string;
  tarot_elo: number;
  tarot_ranked_elo: number;
  tarot_wins: number;
  tarot_games_played: number;
  tarot_best_elo: number;
  is_founder?: boolean;
  boss_defeats?: number;
  regicide_achievement?: boolean;
};

type GameRow = { id: string; won: boolean; mode: string; elo_change: number | null; created_at: string };

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, tarot_elo, tarot_ranked_elo, tarot_wins, tarot_games_played, tarot_best_elo, is_founder, boss_defeats, regicide_achievement')
        .eq('id', id)
        .single();
      if (data) setProfile(data as Profile);

      const { data: games } = await supabase
        .from('tarot_games')
        .select('id, won, mode, elo_change, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (games) setHistory(games as GameRow[]);

      // Rang classé
      const { data: ranked } = await supabase
        .from('profiles')
        .select('id')
        .order('tarot_ranked_elo', { ascending: false });
      if (ranked) {
        const pos = ranked.findIndex(p => p.id === id);
        if (pos >= 0) setRank(pos + 1);
      }

      setLoading(false);
    })();
  }, [id]);

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
        <p className="text-slate-500 font-display">Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 suit-pattern">
        <p className="text-slate-400 font-display">Joueur introuvable</p>
        <button onClick={() => navigate(-1)} className="text-amber-400 text-sm">Retour</button>
      </div>
    );
  }

  const div = getDivision(profile.tarot_ranked_elo ?? 1000);
  const rankedElo = profile.tarot_ranked_elo ?? 1000;
  const wins = profile.tarot_wins ?? 0;
  const games = profile.tarot_games_played ?? 0;
  const ratio = games > 0 ? Math.round((wins / games) * 100) : 0;

  return (
    <div className="min-h-screen pb-20 suit-pattern">
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-display text-lg text-glow-gold">Profil joueur</h1>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 relative z-10">

        {/* Avatar + nom */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center text-3xl neon-glow-gold gold-border">
            {profile.avatar_emoji ?? '🎭'}
          </div>
          <div className="flex items-center gap-2">
            {profile.is_founder && (
              <motion.span
                animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}
                className="text-xl">👑</motion.span>
            )}
            <h2 className={`font-display text-xl ${profile.is_founder ? 'text-yellow-300' : 'text-glow-gold'}`}
              style={profile.is_founder ? { textShadow: '0 0 20px rgba(245,200,66,0.8)' } : undefined}>
              {profile.username ?? 'Joueur'}
            </h2>
            {profile.is_founder && (
              <motion.span
                animate={{ rotate: [5, -5, 5] }} transition={{ duration: 2, repeat: Infinity }}
                className="text-xl">👑</motion.span>
            )}
          </div>

          {/* Badge Fondateur */}
          {profile.is_founder && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 px-4 py-1 rounded-full"
              style={{ background: 'linear-gradient(135deg, rgba(245,200,66,0.2), rgba(7,26,15,0.9))', border: '1.5px solid rgba(245,200,66,0.5)', boxShadow: '0 0 24px rgba(245,200,66,0.3)' }}>
              <span className="font-display text-xs font-black tracking-[0.25em] uppercase"
                style={{ color: '#f5c842', textShadow: '0 0 12px rgba(245,200,66,0.7)' }}>
                Fondateur · THE BOSS
              </span>
            </motion.div>
          )}

          {/* Badge division */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full"
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
              {rankedElo} EXP
            </span>
          </motion.div>

          {rank && (
            <p className="text-[11px] text-slate-500">#{rank} au classement classé</p>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Victoires', value: String(wins),   icon: Trophy   },
            { label: 'Parties',   value: String(games),  icon: Gamepad2 },
            { label: 'Ratio',     value: `${ratio}%`,    icon: Target   },
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

        {/* Achievement Régicide */}
        {profile.regicide_achievement && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-3.5 rounded-2xl flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(245,200,66,0.12), rgba(7,26,15,0.95))', border: '1.5px solid rgba(245,200,66,0.35)', boxShadow: '0 0 20px rgba(245,200,66,0.15)' }}>
            <span className="text-2xl">⚔️</span>
            <div>
              <p className="font-display text-sm font-bold text-yellow-300">Régicide</p>
              <p className="text-[10px] text-slate-400">
                A vaincu THE BOSS {profile.boss_defeats && profile.boss_defeats > 1 ? `${profile.boss_defeats}× ` : ''}en partie !
              </p>
            </div>
            <span className="ml-auto text-xl">👑</span>
          </motion.div>
        )}

        {/* Historique */}
        <div>
          <h3 className="font-display text-sm mb-3 text-accent/70 tracking-wider">HISTORIQUE</h3>
          {history.length === 0 && (
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
      </div>

      <BottomNav />
    </div>
  );
}
