import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Volume2, Bell, Globe, LogOut, Shield, HelpCircle,
  BookOpen, ChevronRight, UserPen, Trash2, BellRing, VolumeX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const load = (key: string, def: boolean) => {
  const v = localStorage.getItem(key);
  return v === null ? def : v === 'true';
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [audio, setAudio]       = useState(() => load('tarot_audio', true));
  const [notifs, setNotifs]     = useState(() => load('tarot_notifs', true));
  const [turnAlert, setTurnAlert] = useState(() => load('tarot_turn_alert', true));

  // Notifications push
  const [pushPerm, setPushPerm] = useState<NotificationPermission>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // Suppression de compte
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    const next = !val;
    localStorage.setItem(key, String(next));
    setter(next);
  };

  const requestPush = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setPushPerm(perm);
    localStorage.setItem('tarot_notifs', String(perm === 'granted'));
    setNotifs(perm === 'granted');
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Anonymiser le profil
      await supabase.from('profiles').update({
        username: `supprimé_${Date.now()}`,
        avatar_emoji: '❌',
        tarot_elo: 0,
        tarot_ranked_elo: 0,
        tarot_wins: 0,
        tarot_games_played: 0,
      }).eq('id', user.id);
      // Nettoyer localStorage
      Object.keys(localStorage).filter(k => k.startsWith('tarot')).forEach(k => localStorage.removeItem(k));
      await signOut();
      navigate('/');
    } catch { setDeleting(false); }
  };

  return (
    <div className="min-h-screen pb-24 suit-pattern">
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-base text-glow-gold">Paramètres</h1>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-3 relative z-10">

        {/* Section Profil */}
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600 px-1">Mon profil</p>

        <motion.button initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/profile')}
          className="p-4 rounded-2xl flex items-center justify-between w-full text-left transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(245,200,66,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}>
              <UserPen className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-white">Modifier le profil</p>
              <p className="text-[10px] text-slate-500">Pseudo, avatar emoji</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </motion.button>

        {/* Section Jeu */}
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600 px-1 mt-2">Jeu</p>

        {/* Audio */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 }}
          className="p-4 rounded-2xl flex items-center justify-between cursor-pointer"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(255,255,255,0.07)' }}
          onClick={() => toggle('tarot_audio', audio, setAudio)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}>
              {audio ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-white">Sons du jeu</p>
              <p className="text-[10px] text-slate-500">{audio ? 'Effets sonores activés' : 'Effets sonores désactivés'}</p>
            </div>
          </div>
          <Toggle on={audio} />
        </motion.div>

        {/* Alerte de tour */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }}
          className="p-4 rounded-2xl flex items-center justify-between cursor-pointer"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(255,255,255,0.07)' }}
          onClick={() => toggle('tarot_turn_alert', turnAlert, setTurnAlert)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <BellRing className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-white">Alerte de tour</p>
              <p className="text-[10px] text-slate-500">Sonnerie quand c'est ton tour</p>
            </div>
          </div>
          <Toggle on={turnAlert} />
        </motion.div>

        {/* Notifications push */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }}
          className="p-4 rounded-2xl flex items-center justify-between cursor-pointer"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(255,255,255,0.07)' }}
          onClick={pushPerm === 'default' ? requestPush : () => toggle('tarot_notifs', notifs, setNotifs)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(103,232,249,0.1)', border: '1px solid rgba(103,232,249,0.2)' }}>
              <Bell className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-white">Notifications</p>
              <p className="text-[10px] text-slate-500">
                {pushPerm === 'granted' ? (notifs ? 'Notifications activées' : 'Notifications désactivées') :
                 pushPerm === 'denied'  ? 'Bloquées par le navigateur' : 'Appuie pour autoriser'}
              </p>
            </div>
          </div>
          {pushPerm === 'denied'
            ? <span className="text-[10px] text-slate-600">Bloqué</span>
            : <Toggle on={notifs && pushPerm === 'granted'} />}
        </motion.div>

        {/* Section Infos */}
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600 px-1 mt-2">Informations</p>

        {[
          { icon: BookOpen,   label: 'Règles du jeu',   desc: 'Apprendre à jouer au Tarot',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.2)',  action: () => navigate('/rules') },
          { icon: Globe,      label: 'Langue',           desc: 'Français',                  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', action: () => {} },
          { icon: Shield,     label: 'Confidentialité',  desc: 'Paramètres de sécurité',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', action: () => navigate('/privacy') },
          { icon: HelpCircle, label: 'Aide',             desc: 'FAQ et support',             color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)',  action: () => {} },
        ].map((item, i) => (
          <motion.button key={item.label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + i * 0.04 }}
            onClick={item.action}
            className="p-4 rounded-2xl flex items-center justify-between w-full text-left transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-white">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </motion.button>
        ))}

        <p className="text-center text-[10px] text-slate-700 font-display mt-1">Tarot · v1.0.0</p>

        {/* Section Compte */}
        {user && (<>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600 px-1 mt-2">Compte</p>

          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            onClick={handleSignOut}
            className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <LogOut className="w-4 h-4" />
            <span className="font-display text-sm">Se déconnecter</span>
          </motion.button>

          {!showDeleteConfirm ? (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.15)', color: '#64748b' }}>
              <Trash2 className="w-3.5 h-3.5" />
              <span className="font-display text-xs">Supprimer mon compte</span>
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)' }}>
              <p className="font-display text-sm text-red-400 font-bold mb-1">Supprimer définitivement ?</p>
              <p className="text-[10px] text-slate-500 mb-3">Toutes tes données seront effacées. Cette action est irréversible.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-xl font-display text-xs text-slate-400"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Annuler
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="flex-1 py-2 rounded-xl font-display text-xs font-bold text-white"
                  style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.4)' }}>
                  {deleting ? 'Suppression...' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          )}
        </>)}
      </div>
      <BottomNav />
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className="w-11 h-6 rounded-full flex items-center px-1 transition-colors duration-200 flex-shrink-0"
      style={{ background: on ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)', border: `1px solid ${on ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
      <motion.div animate={{ x: on ? 18 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 rounded-full"
        style={{ background: on ? '#4ade80' : '#334155' }} />
    </div>
  );
}
