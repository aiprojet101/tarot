import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/PaywallModal';

const STAKES = [50, 100, 200, 500];
const LIMITS = [
  { value: 0,  label: 'Rapide · 1 manche' },
  { value: 30, label: 'Courte · Éliminé à 30 pts' },
  { value: 40, label: 'Normale · Éliminé à 40 pts' },
  { value: 50, label: 'Longue · Éliminé à 50 pts' },
];

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function PrivateRoomModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [stake, setStake] = useState(100);
  const [limit, setLimit] = useState(40);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const handleCreate = async () => {
    if (!user || !profile) { setError('Connecte-toi pour créer un salon'); return; }
    const { data: prof } = await supabase.from('profiles').select('tarot_elo').eq('id', user.id).single();
    if ((prof?.tarot_elo ?? 0) < stake) { setShowPaywall(true); return; }
    setLoading(true);
    setError('');
    await supabase.rpc('update_elo_balance', { uid: user.id, delta: -stake });
    const roomCode = generateCode();
    const { error: err } = await supabase.from('rooms').insert({
      code: roomCode,
      host_id: user.id,
      stake,
      score_limit: limit,
      players: [{ id: user.id, username: profile.username ?? 'Joueur', avatar: profile.avatar_emoji, seat: 0 }],
    });
    if (err) { setError('Erreur lors de la création'); setLoading(false); return; }
    onClose();
    navigate(`/room/${roomCode}`);
  };

  const handleJoin = async () => {
    if (!user || !profile) { setError('Connecte-toi pour rejoindre'); return; }
    if (code.length !== 6) { setError('Code à 6 chiffres requis'); return; }
    setLoading(true);
    setError('');
    const { data: room } = await supabase
      .from('rooms').select('*').eq('code', code).eq('status', 'waiting').single();
    if (!room) { setError('Salon introuvable ou déjà commencé'); setLoading(false); return; }
    if (room.players.length >= 4) { setError('Salon complet (4/4)'); setLoading(false); return; }
    if (room.players.some((p: any) => p.id === user.id)) {
      onClose(); navigate(`/room/${code}`); return;
    }
    const { data: prof } = await supabase.from('profiles').select('tarot_elo').eq('id', user.id).single();
    if ((prof?.tarot_elo ?? 0) < room.stake) { setLoading(false); setShowPaywall(true); return; }
    await supabase.rpc('update_elo_balance', { uid: user.id, delta: -room.stake });
    const newPlayer = { id: user.id, username: profile.username ?? 'Joueur', avatar: profile.avatar_emoji, seat: room.players.length };
    const updatedPlayers = [...room.players, newPlayer];
    const { error: err } = await supabase.from('rooms')
      .update({ players: updatedPlayers }).eq('code', code);
    if (err) { setError('Erreur lors de la connexion'); setLoading(false); return; }
    onClose();
    navigate(`/room/${code}`);
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
              <p className="font-display text-xs tracking-[0.2em] uppercase text-emerald-600">Partie Privée</p>
              <h2 className="font-script text-2xl" style={{ color: '#f5c842' }}>Salon privé</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['create', 'join'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-2.5 text-sm font-display transition-all"
                style={{
                  background: tab === t ? 'rgba(245,200,66,0.12)' : 'transparent',
                  color: tab === t ? '#f5c842' : '#64748b',
                  borderBottom: tab === t ? '2px solid #f5c842' : '2px solid transparent',
                }}>
                {t === 'create' ? '+ Créer un salon' : '# Rejoindre'}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <>
              <div>
                <p className="text-xs text-slate-500 mb-2 font-display tracking-wider">MISE PAR JOUEUR</p>
                <div className="grid grid-cols-4 gap-2">
                  {STAKES.map(s => (
                    <button key={s} onClick={() => setStake(s)}
                      className="py-2.5 rounded-xl text-sm font-display font-bold transition-all"
                      style={{
                        background: stake === s ? 'rgba(245,200,66,0.18)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${stake === s ? '#f5c842' : 'rgba(255,255,255,0.1)'}`,
                        color: stake === s ? '#f5c842' : '#94a3b8',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2 font-display tracking-wider">DURÉE DE PARTIE</p>
                <div className="flex flex-col gap-2">
                  {LIMITS.map(l => (
                    <button key={l.value} onClick={() => setLimit(l.value)}
                      className="py-2.5 px-4 rounded-xl text-sm font-display text-left transition-all"
                      style={{
                        background: limit === l.value ? 'rgba(103,232,249,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${limit === l.value ? '#67e8f9' : 'rgba(255,255,255,0.1)'}`,
                        color: limit === l.value ? '#67e8f9' : '#94a3b8',
                      }}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <button onClick={handleCreate} disabled={loading}
                className="h-12 rounded-2xl font-display text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f5c842, #d4a017)', color: '#000', boxShadow: '0 0 20px rgba(245,200,66,0.3)' }}>
                {loading ? 'Création...' : 'Créer le salon'}
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-slate-500 mb-2 font-display tracking-wider">CODE DU SALON</p>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  placeholder="Ex: 482931"
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 rounded-xl text-center text-2xl font-display font-bold text-white tracking-[0.4em] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <button onClick={handleJoin} disabled={loading || code.length !== 6}
                className="h-12 rounded-2xl font-display text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #f5c842, #d4a017)', color: '#000', boxShadow: '0 0 20px rgba(245,200,66,0.3)' }}>
                {loading ? 'Connexion...' : 'Rejoindre la partie'}
              </button>
            </>
          )}

          <p className="text-[10px] text-slate-600 text-center">
            Mise prélevée à la création/rejoindre · Vainqueur remporte la cagnotte
          </p>
        </motion.div>
      </motion.div>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="buy" />}
    </AnimatePresence>
  );
}
