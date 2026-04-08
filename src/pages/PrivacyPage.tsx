import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Trash2, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const load = (key: string, def: boolean) => {
  const v = localStorage.getItem(key);
  return v === null ? def : v === 'true';
};

export default function PrivacyPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [publicProfile, setPublicProfile] = useState(() => load('tarot_public_profile', true));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const togglePublicProfile = () => {
    const next = !publicProfile;
    localStorage.setItem('tarot_public_profile', String(next));
    setPublicProfile(next);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    await supabase.from('notifications').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-24 suit-pattern">
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-base text-glow-gold">Confidentialité</h1>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-3 relative z-10">

        {/* Profil */}
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600 px-1">Profil</p>

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-2xl flex items-center justify-between cursor-pointer"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(255,255,255,0.07)' }}
          onClick={togglePublicProfile}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <Eye className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-white">Profil public</p>
              <p className="text-[10px] text-slate-500">
                {publicProfile ? 'Visible dans le classement' : 'Masqué du classement'}
              </p>
            </div>
          </div>
          <Toggle on={publicProfile} />
        </motion.div>

        {/* Données */}
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-emerald-600 px-1 mt-2">Données</p>

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <p className="font-display text-sm font-semibold text-white">Données collectées</p>
          </div>
          <ul className="flex flex-col gap-1.5 pl-1">
            {[
              'Pseudonyme et avatar choisis par vous',
              'Statistiques de jeu (parties, TRZ)',
              'Notifications en jeu',
              'Aucune donnée de localisation ni publicité',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-[11px] text-slate-400">
                <span className="text-emerald-600 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Politique */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl"
          style={{ background: 'linear-gradient(145deg, #0f2a18, #071a0f)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Tarot respecte votre vie privee. Vos donnees de jeu sont utilisees uniquement pour faire
            fonctionner l'application. Elles ne sont ni vendues ni partagees avec des tiers.
          </p>
        </motion.div>

        {/* Zone danger */}
        {user && (
          <>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-red-700 px-1 mt-2">Zone danger</p>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-left">
                <p className="font-display text-sm font-semibold text-red-400">Supprimer mon compte</p>
                <p className="text-[10px] text-slate-600">Action irréversible — toutes vos données seront effacées</p>
              </div>
            </motion.button>
          </>
        )}
      </div>

      <BottomNav />

      {/* Modal confirmation suppression */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-center"
            style={{ background: 'rgba(5,16,10,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-4 mb-8 p-6 rounded-3xl flex flex-col gap-4"
              style={{ background: 'linear-gradient(145deg, #1a0a0a, #0d0505)', border: '1.5px solid rgba(239,68,68,0.3)', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-bold text-red-400">Supprimer le compte ?</p>
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cette action est <strong className="text-white">irréversible</strong>. Votre profil, vos statistiques,
                votre solde TRZ et toutes vos données seront définitivement supprimés.
              </p>
              <div className="flex gap-3 mt-1">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-11 rounded-2xl font-display text-sm transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  Annuler
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="flex-1 h-11 rounded-2xl font-display text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
                  {deleting ? 'Suppression...' : 'Oui, supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
