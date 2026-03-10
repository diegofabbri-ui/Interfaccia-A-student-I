import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Flame, Trophy, GraduationCap, Clock, CheckCircle, Target, 
  ArrowUpRight, Calendar, PieChart as PieChartIcon, Activity, Star, AlertTriangle, History
} from 'lucide-react';
import PremiumCard from './PremiumCard';
import SearchComponent from './ui/animated-glowing-search-bar';

type ProgressData = {
  id: string;
  streak_days: number;
  level: number;
  xp_current: number;
  xp_total: number;
  average_grade: number;
  exams_passed: number;
  exams_total: number;
  total_study_hours: number;
  topics_completed: number;
  simulations_completed: number;
  studio_streak_days: number;
};

type SessionData = {
  date: string;
  hours_studied: number;
  category: string;
};

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ name: string; ore: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ name: string; ore: number }[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Progress
      const { data: progData, error: progError } = await supabase
        .from('user_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (progData) setProgress(progData);

      // 2. Fetch Sessions for Charts
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (sessions) {
        processChartsData(sessions as SessionData[]);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processChartsData = (sessions: SessionData[]) => {
    // Process Weekly Data (Last 7 days)
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        name: days[d.getDay()],
        ore: 0
      };
    });

    sessions.forEach(s => {
      const match = last7Days.find(d => d.dateStr === s.date);
      if (match) match.ore += Number(s.hours_studied);
    });

    setWeeklyData(last7Days.map(({ name, ore }) => ({ name, ore: Number(ore.toFixed(1)) })));

    // Process Time Distribution (Pie Chart)
    const categories: Record<string, number> = {
      'Lettura': 0,
      'Esercizi': 0,
      'Ripasso': 0,
      'Simulazioni': 0,
      'Mappe': 0
    };
    const colors: Record<string, string> = {
      'Lettura': '#18181b', // zinc-900
      'Esercizi': '#3f3f46', // zinc-700
      'Ripasso': '#71717a', // zinc-500
      'Simulazioni': '#a1a1aa', // zinc-400
      'Mappe': '#e4e4e7' // zinc-200
    };

    let totalHours = 0;
    sessions.forEach(s => {
      if (categories[s.category] !== undefined) {
        categories[s.category] += Number(s.hours_studied);
        totalHours += Number(s.hours_studied);
      }
    });

    const distribution = Object.entries(categories).map(([name, value]) => ({
      name,
      value: totalHours > 0 ? Math.round((value / totalHours) * 100) : 0,
      color: colors[name]
    })).filter(item => item.value > 0);

    setTimeDistribution(distribution.length > 0 ? distribution : [
      { name: 'Lettura', value: 30, color: '#18181b' },
      { name: 'Esercizi', value: 25, color: '#3f3f46' },
      { name: 'Ripasso', value: 20, color: '#71717a' },
      { name: 'Simulazioni', value: 15, color: '#a1a1aa' },
      { name: 'Mappe', value: 10, color: '#e4e4e7' },
    ]);

    // Process Monthly Data (Last 6 months)
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        monthIdx: d.getMonth(),
        name: months[d.getMonth()],
        ore: 0
      };
    });

    sessions.forEach(s => {
      const sDate = new Date(s.date);
      const match = last6Months.find(m => m.monthIdx === sDate.getMonth());
      if (match) match.ore += Number(s.hours_studied);
    });

    setMonthlyData(last6Months.map(({ name, ore }) => ({ name, ore: Number(ore.toFixed(1)) })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-light text-zinc-400 animate-pulse tracking-widest uppercase">Caricamento...</div>
      </div>
    );
  }

  if (!progress) return null;

  const weeklyTotal = weeklyData.reduce((acc, curr) => acc + curr.ore, 0).toFixed(1);

  return (
    <div className="space-y-12 pb-12 relative overflow-hidden bg-[#fafafa]">
      {/* Animated SVG Background - Very subtle minimalist grid */}
      <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#18181b" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <header className="relative z-10 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-medium text-zinc-900 tracking-tight">I Tuoi Progressi</h1>
          <p className="text-zinc-500 mt-2 font-light text-lg">Monitora il tuo percorso universitario.</p>
        </div>
        <div className="flex-shrink-0">
          <SearchComponent />
        </div>
      </header>

      {/* Top Highlights - Streak & Level */}
      <div className="grid lg:grid-cols-12 gap-6 relative z-10">
        {/* Streak Card */}
        <PremiumCard 
          dark
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 bg-zinc-900 p-8 rounded-2xl text-white flex flex-col justify-center relative overflow-hidden shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-6">
            <Flame size={24} className="text-zinc-400" strokeWidth={1.5} />
            <span className="text-zinc-400 font-medium tracking-widest uppercase text-xs">Streak Attuale</span>
          </div>
          <div style={{ transform: "translateZ(50px)" }} className="z-10">
            <h2 className="text-6xl font-light leading-none tracking-tighter">{progress.streak_days} <span className="text-2xl text-zinc-500 font-light">giorni</span></h2>
          </div>
        </PremiumCard>

        {/* Level Card */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-7 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center relative overflow-hidden"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-6 relative z-10">
            <Trophy size={24} className="text-zinc-400" strokeWidth={1.5} />
            <span className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Livello {progress.level}</span>
          </div>
          <div style={{ transform: "translateZ(40px)" }} className="flex-1 relative z-10">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-4xl font-light text-zinc-900 tracking-tighter">{progress.xp_current} <span className="text-xl text-zinc-400 font-light">/ 1000 XP</span></h2>
            </div>
            <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(progress.xp_current / 1000) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="bg-zinc-900 h-full rounded-full relative" 
              />
            </div>
            <p className="text-zinc-400 font-light mt-4 text-sm flex items-center gap-2">
              <Star size={14} className="text-zinc-300" strokeWidth={1.5} />
              {progress.xp_total} XP totali accumulati
            </p>
          </div>
        </PremiumCard>
      </div>

      {/* Stats Grid - 6 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
        {[
          { label: 'Media Voti', value: progress.average_grade.toFixed(1), icon: GraduationCap },
          { label: 'Esami Superati', value: `${progress.exams_passed}/${progress.exams_total}`, icon: CheckCircle },
          { label: 'Ore Totali', value: `${progress.total_study_hours}h`, icon: Clock },
          { label: 'Studio Streak', value: `${progress.studio_streak_days} gg`, icon: Flame },
          { label: 'Argomenti', value: progress.topics_completed, icon: Target },
          { label: 'Simulazioni', value: progress.simulations_completed, icon: Activity },
        ].map((stat, i) => (
          <PremiumCard 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-start text-left group hover:border-zinc-400 transition-colors"
          >
            <div style={{ transform: "translateZ(30px)" }}>
              <stat.icon size={24} className="text-zinc-400 mb-6 group-hover:text-zinc-900 transition-colors" strokeWidth={1} />
            </div>
            <div style={{ transform: "translateZ(40px)" }}>
              <span className="text-3xl font-light text-zinc-900 mb-1 tracking-tight block">{stat.value}</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{stat.label}</span>
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6 relative z-10">
        {/* Weekly Chart */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={20} className="text-zinc-400" strokeWidth={1.5} />
                <h3 className="text-lg font-medium text-zinc-900">Settimana Corrente</h3>
              </div>
              <p className="text-sm text-zinc-500 font-light">Ore di studio per giorno</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light text-zinc-900">{weeklyTotal}h</p>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Totale</p>
            </div>
          </div>
          <div style={{ transform: "translateZ(20px)" }} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 300 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 300 }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ border: '1px solid #e4e4e7', borderRadius: '8px', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)', fontSize: '14px', fontWeight: 300 }}
                />
                <Bar dataKey="ore" fill="#18181b" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>

        {/* Weekly Trend */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-3 mb-8">
            <ArrowUpRight size={20} className="text-zinc-400" strokeWidth={1.5} />
            <div>
              <h3 className="text-lg font-medium text-zinc-900">Andamento</h3>
              <p className="text-sm text-zinc-500 font-light">Trend delle ore di studio</p>
            </div>
          </div>
          <div style={{ transform: "translateZ(20px)" }} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 300 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 300 }} />
                <RechartsTooltip 
                  contentStyle={{ border: '1px solid #e4e4e7', borderRadius: '8px', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)', fontSize: '14px', fontWeight: 300 }}
                />
                <Line type="monotone" dataKey="ore" stroke="#18181b" strokeWidth={2} dot={{ r: 4, fill: '#18181b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>

        {/* Time Distribution */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-3 mb-8">
            <PieChartIcon size={20} className="text-zinc-400" strokeWidth={1.5} />
            <div>
              <h3 className="text-lg font-medium text-zinc-900">Distribuzione</h3>
              <p className="text-sm text-zinc-500 font-light">Come usi il tuo tempo</p>
            </div>
          </div>
          <div style={{ transform: "translateZ(20px)" }} className="flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {timeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ border: '1px solid #e4e4e7', borderRadius: '8px', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)', fontSize: '14px', fontWeight: 300 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full md:w-auto">
              {timeDistribution.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-light text-zinc-700 text-sm">{item.name}</span>
                  </div>
                  <span className="font-medium text-zinc-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </PremiumCard>

        {/* Monthly Overview */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity size={20} className="text-zinc-400" strokeWidth={1.5} />
                <h3 className="text-lg font-medium text-zinc-900">Panoramica Mensile</h3>
              </div>
              <p className="text-sm text-zinc-500 font-light">Ore negli ultimi 6 mesi</p>
            </div>
            <div className="bg-zinc-100 text-zinc-900 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <ArrowUpRight size={14} />
              +8%
            </div>
          </div>
          <div style={{ transform: "translateZ(20px)" }} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOre" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 300 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12, fontWeight: 300 }} />
                <RechartsTooltip 
                  contentStyle={{ border: '1px solid #e4e4e7', borderRadius: '8px', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)', fontSize: '14px', fontWeight: 300 }}
                />
                <Area type="monotone" dataKey="ore" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorOre)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>
      </div>

      {/* Bottom Sections */}
      <div className="grid lg:grid-cols-3 gap-6 relative z-10">
        {/* Strengths */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-6">
            <Star size={20} className="text-zinc-400" strokeWidth={1.5} />
            <h3 className="text-lg font-medium text-zinc-900">Punti di Forza</h3>
          </div>
          <div style={{ transform: "translateZ(40px)" }} className="p-6 rounded-xl bg-zinc-50 border border-zinc-100 text-left">
            <p className="text-zinc-600 text-sm font-light leading-relaxed">Continua a studiare per scoprire i tuoi punti di forza.</p>
          </div>
        </PremiumCard>

        {/* Weaknesses */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-6">
            <AlertTriangle size={20} className="text-zinc-400" strokeWidth={1.5} />
            <h3 className="text-lg font-medium text-zinc-900">Aree da Migliorare</h3>
          </div>
          <div style={{ transform: "translateZ(40px)" }} className="p-6 rounded-xl bg-zinc-50 border border-zinc-100 text-left">
            <p className="text-zinc-600 text-sm font-light leading-relaxed">Nessuna area debole. Ottimo lavoro!</p>
          </div>
        </PremiumCard>

        {/* History */}
        <PremiumCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-6">
            <History size={20} className="text-zinc-400" strokeWidth={1.5} />
            <h3 className="text-lg font-medium text-zinc-900">Storico Esami</h3>
          </div>
          <div style={{ transform: "translateZ(40px)" }} className="p-6 rounded-xl bg-zinc-50 border border-zinc-100 text-left">
            <p className="text-zinc-600 text-sm font-light leading-relaxed">Nessun esame completato di recente.</p>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}


