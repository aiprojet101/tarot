import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl text-gold">&#x2726;</div>
        <h1 className="text-4xl font-bold text-gold">404</h1>
        <p className="text-muted-foreground">Page introuvable</p>
        <Button onClick={() => navigate("/")} className="btn-primary">
          Retour a l'accueil
        </Button>
      </div>
    </div>
  );
}
