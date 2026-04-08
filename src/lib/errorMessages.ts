// Traduction des erreurs Supabase en français
const ERROR_MAP: [RegExp, string][] = [
  [/email.*already.*registered/i, 'Cette adresse email est déjà utilisée par un autre compte.'],
  [/invalid.*email/i, 'Adresse email invalide.'],
  [/password.*short/i, 'Le mot de passe est trop court (6 caractères min).'],
  [/password.*weak/i, 'Le mot de passe est trop faible.'],
  [/invalid.*credentials/i, 'Email ou mot de passe incorrect.'],
  [/email.*not.*confirmed/i, 'Votre email n\'a pas encore été confirmé.'],
  [/rate.*limit/i, 'Trop de tentatives. Réessayez dans quelques minutes.'],
  [/network/i, 'Erreur de connexion. Vérifiez votre réseau.'],
  [/user.*not.*found/i, 'Aucun compte trouvé avec cet email.'],
  [/already.*registered/i, 'Un compte existe déjà avec cette adresse.'],
  [/signup.*disabled/i, 'Les inscriptions sont temporairement désactivées.'],
  [/email.*change/i, 'Impossible de changer l\'email pour le moment.'],
  [/same.*email/i, 'C\'est déjà votre adresse email actuelle.'],
  [/token.*expired/i, 'Le lien a expiré. Veuillez en demander un nouveau.'],
  [/otp.*expired/i, 'Le code a expiré. Veuillez en demander un nouveau.'],
];

export function translateError(message: string): string {
  for (const [pattern, translation] of ERROR_MAP) {
    if (pattern.test(message)) return translation;
  }
  return 'Une erreur est survenue. Réessayez plus tard.';
}
