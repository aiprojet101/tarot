import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';

const sections = [
  {
    icon: '🎯',
    title: 'Objectif',
    content: 'Le preneur doit realiser un nombre de points suffisant en remportant des plis, en fonction du nombre de bouts qu\'il detient en fin de partie.',
  },
  {
    icon: '👥',
    title: 'Joueurs & Materiel',
    items: [
      '4 ou 5 joueurs',
      '78 cartes : 4 couleurs x 14 cartes + 21 atouts + l\'Excuse',
      'Couleurs : Coeur, Carreau, Trefle, Pique',
      'Chaque couleur : 1-10, Valet (V), Cavalier (C), Dame (D), Roi (R)',
      'Atouts : numerotes de 1 a 21',
      'L\'Excuse : carte speciale (le "fou")',
    ],
  },
  {
    icon: '🌟',
    title: 'Les 3 Bouts (Oudlers)',
    content: 'Les cartes les plus importantes du jeu :',
    items: [
      'Le Petit (atout 1)',
      'Le 21 (atout 21)',
      'L\'Excuse (le fou)',
    ],
    note: 'Plus le preneur a de bouts, moins il a besoin de points pour gagner.',
  },
  {
    icon: '🔢',
    title: 'Seuils de points selon les bouts',
    items: [
      '0 bout : il faut 56 points',
      '1 bout : il faut 51 points',
      '2 bouts : il faut 41 points',
      '3 bouts : il faut 36 points',
    ],
    note: 'Total des points dans le jeu : 91 points',
  },
  {
    icon: '💰',
    title: 'Valeur des cartes',
    items: [
      'Roi : 4.5 points',
      'Dame : 3.5 points',
      'Cavalier : 2.5 points',
      'Valet : 1.5 points',
      'Autres cartes (petites + atouts) : 0.5 point',
      'Les bouts valent 4.5 points chacun',
    ],
    note: 'On compte les cartes par paires : une habillage + une basse = valeur arrondie',
  },
  {
    icon: '📢',
    title: 'Les Encheres',
    content: 'Apres la distribution, chaque joueur annonce ou passe :',
    items: [
      'Petite — enchère minimale, le preneur prend le Chien',
      'Garde — mise doublee, le preneur prend le Chien',
      'Garde Sans — mise quadruplee, le Chien va au preneur sans etre montre',
      'Garde Contre — mise maximale, le Chien va a la defense',
    ],
    note: 'Chaque enchere doit etre superieure a la precedente. Si tous passent, on redistribue.',
  },
  {
    icon: '🐕',
    title: 'Le Chien et l\'Ecart',
    items: [
      'En Petite et Garde : le preneur retourne le Chien (6 cartes) et le montre a tous',
      'Il integre ces cartes a sa main puis ecarte 6 cartes face cachee',
      'Interdit d\'ecarter : les Bouts, les Rois, et les Atouts (sauf si pas d\'autre choix)',
      'Les points de l\'ecart comptent pour le preneur',
    ],
  },
  {
    icon: '👑',
    title: 'Appel au Roi (5 joueurs)',
    content: 'A 5 joueurs, le preneur appelle un Roi. Le possesseur de ce Roi devient son partenaire secret.',
    items: [
      'Le partenaire ne se revele qu\'en jouant le Roi appele',
      'Si le preneur possede les 4 Rois, il peut appeler une Dame',
      'Le preneur et son partenaire partagent gains ou pertes',
    ],
  },
  {
    icon: '▶️',
    title: 'Deroulement du jeu',
    items: [
      'Le joueur apres le donneur entame le premier pli',
      'Obligation de fournir la couleur demandee',
      'Si on ne peut pas fournir : obligation de couper (jouer atout)',
      'Si un atout est deja joue : obligation de monter (jouer un atout plus fort si possible)',
      'Si on ne peut ni fournir ni couper : jouer n\'importe quelle carte',
      'L\'Excuse peut etre jouee a tout moment (elle revient a son proprietaire)',
    ],
  },
  {
    icon: '🏆',
    title: 'Fin de manche et calcul',
    items: [
      'On compte les points du preneur (plis + ecart)',
      'On compare au seuil requis selon ses bouts',
      'Difference = points du preneur - seuil',
      'Score = (25 + difference) x multiplicateur de l\'enchere',
      'Multiplicateur : Petite x1, Garde x2, Garde Sans x4, Garde Contre x6',
    ],
    note: 'Le preneur gagne ou perd ce score contre chaque defenseur.',
  },
  {
    icon: '⭐',
    title: 'Bonus',
    items: [
      'Petit au bout : jouer le Petit (atout 1) au dernier pli et le gagner → +10 x multiplicateur',
      'Poignee : annoncer en montrant ses atouts — Simple (10 atouts) +20, Double (13) +30, Triple (15) +40',
      'Chelem annonce : remporter tous les plis → +400',
      'Chelem non annonce : remporter tous les plis → +200',
    ],
  },
  {
    icon: '⏱️',
    title: 'Regles de l\'app',
    items: [
      'Timer par tour de jeu',
      'Validation automatique des coups',
      'Blocage des cartes invalides',
      'Passage automatique en cas d\'inactivite',
      'Comptage des points automatique',
    ],
  },
];

export default function Rules() {
  return (
    <div className="min-h-screen pb-24 suit-pattern">
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 gold-border" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h1 className="font-display text-lg text-center text-accent">Regles du Tarot</h1>
        <p className="text-xs text-muted-foreground text-center">Tarot francais - 4 ou 5 joueurs</p>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-3">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-xl p-4 gold-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{section.icon}</span>
              <h2 className="font-display text-sm text-accent">{section.title}</h2>
            </div>

            {section.content && (
              <p className="text-sm text-muted-foreground mb-1">{section.content}</p>
            )}

            {section.items && (
              <ul className="space-y-1">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-accent mt-0.5 shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {section.note && (
              <p className="mt-2 text-xs text-accent/70 italic">{section.note}</p>
            )}
          </motion.div>
        ))}

        {/* Resume */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sections.length * 0.04 }}
          className="glass rounded-xl p-4 gold-border border-accent/40"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🧠</span>
            <h2 className="font-display text-sm text-accent">Resume</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le Tarot est un jeu d'encheres et de plis avec 78 cartes. Le preneur s'engage a realiser un contrat face aux defenseurs. Les 3 bouts (Petit, 21, Excuse) sont la cle de la victoire : plus vous en avez, moins vous avez besoin de points. Strategie, bluff et gestion des atouts sont essentiels.
          </p>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
