import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Home from './components/Home';
import Tools from './components/Tools';
import { View } from './types';
import { Briefcase, CheckSquare, Library } from 'lucide-react';

const PlaceholderView: React.FC<{ title: string; subtitle: string; icon: any }> = ({ title, subtitle, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-600 animate-fade-in">
    <div className="p-4 border border-[#30403E]/30 rounded-lg mb-6 bg-[#0a0c10]">
      <Icon size={32} className="text-[#30403E] stroke-[1]" />
    </div>
    <h2 className="text-lg font-light text-gray-300 tracking-wide mb-2 uppercase">{title}</h2>
    <p className="text-xs font-light tracking-wider opacity-60">{subtitle}</p>
  </div>
);

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  
  const renderContent = () => {
    switch (currentView) {
      case View.HOME:
        return <Home setCurrentView={setCurrentView} />;
      case View.TOOLS:
        return <Tools />;
      case View.PROJECTS:
        return <PlaceholderView title="Projetos" subtitle="Gerenciamento de projetos em breve" icon={Briefcase} />;
      case View.DEMANDS:
        return <PlaceholderView title="Demandas" subtitle="Lista de tarefas não disponível" icon={CheckSquare} />;
      case View.LIBRARY:
        return <PlaceholderView title="Biblioteca" subtitle="Repositório de arquivos vazio" icon={Library} />;
      case View.DASHBOARD:
        return <Dashboard />;
      default:
        return <Home setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#000208] text-gray-300 selection:bg-[#30403E] selection:text-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-[#000208]">
        {/* Top Header Strip - Ultra Minimal */}
        <header className="h-14 border-b border-[#30403E]/20 flex items-center justify-between px-8 bg-[#000208] z-10 shrink-0">
          <div className="flex items-center gap-2 text-gray-600 text-xs tracking-widest font-medium uppercase">
             <span>Workspace</span>
             <span className="text-[#30403E]">/</span>
             <span className="text-gray-400">{currentView}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#0a0c10] border border-[#30403E]/30 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-900/80 animate-pulse border border-emerald-700" />
                <span className="text-[10px] text-gray-500 font-medium tracking-wider">ONLINE</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth p-0 bg-[#000208]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;