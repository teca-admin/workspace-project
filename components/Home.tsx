import React from 'react';
import { ArrowRight, MessageSquare, Briefcase, Zap } from 'lucide-react';
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
        <h1 className="text-4xl font-light text-white mb-2 tracking-tight">{greeting}, Usuário.</h1>
        <p className="text-gray-500 font-light text-lg">Seu workspace está pronto. O que vamos construir hoje?</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <button 
          onClick={() => setCurrentView(View.CHAT)}
          className="group flex flex-col items-start p-6 bg-[#0a0c10] border border-[#30403E]/40 rounded-lg hover:border-[#30403E] hover:bg-[#30403E]/10 transition-all duration-300"
        >
          <div className="p-3 bg-[#30403E]/20 rounded-md mb-4 group-hover:bg-[#30403E]/30 transition-colors">
            <MessageSquare className="w-6 h-6 text-gray-300 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider mb-2">Assistente IA</h3>
          <p className="text-xs text-gray-500 font-light leading-relaxed mb-4 text-left">
            Inicie uma nova conversa ou continue suas tarefas com o Gemini.
          </p>
          <div className="mt-auto flex items-center text-xs text-[#4d6663] group-hover:text-white transition-colors">
            Acessar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 2 */}
        <button 
          onClick={() => setCurrentView(View.PROJECTS)}
          className="group flex flex-col items-start p-6 bg-[#0a0c10] border border-[#30403E]/40 rounded-lg hover:border-[#30403E] hover:bg-[#30403E]/10 transition-all duration-300"
        >
          <div className="p-3 bg-[#30403E]/20 rounded-md mb-4 group-hover:bg-[#30403E]/30 transition-colors">
            <Briefcase className="w-6 h-6 text-gray-300 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider mb-2">Projetos Ativos</h3>
          <p className="text-xs text-gray-500 font-light leading-relaxed mb-4 text-left">
            Gerencie seus projetos em andamento e verifique o status.
          </p>
          <div className="mt-auto flex items-center text-xs text-[#4d6663] group-hover:text-white transition-colors">
            Ver Projetos <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 3 */}
        <button 
          onClick={() => setCurrentView(View.TOOLS)}
          className="group flex flex-col items-start p-6 bg-[#0a0c10] border border-[#30403E]/40 rounded-lg hover:border-[#30403E] hover:bg-[#30403E]/10 transition-all duration-300"
        >
          <div className="p-3 bg-[#30403E]/20 rounded-md mb-4 group-hover:bg-[#30403E]/30 transition-colors">
            <Zap className="w-6 h-6 text-gray-300 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider mb-2">Ações Rápidas</h3>
          <p className="text-xs text-gray-500 font-light leading-relaxed mb-4 text-left">
            Acesse ferramentas e utilitários do sistema rapidamente.
          </p>
          <div className="mt-auto flex items-center text-xs text-[#4d6663] group-hover:text-white transition-colors">
            Explorar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Status Strip */}
      <div className="mt-16 border-t border-[#30403E]/20 pt-8 flex items-center justify-between text-xs text-gray-600 font-light">
         <span>V 1.0.0</span>
         <span>SISTEMA OPERACIONAL: ONLINE</span>
      </div>
    </div>
  );
};

export default Home;