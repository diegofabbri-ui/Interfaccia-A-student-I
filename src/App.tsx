import React, { useState } from 'react';
import { BookOpen, Users, History, GraduationCap } from 'lucide-react';
import DevelopExamView from './components/DevelopExamView';
import ProfessorsView from './components/ProfessorsView';
import ExamHistoryView from './components/ExamHistoryView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'develop' | 'professors' | 'history'>('develop');

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      {/* Top Navigation - Z-Space Layering */}
      <header className="glass-panel sticky top-0 z-50 shadow-elevation-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-brand-primary p-2 rounded-widget text-text-on-brand shadow-elevation-card">
                <GraduationCap size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">A-Studenti-I</span>
            </div>
            
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('develop')}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'develop' 
                    ? 'bg-brand-secondary text-brand-primary shadow-elevation-pressed' 
                    : 'text-text-secondary hover:bg-surface-interactive hover:text-text-primary'
                }`}
              >
                <BookOpen size={18} />
                <span className="hidden sm:inline">Sviluppo Esami</span>
              </button>
              
              <button
                onClick={() => setActiveTab('professors')}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'professors' 
                    ? 'bg-brand-secondary text-brand-primary shadow-elevation-pressed' 
                    : 'text-text-secondary hover:bg-surface-interactive hover:text-text-primary'
                }`}
              >
                <Users size={18} />
                <span className="hidden sm:inline">Professori</span>
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'history' 
                    ? 'bg-brand-secondary text-brand-primary shadow-elevation-pressed' 
                    : 'text-text-secondary hover:bg-surface-interactive hover:text-text-primary'
                }`}
              >
                <History size={18} />
                <span className="hidden sm:inline">Cronologia Esami</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'develop' && <DevelopExamView />}
        {activeTab === 'professors' && <ProfessorsView />}
        {activeTab === 'history' && <ExamHistoryView />}
      </main>
    </div>
  );
}
