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

// Order updated to include NOTES and ARTEFATOS
const navItems: NavItem[] = [
  { id: View.HOME, label: 'HOME', icon: Home },
  { id: View.TOOLS, label: 'FERRAMENTA', icon: Wrench },
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
        relative flex flex-col h-full bg-workspace-main border-r border-workspace-border transition-all duration-300 ease-out z-20
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* Header / Logo Area */}
      <div className="flex items-center justify-between px-6 h-20 border-b border-workspace-border">
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
          <div className="flex items-center justify-center w-8 h-8 bg-workspace-accent/10 rounded-md">
            <Hexagon className="w-4 h-4 text-workspace-text stroke-[1.5]" />
          </div>
          <span className="font-medium text-sm tracking-[0.2em] text-workspace-text whitespace-nowrap">WORKSPACE</span>
        </div>
        {!isOpen && (
           <div className="w-full flex justify-center">
             <Hexagon className="w-5 h-5 text-workspace-muted stroke-[1.5]" />
           </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`
                flex items-center w-full px-3 py-2.5 rounded-md transition-all duration-200 group relative focus:outline-none
                ${isActive 
                  ? 'bg-workspace-accent text-white shadow-sm' 
                  : 'text-workspace-muted hover:bg-workspace-accent-hover hover:text-workspace-text'
                }
                ${isOpen ? 'justify-start' : 'justify-center'}
              `}
            >
              <item.icon 
                className={`
                  w-4 h-4 stroke-[1.5] transition-colors
                  ${isActive ? 'text-white' : 'text-workspace-muted group-hover:text-workspace-text'}
                `} 
              />
              
              <span 
                className={`
                  ml-3 text-xs font-medium tracking-wider transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                `}
              >
                {item.label}
              </span>

              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-14 px-3 py-1.5 bg-workspace-surface border border-workspace-border text-workspace-text text-[10px] tracking-wide rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions: Theme Toggle & Collapse */}
      <div className="p-4 border-t border-workspace-border flex flex-col gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            flex items-center justify-center w-full p-2 rounded-md text-workspace-muted hover:bg-workspace-accent-hover hover:text-workspace-text transition-colors focus:outline-none
            ${!isOpen && 'aspect-square'}
          `}
          title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 stroke-[1.5]" />
          ) : (
            <Moon className="w-4 h-4 stroke-[1.5]" />
          )}
          
          {isOpen && (
            <span className="ml-3 text-xs font-medium">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 rounded-md text-workspace-muted hover:bg-workspace-accent-hover hover:text-workspace-text transition-colors focus:outline-none"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4 stroke-[1.5]" /> : <ChevronRight className="w-4 h-4 stroke-[1.5]" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;