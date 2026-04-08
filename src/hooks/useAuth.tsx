import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, Profile } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  // 1. onAuthStateChange : SYNCHRONE uniquement, pas d'await
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
      }
      // Si session présente, loading sera mis à false après fetchProfile (voir effet ci-dessous)
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Charger le profil dès que l'utilisateur change (ou au démarrage)
  useEffect(() => {
    if (user) {
      setLoading(true);
      // Créer profil si absent (première connexion après confirmation email)
      supabase.from('profiles').select('id').eq('id', user.id).maybeSingle().then(async ({ data: existing }) => {
        if (!existing) {
          const username = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Joueur';
          await supabase.from('profiles').upsert({
            id: user.id,
            username,
            avatar_emoji: '🎭',
            tarot_elo: 1000,
            tarot_games_played: 0,
            tarot_wins: 0,
            tarot_best_elo: 1000,
          });
        }
        await fetchProfile(user.id);
        setLoading(false);
      });
    }
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (!error && data.user) {
      if (data.session) {
        return { error: null };
      } else {
        return { error: null, needsConfirmation: true };
      }
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
