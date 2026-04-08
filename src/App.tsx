import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";

import Onboarding from "@/pages/Onboarding";
import Lobby from "@/pages/Lobby";
import GameTable from "@/pages/GameTable";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import SettingsPage from "@/pages/SettingsPage";
import Rules from "@/pages/Rules";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter basename="/tarot">
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/game" element={<GameTable />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
