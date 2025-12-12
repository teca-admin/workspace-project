import React from 'react';
import { ArrowRight, Briefcase, Zap, Wrench } from 'lucide-react';
import { View } from '../types';

interface HomeProps {
  setCurrentView: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ setCurrentView }) => {
  const currentTime = new Date();
  const hours = currentTime.getHours();
  let greeting = 'Bom dia';
  if (hours >= 12 && hours < 18) greeting = 'Boa tarde';
  else if (hours >= 18) greeting = 'Boa noite';

  return (
    <div className="p-12 max-w-5xl mx-auto h-full flex flex-col justify-center animate-fade-in">
      
      {/* Hero Section */}
      <div className="mb-16">
        <h1 className="text-4xl font-light text-workspace-text mb-2 tracking-tight">{greeting}, Usuário.</h1>
        <p className="text-workspace-muted font-light text-lg">Seu workspace está pronto. O que vamos construir hoje?</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Ferramentas */}
        <button 
          onClick={() => setCurrentView(View.TOOLS)}
          className="group flex flex-col items-start p-6 bg-workspace-surface border border-workspace-border rounded-lg hover:border-workspace-accent hover:bg-workspace-accent-hover transition-all duration-300 shadow-sm"
        >
          <div className="p-3 bg-workspace-accent/10 rounded-md mb-4 group-hover:bg-workspace-accent/20 transition-colors">
            <Wrench className="w-6 h-6 text-workspace-text stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-workspace-text uppercase tracking-wider mb-2">Ferramentas</h3>
          <p className="text-xs text-workspace-muted font-light leading-relaxed mb-4 text-left">
            Acesse rapidamente suas ferramentas integradas e utilitários.
          </p>
          <div className="mt-auto flex items-center text-xs text-workspace-accent group-hover:text-workspace-text transition-colors font-medium">
            Acessar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 2 */}
        <button 
          onClick={() => setCurrentView(View.PROJECTS)}
          className="group flex flex-col items-start p-6 bg-workspace-surface border border-workspace-border rounded-lg hover:border-workspace-accent hover:bg-workspace-accent-hover transition-all duration-300 shadow-sm"
        >
          <div className="p-3 bg-workspace-accent/10 rounded-md mb-4 group-hover:bg-workspace-accent/20 transition-colors">
            <Briefcase className="w-6 h-6 text-workspace-text stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-workspace-text uppercase tracking-wider mb-2">Projetos Ativos</h3>
          <p className="text-xs text-workspace-muted font-light leading-relaxed mb-4 text-left">
            Gerencie seus projetos em andamento e verifique o status.
          </p>
          <div className="mt-auto flex items-center text-xs text-workspace-accent group-hover:text-workspace-text transition-colors font-medium">
            Ver Projetos <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 3 */}
        <button 
          onClick={() => setCurrentView(View.DASHBOARD)}
          className="group flex flex-col items-start p-6 bg-workspace-surface border border-workspace-border rounded-lg hover:border-workspace-accent hover:bg-workspace-accent-hover transition-all duration-300 shadow-sm"
        >
          <div className="p-3 bg-workspace-accent/10 rounded-md mb-4 group-hover:bg-workspace-accent/20 transition-colors">
            <Zap className="w-6 h-6 text-workspace-text stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-workspace-text uppercase tracking-wider mb-2">Painel</h3>
          <p className="text-xs text-workspace-muted font-light leading-relaxed mb-4 text-left">
            Visualize métricas e indicadores de desempenho.
          </p>
          <div className="mt-auto flex items-center text-xs text-workspace-accent group-hover:text-workspace-text transition-colors font-medium">
            Visualizar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Status Strip */}
      <div className="mt-16 border-t border-workspace-border pt-8 flex items-center justify-between text-xs text-workspace-muted font-light">
         <span>V 1.0.1</span>
         <span>SISTEMA OPERACIONAL: ONLINE</span>
      </div>
    </div>
  );
};

export default Home;