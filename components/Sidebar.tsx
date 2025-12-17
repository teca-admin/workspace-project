import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Library, 
  Wrench, 
  ChevronLeft, 
  ChevronRight, 
  Hexagon,
  Moon,
  Sun,
  StickyNote
} from 'lucide-react';
import { View, NavItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const navItems: NavItem[] = [
  { id: View.HOME, label: 'INÍCIO', icon: Home },
  { id: View.TOOLS, label: 'FERRAMENTAS', icon: Wrench },
  { id: View.NOTES, label: 'NOTAS', icon: StickyNote },
  { id: View.ARTIFACTS, label: 'ARTEFATOS', icon: Library },
  { id: View.PROJECTS, label: 'PROJETOS', icon: Briefcase },
  { id: View.DEMANDS, label: 'DEMANDAS', icon: CheckSquare },
  { id: View.DASHBOARD, label: 'PAINEL', icon: LayoutDashboard },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  currentView, 
  setCurrentView,
  isDarkMode,
  toggleTheme 
}) => {
  return (
    <aside 
      className={`
        relative flex flex-col h-full bg-workspace-main border-r border-workspace-border transition-all duration-300 ease-in-out z-20
        ${isOpen ? 'w-64' : 'w-[70px]'}
      `}
    >
      {/* Header / Logo Area */}
      <div className="flex items-center px-5 h-14 mb-4 mt-2">
        <div className={`flex items-center gap-3 transition-opacity duration-300 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
          <div className="flex items-center justify-center w-8 h-8 bg-workspace-text text-workspace-main rounded-lg">
            <Hexagon className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-workspace-text whitespace-nowrap">WORKSPACE</span>
        </div>
        {!isOpen && (
           <div className="w-full flex justify-center">
             <Hexagon className="w-6 h-6 text-workspace-text stroke-[1.5]" />
           </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`
                flex items-center w-full px-3 py-2 rounded-md transition-all duration-200 group relative focus:outline-none
                ${isActive 
                  ? 'bg-workspace-accent text-workspace-text shadow-sm ring-1 ring-white/5' 
                  : 'text-workspace-muted hover:bg-workspace-surface hover:text-workspace-text'
                }
                ${isOpen ? 'justify-start' : 'justify-center'}
              `}
            >
              <item.icon 
                className={`
                  w-4 h-4 stroke-[1.5] transition-colors shrink-0
                  ${isActive ? 'text-workspace-text' : 'text-workspace-muted group-hover:text-workspace-text'}
                `} 
              />
              
              {isOpen && (
                <span className="ml-3 text-xs font-medium tracking-wide whitespace-nowrap animate-fade-in">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-12 ml-2 px-2 py-1 bg-workspace-text text-workspace-main text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl translate-x-1">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-workspace-border flex flex-col gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            flex items-center justify-center w-full p-2 rounded-md text-workspace-muted hover:bg-workspace-surface hover:text-workspace-text transition-colors focus:outline-none
            ${!isOpen && 'aspect-square'}
          `}
          title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 stroke-[1.5]" />
          ) : (
            <Moon className="w-4 h-4 stroke-[1.5]" />
          )}
          
          {isOpen && (
            <span className="ml-3 text-xs font-medium">
              {isDarkMode ? 'Claro' : 'Escuro'}
            </span>
          )}
        </button>

        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 rounded-md text-workspace-muted hover:bg-workspace-surface hover:text-workspace-text transition-colors focus:outline-none"
        >
          {isOpen ? (
             <>
               <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
               <span className="ml-3 text-xs font-medium">Ocultar</span>
             </>
          ) : <ChevronRight className="w-4 h-4 stroke-[1.5]" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;