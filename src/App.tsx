import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Onboarding from "./pages/Onboarding";
import Lobby from "./pages/Lobby";
import Rooms from "./pages/Rooms";
import GameTable from "./pages/GameTable";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Missions from "./pages/Missions";
import Social from "./pages/Social";
import SettingsPage from "./pages/SettingsPage";
import AdminPanel from "./pages/AdminPanel";
import Rules from "./pages/Rules";
import PrivateRoom from "./pages/PrivateRoom";
import PrivacyPage from "./pages/PrivacyPage";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/game" element={<GameTable />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/social" element={<Social />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/room/:code" element={<PrivateRoom />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/profile/:id" element={<PublicProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
