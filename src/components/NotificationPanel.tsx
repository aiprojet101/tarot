import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, CheckCheck, Eraser } from 'lucide-react';
import { Notification } from '@/hooks/useNotifications';

const TYPE_ICONS: Record<string, string> = {
  room_join:    '👤',
  game_start:   '🃏',
  game_win:     '🏆',
  game_loss:    '😔',
  division_up:  '🎉',
  division_down:'📉',
  mission:      '✅',
  streak:       '🔥',
  default:      '🔔',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${d}j`;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkAllRead,
  onDelete,
  onDeleteAll,
}: {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end justify-center"
        style={{ background: 'rgba(5,16,10,0.8)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}>

        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg mx-4 mb-8 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #0f2a18, #071a0f)',
            border: '1.5px solid rgba(212,160,23,0.3)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}>
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-[10px] text-amber-400">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-display transition-all"
                  style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)', color: '#f5c842' }}>
                  <CheckCheck className="w-3 h-3" />
                  Tout lire
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={onDeleteAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-display transition-all"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                  <Eraser className="w-3 h-3" />
                  Tout effacer
                </button>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <span className="text-5xl opacity-30">🔔</span>
                <p className="font-display text-sm text-slate-500">Aucune notification pour l'instant</p>
              </div>
            ) : (
              notifications.map(notif => (
                <motion.div key={notif.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3.5 rounded-2xl relative group"
                  style={{
                    background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(245,200,66,0.07)',
                    border: `1px solid ${notif.read ? 'rgba(255,255,255,0.06)' : 'rgba(245,200,66,0.2)'}`,
                  }}>
                  {/* Dot non-lu */}
                  {!notif.read && (
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                  <span className="text-2xl flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[notif.type] ?? TYPE_ICONS.default}
                  </span>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="font-display text-sm font-semibold text-white leading-tight">{notif.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-[9px] text-slate-600 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  <button onClick={() => onDelete(notif.id)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: 'rgba(255,100,100,0.12)', border: '1px solid rgba(255,100,100,0.2)' }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[9px] text-slate-700 text-center">
                Les notifications sont conservées 30 jours
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
