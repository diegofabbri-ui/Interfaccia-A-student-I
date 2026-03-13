import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Users, History, GraduationCap, TrendingUp } from 'lucide-react';
import DevelopExamView from './components/DevelopExamView';
import ProfessorsView from './components/ProfessorsView';
import ExamHistoryView from './components/ExamHistoryView';
import ProgressDashboard from './components/ProgressDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<'develop' | 'professors' | 'history' | 'progress'>('develop');

  const navItems = [
    { id: 'develop', label: 'Sviluppo Esami', icon: BookOpen },
    { id: 'professors', label: 'Professori', icon: Users },
    { id: 'history', label: 'Cronologia Esami', icon: History },
    { id: 'progress', label: 'I Tuoi Progressi', icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      {/* Top Navigation - Z-Space Layering */}
      <header className="glass-panel sticky top-0 z-50 shadow-elevation-base bg-white/50 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-brand-primary p-2 rounded-widget text-text-on-brand shadow-elevation-card">
                <GraduationCap size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">A-Studenti-I</span>
            </div>
            
            <nav className="flex gap-x-2 p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-inner">
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === item.id
                      ? 'text-brand-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white/80 backdrop-blur-2xl rounded-full shadow-lg border border-white/80"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon size={20} className="relative z-10 drop-shadow-md" />
                  <span className="relative z-10 hidden sm:inline">{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'develop' && <DevelopExamView />}
            {activeTab === 'professors' && <ProfessorsView />}
            {activeTab === 'history' && <ExamHistoryView />}
            {activeTab === 'progress' && <ProgressDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
