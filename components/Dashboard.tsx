import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, Users, TrendingUp } from 'lucide-react';
import { ChartDataPoint } from '../types';

const data: ChartDataPoint[] = [
  { name: 'SEG', value: 4000 },
  { name: 'TER', value: 3000 },
  { name: 'QUA', value: 2000 },
  { name: 'QUI', value: 2780 },
  { name: 'SEX', value: 1890 },
  { name: 'SAB', value: 2390 },
  { name: 'DOM', value: 3490 },
];

const StatCard: React.FC<{ title: string; value: string; icon: any; change: string }> = ({ title, value, icon: Icon, change }) => (
  <div className="bg-[#0a0c10] border border-[#30403E]/40 p-5 rounded-lg hover:border-[#30403E]/80 transition-colors duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-1.5 rounded-md text-gray-500 group-hover:text-gray-300 transition-colors">
        <Icon className="w-5 h-5 stroke-[1.5]" />
      </div>
      <span className="text-[10px] font-medium text-[#4d6663] border border-[#30403E]/30 px-2 py-0.5 rounded-full">
        {change}
      </span>
    </div>
    <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-xl font-light text-gray-200 tracking-tight">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="p-10 space-y-10 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-light text-gray-100 tracking-tight">Painel de Controle</h1>
        <p className="text-sm text-gray-500 font-light">Visão geral e métricas de desempenho.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Atividade" value="89%" icon={Activity} change="+12%" />
        <StatCard title="Foco" value="06:24" icon={Clock} change="+5%" />
        <StatCard title="Equipe" value="24" icon={Users} change="+2" />
        <StatCard title="Performance" value="9.8" icon={TrendingUp} change="+0.4" />
      </div>

      {/* Chart Section */}
      <div className="bg-[#0a0c10] border border-[#30403E]/40 rounded-lg p-6 h-96">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Produtividade Semanal</h2>
           <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-[#30403E]"></div>
             <span className="text-xs text-gray-500">Métrica Principal</span>
           </div>
        </div>
        
        <div className="h-full pb-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#30403E" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#30403E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30403E" vertical={false} opacity={0.2} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'Inter' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'Inter' }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000208', borderColor: '#30403E', borderRadius: '4px', fontSize: '12px' }}
                itemStyle={{ color: '#d1d5db' }}
                cursor={{ stroke: '#30403E', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#4d6663" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;