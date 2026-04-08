// Mots interdits dans les pseudos (insensible à la casse, détecte même si inclus dans un mot)
const FORBIDDEN_WORDS = [
  'boss',
  'admin',
  'moderator',
  'letreize',
  'le13',
  'support',
  'system',
  'officiel',
  'staff',
];

/** Vérifie si un pseudo contient un mot interdit (insensible à la casse, espaces ignorés) */
export function containsForbiddenWord(username: string): string | null {
  const normalized = username.toLowerCase().replace(/\s+/g, '');
  for (const word of FORBIDDEN_WORDS) {
    if (normalized.includes(word)) return word;
  }
  return null;
}
