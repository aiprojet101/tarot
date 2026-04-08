import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Gamepad2, Coins, Settings, ArrowLeft, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const kpis = [
  { label: 'Joueurs actifs', value: '1,247', change: '+12%', icon: Users, color: 'text-accent' },
  { label: 'Parties / jour', value: '3,891', change: '+8%', icon: Gamepad2, color: 'text-neon-green' },
  { label: 'Revenus', value: '€12,450', change: '+23%', icon: Coins, color: 'text-accent' },
  { label: 'Rétention', value: '68%', change: '+5%', icon: TrendingUp, color: 'text-accent' },
];

const chartData = [
  { day: 'Lun', joueurs: 320, parties: 580 },
  { day: 'Mar', joueurs: 450, parties: 720 },
  { day: 'Mer', joueurs: 380, parties: 650 },
  { day: 'Jeu', joueurs: 520, parties: 890 },
  { day: 'Ven', joueurs: 610, parties: 1020 },
  { day: 'Sam', joueurs: 780, parties: 1340 },
  { day: 'Dim', joueurs: 690, parties: 1180 },
];

const tabs = ['Dashboard', 'Utilisateurs', 'Tables', 'Économie', 'Événements', 'Paramètres'];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="min-h-screen suit-pattern">
      <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center gap-3 gold-border" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <button onClick={() => navigate('/lobby')} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <BarChart3 className="w-5 h-5 text-accent" />
        <h1 className="font-display text-lg text-glow-gold">Admin Panel</h1>
      </header>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto relative z-10">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab ? 'gradient-gold text-primary-foreground neon-glow-gold gold-border' : 'wood-row text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 max-w-6xl mx-auto space-y-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="wood-row p-4 rounded-lg ornate-corners">
              <div className="flex items-center justify-between mb-2 relative z-10">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                <span className="text-xs text-neon-green font-display">{kpi.change}</span>
              </div>
              <p className="font-display text-xl relative z-10">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground relative z-10">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="wood-row p-4 rounded-lg ornate-corners">
            <h3 className="font-display text-sm mb-4 flex items-center gap-2 relative z-10"><Activity className="w-4 h-4 text-accent" /> Joueurs actifs</h3>
            <div className="relative z-10">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(40 10% 50%)' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(40 10% 50%)' }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(160 20% 10%)', border: '1px solid hsl(40 30% 22%)', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="joueurs" stroke="hsl(40 80% 55%)" strokeWidth={2} dot={{ fill: 'hsl(40 80% 55%)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="wood-row p-4 rounded-lg ornate-corners">
            <h3 className="font-display text-sm mb-4 flex items-center gap-2 relative z-10"><Gamepad2 className="w-4 h-4 text-neon-green" /> Parties par jour</h3>
            <div className="relative z-10">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(40 10% 50%)' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(40 10% 50%)' }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(160 20% 10%)', border: '1px solid hsl(40 30% 22%)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="parties" fill="hsl(140 50% 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="wood-row p-4 rounded-lg ornate-corners">
          <h3 className="font-display text-sm mb-4 relative z-10">Derniers utilisateurs</h3>
          <div className="space-y-2 relative z-10">
            {['DragonKing', 'PhoenixQueen', 'LotusWarrior', 'SilverFox'].map((name, i) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-card/60 flex items-center justify-center text-sm border border-border">{'🐉🦊🎭🦊'[i]}</div>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-[10px] text-muted-foreground">Inscrit il y a {i + 1}h</p>
                  </div>
                </div>
                <span className="text-[10px] text-neon-green">Actif</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
