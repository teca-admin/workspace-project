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
  Hexagon 
} from 'lucide-react';
import { View, NavItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
}

// Order: HOME, FERRAMENTA, PROJETOS, DEMANDAS, BIBLIOTECA, PAINEL
const navItems: NavItem[] = [
  { id: View.HOME, label: 'HOME', icon: Home },
  { id: View.TOOLS, label: 'FERRAMENTA', icon: Wrench },
  { id: View.PROJECTS, label: 'PROJETOS', icon: Briefcase },
  { id: View.DEMANDS, label: 'DEMANDAS', icon: CheckSquare },
  { id: View.LIBRARY, label: 'BIBLIOTECA', icon: Library },
  { id: View.DASHBOARD, label: 'PAINEL', icon: LayoutDashboard },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, currentView, setCurrentView }) => {
  return (
    <aside 
      className={`
        relative flex flex-col h-full bg-[#000208] border-r border-[#30403E]/40 transition-all duration-300 ease-out
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* Header / Logo Area */}
      <div className="flex items-center justify-between px-6 h-20 border-b border-[#30403E]/10">
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
          <div className="flex items-center justify-center w-8 h-8 bg-[#30403E]/20 rounded-md border border-[#30403E]/50">
            <Hexagon className="w-4 h-4 text-gray-200 stroke-[1.5]" />
          </div>
          <span className="font-medium text-sm tracking-[0.2em] text-gray-200 whitespace-nowrap">WORKSPACE</span>
        </div>
        {!isOpen && (
           <div className="w-full flex justify-center">
             <Hexagon className="w-5 h-5 text-gray-400 stroke-[1.5]" />
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
                flex items-center w-full px-3 py-2.5 rounded-md transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-[#30403E] text-white shadow-sm ring-1 ring-[#30403E]/50' 
                  : 'text-gray-500 hover:bg-[#30403E]/20 hover:text-gray-200'
                }
                ${isOpen ? 'justify-start' : 'justify-center'}
              `}
            >
              <item.icon 
                className={`
                  w-4 h-4 stroke-[1.5] transition-colors
                  ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-200'}
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
                <div className="absolute left-14 px-3 py-1.5 bg-[#1a1c22] border border-[#30403E] text-gray-200 text-[10px] tracking-wide rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-[#30403E]/20">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 rounded-md text-gray-600 hover:bg-[#30403E]/10 hover:text-gray-300 transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4 stroke-[1.5]" /> : <ChevronRight className="w-4 h-4 stroke-[1.5]" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;