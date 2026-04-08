import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PlayingCard from "./PlayingCard";
import type { Card } from "@/lib/gameLogic";

interface PoigneeModalProps {
  open: boolean;
  trumps: Card[];
  poigneeType: "simple" | "double" | "triple";
  bonusValue: number;
  onDeclare: () => void;
  onSkip: () => void;
}

export default function PoigneeModal({
  open,
  trumps,
  poigneeType,
  bonusValue,
  onDeclare,
  onSkip,
}: PoigneeModalProps) {
  const typeLabel = {
    simple: "Simple",
    double: "Double",
    triple: "Triple",
  }[poigneeType];

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold">Poignee {typeLabel}</DialogTitle>
          <DialogDescription>
            Vous pouvez declarer une poignee (+{bonusValue} points).
            Les atouts seront montres aux autres joueurs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1 justify-center py-3">
          {trumps.map((card) => (
            <PlayingCard
              key={`${card.type}-${card.rank}`}
              card={card}
              size="small"
              disabled
            />
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onSkip}>
            Non merci
          </Button>
          <Button onClick={onDeclare} className="btn-primary">
            Declarer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
