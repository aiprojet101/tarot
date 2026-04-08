import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Award, Swords } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type Player = {
  id: string;
  username: string | null;
  avatar_emoji: string;
  tarot_ranked_elo: number | null;
  tarot_games_played: number;
  tarot_wins: number;
  is_founder?: boolean;
};

const getDivision = (elo: number) => {
  if (elo >= 13000) return { label: 'Diamant', emoji: '💎', color: '#67e8f9', border: 'rgba(103,232,249,0.4)' };
  if (elo >= 8500)  return { label: 'Or',      emoji: '🥇', color: '#fbbf24', border: 'rgba(251,191,36,0.4)'  };
  if (elo >= 4000)  return { label: 'Argent',  emoji: '🥈', color: '#cbd5e1', border: 'rgba(203,213,225,0.3)' };
  return                  { label: 'Bronze',  emoji: '🥉', color: '#cd7f32', border: 'rgba(205,127,50,0.3)'  };
};

const getSeasonPrize = (rank: number): string | null => {
  if (rank === 1) return '5000';
  if (rank === 2) return '3000';
  if (rank === 3) return '2000';
  if (rank <= 5) return '1000';
  if (rank <= 10) return '500';
  return null;
};

// Saison courante — repart le 1er de chaque mois
const getCurrentSeason = () => {
  const now = new Date();
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return `Saison ${months[now.getMonth()]} ${now.getFullYear()}`;
};

const getDaysLeft = () => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
};

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'general' | 'ranked'>('ranked');
  const [players, setPlayers] = useState<Player[]>([]);
  const [rankedPlayers, setRankedPlayers] = useState<Player[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myRankedRank, setMyRankedRank] = useState<number | null>(null);
  const [prizePool, setPrizePool] = useState<number>(0);
  const [myMonthlyRanked, setMyMonthlyRanked] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Classement général — par victoires
      const { data: gen } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, tarot_ranked_elo, tarot_games_played, tarot_wins, is_founder')
        .order('tarot_wins', { ascending: false })
        .order('tarot_games_played', { ascending: false })
        .limit(50);
      if (gen) {
        setPlayers(gen as Player[]);
        if (user) {
          const rank = gen.findIndex(p => p.id === user.id);
          setMyRank(rank >= 0 ? rank + 1 : null);
        }
      }

      // Classement classé — tous les joueurs, triés par ranked_elo
      const { data: ranked } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, tarot_ranked_elo, tarot_games_played, tarot_wins, is_founder')
        .order('tarot_ranked_elo', { ascending: false })
        .limit(50);
      if (ranked) {
        setRankedPlayers(ranked as Player[]);
        if (user) {
          const rank = ranked.findIndex(p => p.id === user.id);
          setMyRankedRank(rank >= 0 ? rank + 1 : null);
        }
      }

      // Cagnotte de saison
      const { data: season } = await supabase.from('tarot_season').select('prize_pool').eq('id', 1).single();
      if (season) setPrizePool(season.prize_pool);

      // Parties classées du mois (utilisateur connecté)
      if (user) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from('tarot_games')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('mode', 'ranked')
          .gte('created_at', startOfMonth.toISOString());
        setMyMonthlyRanked(count ?? 0);
      }

      setLoading(false);
    })();
  }, [user]);

  const currentPlayers = tab === 'general' ? players : rankedPlayers;
  const currentRank = tab === 'general' ? myRank : myRankedRank;
  const top3 = currentPlayers.slice(0, 3);
  const rest = currentPlayers.slice(3);

  const PODIUM_ORDER = [1, 0, 2];
  const PODIUM_HEIGHTS = ['h-16', 'h-24', 'h-12'];
  const PODIUM_SIZES = ['w-14 h-14 text-2xl', 'w-[4.5rem] h-[4.5rem] text-3xl', 'w-12 h-12 text-xl'];

  return (
    <div className="min-h-screen pb-24 suit-pattern">
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <Trophy className="w-5 h-5 text-accent" />
        <div>
          <h1 className="font-display text-base text-glow-gold">Classement</h1>
          <p className="text-[10px] text-slate-500">{getCurrentSeason()} · {getDaysLeft()}j restants</p>
        </div>
        {currentRank && (
          <div className="ml-auto px-3 py-1 rounded-full"
            style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)' }}>
            <span className="font-display text-xs text-amber-400">Ta position #{currentRank}</span>
          </div>
        )}
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4 relative z-10">

        {/* Onglets */}
        <div className="flex rounded-2xl overflow-hidden p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {([
            { key: 'ranked',  label: 'Classé',  icon: Swords, desc: 'EXP ranked · Saison' },
            { key: 'general', label: 'Général', icon: Trophy, desc: 'Victoires tous modes' },
          ] as const).map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 flex flex-col items-center py-2.5 px-3 rounded-xl transition-all duration-200"
                style={{
                  background: active ? 'rgba(245,200,66,0.12)' : 'transparent',
                  border: active ? '1.5px solid rgba(245,200,66,0.4)' : '1.5px solid transparent',
                }}>
                <t.icon className="w-4 h-4 mb-0.5" style={{ color: active ? '#f5c842' : '#475569' }} />
                <p className="font-display text-xs font-bold" style={{ color: active ? '#f5c842' : '#64748b' }}>{t.label}</p>
                <p className="text-[9px]" style={{ color: active ? '#a16207' : '#334155' }}>{t.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Banner saison classée */}
        <AnimatePresence mode="wait">
          {tab === 'ranked' && (
            <motion.div key="ranked-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: '1.5px solid rgba(103,232,249,0.25)' }}>
              {/* Header */}
              <div className="p-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(103,232,249,0.1), rgba(15,42,24,0.95))' }}>
                <span className="text-3xl">⚔️</span>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-white">{getCurrentSeason()}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">+50 TRZ / victoire · -30 TRZ / défaite</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold text-cyan-400">{prizePool.toLocaleString('fr-FR')}</p>
                  <p className="text-[9px] text-slate-500">TRZ en jeu</p>
                  <p className="text-[8px] text-slate-600">{getDaysLeft()}j restants</p>
                </div>
              </div>
              {/* Prix de fin de saison */}
              <div className="px-4 pb-4 pt-2" style={{ background: 'rgba(7,26,15,0.9)' }}>
                <p className="font-display text-[9px] tracking-[0.2em] uppercase text-cyan-700 mb-2">Récompenses fin de saison</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { rank: '#1', trz: '5000', color: '#f5c842' },
                    { rank: '#2', trz: '3000', color: '#cbd5e1' },
                    { rank: '#3', trz: '2000', color: '#cd7f32' },
                    { rank: '#4-5', trz: '1000', color: '#67e8f9' },
                    { rank: '#6-10', trz: '500', color: '#64748b' },
                  ].map(p => (
                    <div key={p.rank} className="flex flex-col items-center py-2 px-1 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${p.color}22` }}>
                      <p className="font-display text-[9px] font-bold" style={{ color: p.color }}>{p.rank}</p>
                      <p className="font-display text-xs font-bold text-white mt-0.5">{p.trz}</p>
                      <p className="text-[8px] text-slate-600">TRZ</p>
                    </div>
                  ))}
                </div>
                {/* Condition d'éligibilité + progression */}
                {user ? (
                  <div className="mt-2 px-3 py-2 rounded-xl"
                    style={{ background: myMonthlyRanked >= 5 ? 'rgba(74,222,128,0.08)' : 'rgba(103,232,249,0.06)', border: `1px solid ${myMonthlyRanked >= 5 ? 'rgba(74,222,128,0.25)' : 'rgba(103,232,249,0.15)'}` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{myMonthlyRanked >= 5 ? '✅' : '🎯'}</span>
                        <p className="text-[10px] text-slate-300">
                          {myMonthlyRanked >= 5
                            ? <span className="font-display font-bold text-green-400">Éligible à la cagnotte !</span>
                            : <><span className="font-display font-bold text-cyan-400">5 parties minimum</span> ce mois</>
                          }
                        </p>
                      </div>
                      <p className="font-display text-xs font-bold" style={{ color: myMonthlyRanked >= 5 ? '#4ade80' : '#67e8f9' }}>
                        {myMonthlyRanked}/5
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (myMonthlyRanked / 5) * 100)}%`, background: myMonthlyRanked >= 5 ? '#4ade80' : '#67e8f9' }} />
                    </div>
                    {myMonthlyRanked < 5 && (
                      <p className="text-[9px] text-slate-500 mt-1">{5 - myMonthlyRanked} partie{5 - myMonthlyRanked > 1 ? 's' : ''} restante{5 - myMonthlyRanked > 1 ? 's' : ''}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(103,232,249,0.06)', border: '1px solid rgba(103,232,249,0.15)' }}>
                    <span className="text-base">🎯</span>
                    <p className="text-[10px] text-slate-300">
                      <span className="font-display font-bold text-cyan-400">5 parties classées minimum</span> ce mois pour participer à la cagnotte
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {tab === 'general' && (
            <motion.div key="general-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.2)' }}>
              <span className="text-3xl">🏆</span>
              <div>
                <p className="font-display text-sm font-bold text-white">Les meilleurs joueurs de Tarot</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Classement par victoires · Tous modes confondus</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col gap-3 pt-4">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="h-16 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-4">

              {/* Podium */}
              {top3.length === 3 && (
                <div className="p-5 rounded-3xl"
                  style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(212,160,23,0.3)' }}>
                  <div className="flex items-end justify-center gap-5">
                    {PODIUM_ORDER.map((idx, pos) => {
                      const p = top3[idx];
                      const rank = idx + 1;
                      const div = getDivision(p.tarot_ranked_elo ?? 1000);
                      const isFirst = rank === 1;
                      return (
                        <div key={p.id} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate(`/profile/${p.id}`)}>
                          {isFirst && <Crown className="w-5 h-5 text-amber-400 mb-0.5" />}
                          <div className={`${PODIUM_SIZES[idx]} rounded-full flex items-center justify-center border-2`}
                            style={{
                              background: 'rgba(15,42,24,0.8)',
                              borderColor: isFirst ? '#f5c842' : div.border,
                              boxShadow: isFirst ? '0 0 18px rgba(245,200,66,0.4)' : 'none',
                            }}>
                            {p.avatar_emoji}
                          </div>
                          {tab === 'ranked' && (
                            <span className="text-sm">{div.emoji}</span>
                          )}
                          <div className="flex items-center gap-1">
                            {p.is_founder && <span className="text-sm">👑</span>}
                            <p className={`font-display text-xs font-bold ${isFirst ? 'text-white' : 'text-slate-400'} max-w-[60px] truncate`}>
                              {p.username ?? 'Joueur'}
                            </p>
                          </div>
                          <p className="font-display text-[10px]" style={{ color: div.color }}>
                            {tab === 'general' ? `${p.tarot_wins} victoires` : `${p.tarot_ranked_elo ?? 1000} EXP`}
                          </p>
                          <div className={`${PODIUM_HEIGHTS[pos]} w-14 rounded-t-xl flex items-center justify-center`}
                            style={{
                              background: isFirst ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${isFirst ? 'rgba(245,200,66,0.3)' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                            <span className="font-display font-bold" style={{ color: isFirst ? '#f5c842' : '#475569' }}>
                              #{rank}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Liste */}
              <div className="flex flex-col gap-2">
                {rest.map((p, i) => {
                  const rank = i + 4;
                  const div = getDivision(p.tarot_ranked_elo ?? 1000);
                  const isMe = p.id === user?.id;
                  const ratio = p.tarot_games_played > 0 ? Math.round((p.tarot_wins / p.tarot_games_played) * 100) : 0;
                  const prize = tab === 'ranked' ? getSeasonPrize(rank) : null;
                  const divBorder = tab === 'ranked' && !isMe ? div.border : isMe ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.06)';

                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      className="p-3.5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => navigate(`/profile/${p.id}`)}
                      style={{
                        background: isMe ? 'rgba(245,200,66,0.08)' : 'linear-gradient(145deg, #0a1f10, #071a0f)',
                        border: `1.5px solid ${divBorder}`,
                        boxShadow: isMe ? '0 0 16px rgba(245,200,66,0.1)' : tab === 'ranked' ? `0 0 8px ${div.border.replace('0.4','0.15')}` : 'none',
                      }}>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-sm w-7 text-slate-500">#{rank}</span>
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${div.border}` }}>
                            {p.avatar_emoji}
                          </div>
                          {tab === 'ranked' && (
                            <span className="absolute -bottom-1 -right-1 text-xs">{div.emoji}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {p.is_founder && <span className="text-sm">👑</span>}
                            <p className={`font-display text-sm font-semibold ${isMe ? 'text-amber-400' : p.is_founder ? 'text-yellow-300' : 'text-white'}`}>
                              {p.username ?? 'Joueur'}{isMe ? ' (toi)' : ''}
                            </p>
                          </div>
                          <p className="text-[10px]" style={{ color: div.color }}>
                            {tab === 'general'
                              ? `${ratio}% victoires · ${div.label}`
                              : `${div.label} · ${ratio}% victoires`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {tab === 'general' ? (
                          <>
                            <p className="font-display text-sm font-bold text-white">{p.tarot_wins} <span className="text-[10px] font-normal text-slate-400">victoires</span></p>
                            <p className="text-[9px] text-slate-600">{p.tarot_games_played} parties</p>
                          </>
                        ) : (
                          <>
                            <p className="font-display text-sm font-bold" style={{ color: div.color }}>{p.tarot_ranked_elo ?? 1000}</p>
                            <p className="text-[9px] text-slate-600">EXP</p>
                            {prize && (
                              <p className="text-[9px] font-display font-bold mt-0.5" style={{ color: '#67e8f9' }}>
                                🏅 +{prize} fin saison
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {currentPlayers.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <span className="text-5xl">{tab === 'ranked' ? '⚔️' : '🏆'}</span>
                  <p className="font-display text-slate-400">
                    {tab === 'ranked' ? 'Aucun joueur classé cette saison' : 'Aucun joueur pour l\'instant'}
                  </p>
                  {tab === 'ranked' && (
                    <p className="text-xs text-slate-600 text-center max-w-xs">
                      Joue en mode Classé depuis le lobby pour apparaître ici
                    </p>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
