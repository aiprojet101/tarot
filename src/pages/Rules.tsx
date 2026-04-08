import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import BottomNav from "@/components/BottomNav";

export default function Rules() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl text-gold font-bold mb-6 text-center">Regles du Tarot</h1>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-6 pr-4">
            {/* Le jeu */}
            <section>
              <h2 className="text-lg text-gold font-semibold mb-2">Le jeu de cartes</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le Tarot se joue avec un jeu de 78 cartes : 56 cartes de couleur (14 par couleur : 1 a 10 + Valet, Cavalier, Dame, Roi) et 22 atouts (21 numérotes + l'Excuse).
              </p>
            </section>

            <Separator />

            {/* Bouts */}
            <section>
              <h2 className="text-lg text-gold font-semibold mb-2">Les Bouts (Oudlers)</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                3 cartes speciales : le Petit (atout 1), le 21 d'atout, et l'Excuse. Plus le preneur possede de bouts, moins il a besoin de points pour gagner.
              </p>
              <div className="glass-card p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>0 bout</span><span className="text-gold">56 points</span></div>
                <div className="flex justify-between"><span>1 bout</span><span className="text-gold">51 points</span></div>
                <div className="flex justify-between"><span>2 bouts</span><span className="text-gold">41 points</span></div>
                <div className="flex justify-between"><span>3 bouts</span><span className="text-gold">36 points</span></div>
              </div>
            </section>

            <Separator />

            {/* Encheres */}
            <section>
              <h2 className="text-lg text-gold font-semibold mb-2">Les Encheres</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                Chaque joueur peut passer ou surencherir. L'enchere la plus haute remporte le droit de jouer seul contre les autres.
              </p>
              <div className="glass-card p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Petite</span><span>x1 - Preneur voit le chien</span></div>
                <div className="flex justify-between"><span>Garde</span><span>x2 - Preneur voit le chien</span></div>
                <div className="flex justify-between"><span>Garde Sans</span><span>x4 - Chien pour le preneur (non vu)</span></div>
                <div className="flex justify-between"><span>Garde Contre</span><span>x6 - Chien pour la defense</span></div>
              </div>
            </section>

            <Separator />

            {/* Valeur des cartes */}
            <section>
              <h2 className="text-lg text-gold font-semibold mb-2">Valeur des cartes</h2>
              <div className="glass-card p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Bout (Oudler)</span><span className="text-gold">4.5 pts</span></div>
                <div className="flex justify-between"><span>Roi</span><span>4.5 pts</span></div>
                <div className="flex justify-between"><span>Dame</span><span>3.5 pts</span></div>
                <div className="flex justify-between"><span>Cavalier</span><span>2.5 pts</span></div>
                <div className="flex justify-between"><span>Valet</span><span>1.5 pts</span></div>
                <div className="flex justify-between"><span>Autres</span><span>0.5 pts</span></div>
              </div>
            </section>

            <Separator />

            {/* Jeu de la carte */}
            <section>
              <h2 className="text-lg text-gold font-semibold mb-2">Jeu de la carte</h2>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>On doit fournir la couleur demandee</li>
                <li>Si on ne peut pas, on doit couper (jouer atout)</li>
                <li>On doit monter a l'atout si possible</li>
                <li>L'Excuse peut etre jouee a tout moment (elle revient a son camp)</li>
                <li>Le Petit joue au dernier pli : bonus "Petit au bout"</li>
              </ul>
            </section>

            <Separator />

            {/* Poignee */}
            <section>
              <h2 className="text-lg text-gold font-semibold mb-2">La Poignee</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                Un joueur peut declarer une poignee (montrer ses atouts) avant de jouer sa premiere carte.
              </p>
              <div className="glass-card p-3 text-sm space-y-1">
                <div className="text-muted-foreground font-medium mb-1">A 4 joueurs :</div>
                <div className="flex justify-between"><span>Simple (10 atouts)</span><span className="text-gold">+20</span></div>
                <div className="flex justify-between"><span>Double (13 atouts)</span><span className="text-gold">+30</span></div>
                <div className="flex justify-between"><span>Triple (15 atouts)</span><span className="text-gold">+40</span></div>
              </div>
            </section>

            <Separator />

            {/* 5 joueurs */}
            <section>
              <h2 className="text-lg text-gold font-semibold mb-2">Variante a 5 joueurs</h2>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Chaque joueur recoit 15 cartes (chien de 3)</li>
                <li>Le preneur appelle un Roi : le possesseur de ce Roi devient son partenaire secret</li>
                <li>Le partenaire ne se revele que lorsque le Roi appele est joue</li>
              </ul>
            </section>

            <div className="h-4" />
          </div>
        </ScrollArea>
      </div>
      <BottomNav />
    </div>
  );
}
