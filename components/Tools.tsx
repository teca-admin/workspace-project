import React, { useState } from 'react';
import { Plus, ExternalLink, ArrowLeft, Globe, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Tool } from '../types';

// Mock initial data based on the concept
const initialTools: Tool[] = [
  {
    id: '1',
    title: 'Tratamento de Dados',
    description: 'Processamento massivo de planilhas e análise de inconsistências.',
    url: 'https://tratamento-de-dados-odwb92uhy-corpteca-s-projects.vercel.app/', 
    category: 'Processos'
  },
  {
    id: '2',
    title: 'Google Sheets',
    description: 'Planilhas colaborativas para controle de demandas.',
    url: 'https://docs.google.com/spreadsheets',
    category: 'Produtividade'
  },
  {
    id: '3',
    title: 'Figma Design',
    description: 'Ferramenta de design de interface e prototipagem.',
    url: 'https://www.figma.com',
    category: 'Design'
  }
];

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [newToolUrl, setNewToolUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // To force reload
  const [showWarning, setShowWarning] = useState(true);

  // Simulate "Reading" the link
  const handleAddTool = () => {
    if (!newToolUrl.trim()) return;

    setLoadingPreview(true);

    // Simulate API delay for scraping
    setTimeout(() => {
      let formattedUrl = newToolUrl;
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      let domain = '';
      try {
        const urlObj = new URL(formattedUrl);
        domain = urlObj.hostname;
      } catch (e) {
        domain = 'link-externo';
      }

      const newTool: Tool = {
        id: Date.now().toString(),
        title: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        description: `Integração externa com ${domain}`,
        url: formattedUrl,
        category: 'Geral'
      };

      setTools([...tools, newTool]);
      setNewToolUrl('');
      setLoadingPreview(false);
    }, 1500);
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return '';
    }
  };

  const reloadIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  // View: Active Tool (Embedded)
  if (activeTool) {
    return (
      <div className="flex flex-col h-full bg-[#000208] animate-fade-in relative">
        {/* Tool Header */}
        <div className="h-14 border-b border-[#30403E]/30 flex items-center justify-between px-6 bg-[#0a0c10] shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTool(null)}
              className="p-2 hover:bg-[#30403E]/30 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
            </button>
            <div className="flex items-center gap-3">
              <img 
                src={getFavicon(activeTool.url)} 
                alt="icon" 
                className="w-5 h-5 rounded-sm opacity-80"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = ''; 
                  (e.target as HTMLImageElement).style.display = 'none';
                }} 
              />
              <h2 className="text-sm font-medium text-gray-200 tracking-wide">{activeTool.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={reloadIframe}
              className="p-2 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-[#30403E]/20"
              title="Recarregar ferramenta"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-[#30403E]/40 mx-1" />
            <a 
              href={activeTool.url} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-gray-400 hover:text-white flex items-center gap-2 transition-colors px-3 py-1.5 border border-[#30403E]/30 rounded-md hover:bg-[#30403E]/20 bg-[#0a0c10]"
            >
              <span>Abrir no Navegador</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Warning Banner for X-Frame-Options */}
        {showWarning && (
          <div className="bg-[#1a1d24] border-b border-[#30403E]/30 px-6 py-2 flex items-center justify-between z-10 animate-fade-in">
             <div className="flex items-center gap-2 text-[10px] text-gray-400">
               <AlertCircle className="w-3 h-3 text-amber-500/80" />
               <span>
                 Nota: Alguns sites bloqueiam visualização interna por segurança (erro "conexão recusada"). Se isso ocorrer, use o botão "Abrir no Navegador".
               </span>
             </div>
             <button onClick={() => setShowWarning(false)} className="text-gray-500 hover:text-white">
               <X className="w-3 h-3" />
             </button>
          </div>
        )}

        {/* Iframe Container */}
        <div className="flex-1 bg-[#12141a] relative w-full h-full overflow-hidden">
             {/* Background Loader/Placeholder */}
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 z-0">
                <Globe className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-xs font-light opacity-40">Carregando interface remota...</p>
             </div>

             <iframe 
               key={iframeKey}
               src={activeTool.url} 
               className="w-full h-full border-none relative z-10 bg-white" 
               title={activeTool.title}
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
               referrerPolicy="no-referrer"
               sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
             />
        </div>
      </div>
    );
  }

  // View: Tool Grid
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-fade-in">
      
      {/* Header & Registration Area */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-100 tracking-tight mb-6">Ferramentas Integradas</h1>
        
        {/* Add Tool Input */}
        <div className="bg-[#0a0c10] border border-[#30403E]/40 p-1 rounded-lg max-w-2xl flex items-center shadow-lg shadow-black/20 focus-within:border-[#30403E] transition-colors group">
            <div className="p-3 text-gray-500 group-focus-within:text-[#30403E] transition-colors">
                {loadingPreview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </div>
            <input 
                type="text" 
                placeholder="Cole o link da ferramenta para adicionar (ex: https://app.vercel.com)..."
                className="flex-1 bg-transparent border-none outline-none text-gray-200 text-sm placeholder-gray-600 h-10 px-2"
                value={newToolUrl}
                onChange={(e) => setNewToolUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTool()}
            />
            <button 
                onClick={handleAddTool}
                disabled={!newToolUrl.trim() || loadingPreview}
                className="px-6 py-2 bg-[#30403E] hover:bg-[#4d6663] text-white text-xs font-medium tracking-wide rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loadingPreview ? 'LENDO...' : 'ADICIONAR'}
            </button>
        </div>
      </div>

      {/* Categories / Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
                <div 
                    key={tool.id}
                    onClick={() => setActiveTool(tool)}
                    className="group relative bg-[#0a0c10] border border-[#30403E]/30 rounded-lg p-5 cursor-pointer hover:border-[#30403E] hover:bg-[#30403E]/10 transition-all duration-300 flex items-start gap-4 shadow-sm hover:shadow-md"
                >
                    {/* Icon / Preview */}
                    <div className="w-12 h-12 rounded-lg bg-[#30403E]/10 border border-[#30403E]/20 flex items-center justify-center shrink-0 group-hover:bg-[#30403E]/20 transition-colors">
                         <img 
                            src={getFavicon(tool.url)} 
                            alt="" 
                            className="w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                         />
                         <Globe className="w-5 h-5 text-gray-600 absolute -z-10" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-gray-200 truncate pr-2 group-hover:text-white transition-colors">{tool.title}</h3>
                            <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2 font-light">
                            {tool.description}
                        </p>
                        <span className="inline-block px-2 py-0.5 bg-[#30403E]/10 border border-[#30403E]/20 rounded text-[10px] text-gray-400">
                            {tool.category || 'Geral'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;