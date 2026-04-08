import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PrivateRoom() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong p-8 rounded-2xl text-center space-y-6 max-w-sm"
      >
        <div className="text-4xl">🃏</div>
        <h2 className="text-2xl font-display text-gold">Salon Prive</h2>
        <p className="text-muted-foreground text-sm">
          Le mode multijoueur en salon prive arrive bientot.
          Jouez en solo en attendant !
        </p>
        <button
          onClick={() => navigate("/lobby")}
          className="gold-border px-6 py-3 rounded-xl font-semibold text-gold hover:bg-gold/10 transition-all"
        >
          Retour au Lobby
        </button>
      </motion.div>
    </div>
  );
}
