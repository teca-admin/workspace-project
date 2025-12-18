import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Home from './components/Home';
import Tools from './components/Tools';
import Notes from './components/Notes';
import Artifacts from './components/Artifacts';
import { View } from './types';
import { Briefcase, CheckSquare } from 'lucide-react';

const PlaceholderView: React.FC<{ title: string; subtitle: string; icon: any }> = ({ title, subtitle, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-full text-workspace-muted animate-fade-in-quick">
    <div className="p-4 border border-workspace-border rounded-lg mb-6 bg-workspace-surface">
      <Icon size={32} className="text-workspace-accent stroke-[1]" />
    </div>
    <h2 className="text-lg font-light text-workspace-text tracking-wide mb-2 uppercase">{title}</h2>
    <p className="text-xs font-light tracking-wider opacity-60">{subtitle}</p>
  </div>
);

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Theme Toggle Effect
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const renderContent = () => {
    switch (currentView) {
      case View.HOME:
        return <Home setCurrentView={setCurrentView} />;
      case View.TOOLS:
        return <Tools />;
      case View.NOTES:
        return <Notes />;
      case View.ARTIFACTS:
        return <Artifacts />;
      case View.PROJECTS:
        return <PlaceholderView title="Projetos" subtitle="Gerenciamento de projetos em breve" icon={Briefcase} />;
      case View.DEMANDS:
        return <PlaceholderView title="Demandas" subtitle="Lista de tarefas não disponível" icon={CheckSquare} />;
      case View.DASHBOARD:
        return <Dashboard />;
      default:
        return <Home setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace-main text-workspace-text selection:bg-workspace-accent selection:text-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-workspace-main">
        {/* Top Header Strip - Ultra Minimal */}
        <header className="h-14 border-b border-workspace-border flex items-center justify-between px-8 bg-workspace-main z-10 shrink-0">
          <div className="flex items-center gap-2 text-workspace-muted text-xs tracking-widest font-medium uppercase">
             <span>Workspace</span>
             <span className="text-workspace-accent">/</span>
             <span className="text-workspace-text/60">{currentView === 'ARTIFACTS' ? 'ARTEFATOS' : currentView}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-workspace-surface border border-workspace-border rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-[10px] text-workspace-muted font-medium tracking-wider uppercase">Online</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-workspace-main">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;