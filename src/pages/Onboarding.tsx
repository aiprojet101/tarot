import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 stars-pattern opacity-40" />

      {/* Decorative card shapes */}
      <div className="absolute top-20 left-10 w-16 h-24 rounded-lg border border-gold/10 rotate-[-15deg] opacity-20" />
      <div className="absolute top-32 right-16 w-14 h-20 rounded-lg border border-purple-400/10 rotate-[20deg] opacity-20" />
      <div className="absolute bottom-40 left-20 w-12 h-18 rounded-lg border border-gold/10 rotate-[10deg] opacity-15" />
      <div className="absolute bottom-32 right-10 w-16 h-24 rounded-lg border border-purple-400/10 rotate-[-12deg] opacity-15" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 relative z-10"
      >
        {/* Card icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto"
        >
          <div className="w-24 h-32 mx-auto rounded-xl border-2 border-gold/40 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center glow-gold">
            <div className="text-4xl text-gold">&#x2726;</div>
          </div>
        </motion.div>

        {/* Title */}
        <div>
          <h1 className="text-5xl font-bold text-gold text-glow-gold tracking-wider">
            TAROT
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xs mx-auto">
            Le jeu de cartes francais classique. Prenez, enchérissez, triomphez.
          </p>
        </div>

        {/* Features */}
        <div className="flex gap-6 justify-center text-xs text-muted-foreground">
          <div className="text-center">
            <div className="text-gold text-lg mb-1">78</div>
            <div>cartes</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 text-lg mb-1">4-5</div>
            <div>joueurs</div>
          </div>
          <div className="text-center">
            <div className="text-gold text-lg mb-1">21</div>
            <div>atouts</div>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/lobby")}
          className="btn-primary text-lg px-10 py-4"
        >
          Jouer
        </motion.button>
      </motion.div>
    </div>
  );
}
