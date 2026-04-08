import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Coins, Zap, RefreshCw, Crown, Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import PrivateRoomModal from '@/components/PrivateRoomModal';

type Room = {
  code: string;
  host_id: string;
  stake: number;
  score_limit: number;
  status: string;
  players: { id: string; username: string; avatar: string; seat: number }[];
  created_at: string;
};

const LIMIT_LABEL: Record<number, string> = {
  0:  'Rapide',
  30: 'Courte',
  40: 'Normale',
  50: 'Longue',
};

function RoomCard({ room, myId, onJoin, joining }: {
  room: Room; myId: string; onJoin: (code: string) => void; joining: string | null;
}) {
  const isFull = room.players.length >= 4;
  const alreadyIn = room.players.some(p => p.id === myId);
  const spots = 4 - room.players.length;
  const isJoining = joining === room.code;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 rounded-2xl flex flex-col gap-3"
      style={{
        background: 'linear-gradient(145deg, #0f2a18, #071a0f)',
        border: `1.5px solid ${isFull ? 'rgba(255,255,255,0.06)' : 'rgba(212,160,23,0.25)'}`,
        boxShadow: isFull ? 'none' : '0 4px 20px rgba(0,0,0,0.4)',
        opacity: isFull ? 0.55 : 1,
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}>
            🃏
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white tracking-wide">
              Salon #{room.code}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {LIMIT_LABEL[room.score_limit] ?? `${room.score_limit} pts`} · {room.score_limit} pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}>
          <Coins className="w-3 h-3 text-amber-400" />
          <span className="font-display text-xs font-bold text-amber-400">{room.stake}</span>
        </div>
      </div>

      {/* Players avatars */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {room.players.map((p, i) => (
            <div key={p.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2"
              style={{
                background: 'rgba(15,42,24,0.9)',
                borderColor: p.id === myId ? '#f5c842' : 'rgba(74,222,128,0.4)',
                zIndex: room.players.length - i,
              }}>
              {p.avatar}
            </div>
          ))}
          {Array.from({ length: spots }).map((_, i) => (
            <div key={`empty-${i}`}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', zIndex: 0 }}>
              <Users className="w-3 h-3 text-slate-700" />
            </div>
          ))}
        </div>
        <span className="text-xs text-slate-500 ml-1">
          {room.players.length}/4 joueurs
          {spots > 0 && <span className="text-green-500 ml-1">· {spots} place{spots > 1 ? 's' : ''} libre{spots > 1 ? 's' : ''}</span>}
        </span>
      </div>

      {/* Hosts info + join */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Crown className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-slate-400">
            {room.players.find(p => p.id === room.host_id)?.username ?? 'Hôte'}
          </span>
        </div>

        <button
          onClick={() => onJoin(room.code)}
          disabled={isFull || isJoining}
          className="px-4 py-2 rounded-xl font-display text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: alreadyIn
              ? 'rgba(103,232,249,0.15)'
              : isFull
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #f5c842, #d4a017)',
            color: alreadyIn ? '#67e8f9' : isFull ? '#64748b' : '#000',
            border: alreadyIn ? '1px solid rgba(103,232,249,0.3)' : 'none',
            boxShadow: (!isFull && !alreadyIn) ? '0 0 14px rgba(245,200,66,0.25)' : 'none',
          }}
        >
          {isJoining ? '...' : alreadyIn ? 'Reprendre' : isFull ? 'Complet' : 'Rejoindre'}
        </button>
      </div>
    </motion.div>
  );
}

export default function Rooms() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [showPrivate, setShowPrivate] = useState(false);

  const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 heures

  const cleanupStaleRooms = async () => {
    const staleDate = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
    // Supprimer les salons waiting > 2h (abandonnés)
    await supabase.from('rooms').delete().eq('status', 'waiting').lt('created_at', staleDate);
    // Supprimer les salons closed > 24h
    const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('rooms').delete().eq('status', 'closed').lt('created_at', oldDate);
  };

  const fetchRooms = async (silent = false) => {
    if (!silent) setRefreshing(true);
    const freshThreshold = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'waiting')
      .gt('created_at', freshThreshold)      // seulement les salons < 2h
      .order('created_at', { ascending: false });
    if (data) setRooms(data as Room[]);
    setLoading(false);
    setRefreshing(false);
    setLastRefresh(Date.now());
  };

  // Chargement initial : nettoyage DB puis fetch, puis auto-refresh 5s
  useEffect(() => {
    cleanupStaleRooms().then(() => fetchRooms());
    const interval = setInterval(() => fetchRooms(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (code: string) => {
    if (!user || !profile) { setError('Connecte-toi pour rejoindre'); return; }
    const room = rooms.find(r => r.code === code);
    if (!room) return;

    // Déjà dans le salon
    if (room.players.some(p => p.id === user.id)) {
      navigate(`/room/${code}`);
      return;
    }

    if (room.players.length >= 4) return;
    setJoining(code);
    setError('');

    const newPlayer = {
      id: user.id,
      username: profile.username ?? 'Joueur',
      avatar: profile.avatar_emoji,
      seat: room.players.length,
    };
    const { error: err } = await supabase.from('rooms')
      .update({ players: [...room.players, newPlayer] })
      .eq('code', code);

    setJoining(null);
    if (err) { setError('Erreur lors de la connexion'); return; }
    navigate(`/room/${code}`);
  };

  const openRooms = rooms.filter(r => r.players.length < 4);
  const fullRooms = rooms.filter(r => r.players.length >= 4);

  return (
    <div className="min-h-screen pb-24 suit-pattern">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <button onClick={() => navigate('/lobby')} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-base text-glow-gold">Salons ouverts</h1>
          <p className="text-[10px] text-slate-500">
            {loading ? 'Chargement...' : `${openRooms.length} salon${openRooms.length !== 1 ? 's' : ''} disponible${openRooms.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => fetchRooms()}
          className="p-2 rounded-lg transition-colors hover:bg-muted"
          disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4 relative z-10">

        {/* Rejoindre rapide */}
        <Button
          onClick={() => {
            if (openRooms.length > 0) {
              const best = [...openRooms].sort((a, b) => b.players.length - a.players.length)[0];
              handleJoin(best.code);
            } else {
              setShowPrivate(true);
            }
          }}
          disabled={!!joining}
          className="w-full h-12 gradient-gold text-primary-foreground border-0 neon-glow-gold font-display gold-border">
          <Zap className="w-4 h-4 mr-2" />
          {openRooms.length > 0 ? `Rejoindre le meilleur salon · ${openRooms.length} dispo` : 'Créer un salon'}
        </Button>

        {error && (
          <p className="text-xs text-red-400 text-center font-display">{error}</p>
        )}

        {/* Liste des salons */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : openRooms.length === 0 && fullRooms.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🃏</span>
            <p className="font-display text-base text-slate-300">Aucun salon ouvert</p>
            <p className="text-sm text-slate-600 max-w-xs">
              Crée un salon privé depuis le lobby pour jouer avec tes amis.
            </p>
            <button onClick={() => navigate('/lobby')}
              className="mt-2 px-5 py-2 rounded-xl font-display text-sm"
              style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)', color: '#f5c842' }}>
              Retour au lobby
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {openRooms.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600">
                  Places disponibles
                </p>
                {openRooms.map(room => (
                  <RoomCard key={room.code} room={room} myId={user?.id ?? ''}
                    onJoin={handleJoin} joining={joining} />
                ))}
              </div>
            )}

            {fullRooms.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-slate-600 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Complets
                </p>
                {fullRooms.map(room => (
                  <RoomCard key={room.code} room={room} myId={user?.id ?? ''}
                    onJoin={handleJoin} joining={joining} />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Indicateur de refresh */}
        {!loading && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <Clock className="w-3 h-3 text-slate-700" />
            <p className="text-[10px] text-slate-700">Actualisation automatique toutes les 5s</p>
          </div>
        )}
      </div>

      <BottomNav />
      {showPrivate && <PrivateRoomModal onClose={() => setShowPrivate(false)} />}
    </div>
  );
}
