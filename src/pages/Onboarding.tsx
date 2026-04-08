import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn, UserPlus, Crown, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { containsForbiddenWord } from '@/lib/forbiddenWords';
import { translateError } from '@/lib/errorMessages';

type Screen = 'home' | 'login' | 'register' | 'confirm';

export default function Onboarding() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si déjà connecté, aller directement au lobby
  useEffect(() => {
    if (!authLoading && user) navigate('/lobby');
  }, [authLoading, user]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (value.trim().length < 3) { setUsernameStatus('idle'); return; }
    if (containsForbiddenWord(value.trim())) { setUsernameStatus('taken'); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const timeoutPromise = new Promise<'idle'>(r => setTimeout(() => r('idle'), 4000));
        const queryPromise = supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .ilike('username', value.trim())
          .then(({ count, error }) => {
            if (error) return 'idle' as const;
            return (count && count > 0) ? 'taken' as const : 'available' as const;
          });
        const result = await Promise.race([queryPromise, timeoutPromise]);
        setUsernameStatus(result);
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  };

  useEffect(() => () => { if (usernameTimer.current) clearTimeout(usernameTimer.current); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError('Email ou mot de passe incorrect.'); return; }
    navigate('/lobby');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.trim().length < 3) { setError('Pseudo trop court (3 caractères min).'); return; }
    const forbidden = containsForbiddenWord(username.trim());
    if (forbidden) { setError(`Le mot "${forbidden}" n'est pas autorisé dans un pseudo.`); return; }
    if (usernameStatus === 'taken') { setError('Ce pseudo est déjà pris.'); return; }
    // Vérification finale au submit si le check temps réel n'a pas pu conclure
    if (usernameStatus !== 'available') {
      setLoading(true);
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).ilike('username', username.trim());
      if (count && count > 0) { setError('Ce pseudo est déjà pris.'); setLoading(false); return; }
      setLoading(false);
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email, password, username.trim());
    setLoading(false);
    if (error) {
      const translated = translateError(error.message ?? '');
      if (error.message?.toLowerCase().includes('already registered')) {
        setError(translated);
        setTimeout(() => { setError(''); setScreen('login'); }, 1500);
      } else {
        setError(translated);
      }
      return;
    }
    if (needsConfirmation) { setScreen('confirm'); return; }
    navigate('/lobby');
  };

  const floatingCards = [...Array(20)].map((_, i) => (
    <motion.div
      key={i}
      className="absolute text-4xl opacity-[0.08] text-accent"
      initial={{ y: '110vh', x: `${Math.random() * 100}vw`, rotate: Math.random() * 360 }}
      animate={{ y: '-10vh', rotate: Math.random() * 720 }}
      transition={{ duration: 10 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 5, ease: 'linear' }}
    >
      {['♠', '♥', '♦', '♣'][i % 4]}
    </motion.div>
  ));

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 suit-pattern">
      <div className="absolute inset-0 overflow-hidden">
        {floatingCards}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">

        {/* ── Accueil ── */}
        {screen === 'home' && (
          <motion.div key="home"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center text-center max-w-md w-full"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="mb-6">
              <div className="w-24 h-24 rounded-2xl gradient-gold flex items-center justify-center neon-glow-gold gold-border">
                <Crown className="w-12 h-12 text-primary-foreground" />
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 text-glow-gold text-accent">TAROT</h1>
            <p className="text-sm text-muted-foreground mb-1 font-display tracking-[0.3em]">LE JEU DE 78 CARTES</p>
            <p className="text-muted-foreground mb-10 text-sm">L'experience ultime du Tarot francais - Encheres, atouts et strategie</p>

            <div className="flex flex-col gap-3 w-full">
              <Button onClick={() => setScreen('register')}
                className="w-full h-14 text-lg font-display gradient-gold text-primary-foreground border-0 neon-glow-gold hover:scale-[1.02] transition-transform gold-border">
                <Sparkles className="w-5 h-5 mr-2" />
                Créer un compte
              </Button>
              <Button variant="outline" onClick={() => setScreen('login')}
                className="w-full h-12 border-accent/30 text-foreground hover:bg-accent/10 hover:border-accent/50">
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Connexion ── */}
        {screen === 'login' && (
          <motion.div key="login"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-sm"
          >
            <button onClick={() => { setScreen('home'); setError(''); }}
              className="flex items-center gap-2 text-sm text-slate-400 mb-6 hover:text-accent transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <h2 className="font-script text-3xl mb-1" style={{ color: '#f5c842' }}>Connexion</h2>
            <p className="text-xs text-slate-500 mb-6">Content de te revoir !</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                required className={inputClass} style={inputStyle} />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required className={inputClass + ' pr-12'} style={inputStyle} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <Button type="submit" disabled={loading}
                className="w-full h-12 mt-1 font-display gradient-gold text-primary-foreground border-0 neon-glow-gold">
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-5">
              Pas encore de compte ?{' '}
              <button onClick={() => { setScreen('register'); setError(''); }}
                className="text-amber-400 hover:text-amber-300 underline">Créer un compte</button>
            </p>
          </motion.div>
        )}

        {/* ── Inscription ── */}
        {screen === 'register' && (
          <motion.div key="register"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-sm"
          >
            <button onClick={() => { setScreen('home'); setError(''); }}
              className="flex items-center gap-2 text-sm text-slate-400 mb-6 hover:text-accent transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <h2 className="font-script text-3xl mb-1" style={{ color: '#f5c842' }}>Créer un compte</h2>
            <p className="text-xs text-slate-500 mb-6">Rejoins la compétition !</p>

            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div className="relative">
                <input type="text" placeholder="Pseudo (ex: AtoutMajeur)" value={username}
                  onChange={e => handleUsernameChange(e.target.value)} required minLength={3} maxLength={20}
                  className={inputClass + ' pr-10'}
                  style={{ ...inputStyle, borderColor: usernameStatus === 'available' ? 'rgba(74,222,128,0.5)' : usernameStatus === 'taken' ? 'rgba(248,113,113,0.5)' : undefined }} />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />}
                  {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-400" />}
                  {usernameStatus === 'taken' && <X className="w-4 h-4 text-red-400" />}
                </div>
              </div>
              {usernameStatus === 'taken' && <p className="text-xs text-red-400 -mt-1">Ce pseudo est déjà pris.</p>}
              {usernameStatus === 'available' && <p className="text-xs text-green-400 -mt-1">Pseudo disponible !</p>}
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                required className={inputClass} style={inputStyle} />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe (6 caractères min)"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6} className={inputClass + ' pr-12'} style={inputStyle} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <Button type="submit" disabled={loading}
                className="w-full h-12 mt-1 font-display gradient-gold text-primary-foreground border-0 neon-glow-gold">
                {loading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-5">
              Déjà un compte ?{' '}
              <button onClick={() => { setScreen('login'); setError(''); }}
                className="text-amber-400 hover:text-amber-300 underline">Se connecter</button>
            </p>
          </motion.div>
        )}

        {screen === 'confirm' && (
          <motion.div key="confirm"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-sm text-center"
          >
            <div className="text-6xl mb-4">📬</div>
            <h2 className="font-script text-3xl mb-2" style={{ color: '#f5c842' }}>Vérifie ta boîte mail</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Un lien de confirmation a été envoyé à<br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <div className="px-4 py-3 rounded-xl text-xs text-slate-400 mb-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Clique sur le lien dans l'email pour activer ton compte, puis reviens te connecter.
            </div>
            <button onClick={() => { setScreen('login'); setError(''); }}
              className="text-amber-400 hover:text-amber-300 text-sm underline">
              Se connecter
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
