import BottomNav from "@/components/BottomNav";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl text-gold font-bold text-center">Politique de confidentialite</h1>

        <div className="glass-panel p-6 space-y-4 text-sm text-muted-foreground">
          <p>
            Cette application de Tarot est un jeu solo contre l'ordinateur. Aucune donnee personnelle n'est collectee ni transmise a des tiers.
          </p>
          <p>
            Les donnees de jeu (scores, parametres) sont stockees localement sur votre appareil via le localStorage du navigateur.
          </p>
          <p>
            Si vous utilisez la fonctionnalite de compte en ligne (optionnelle), vos donnees de profil sont stockees de maniere securisee via Supabase.
          </p>
          <p>
            Vous pouvez supprimer toutes vos donnees locales a tout moment depuis les reglages de l'application.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
