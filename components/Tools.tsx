import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, ArrowLeft, Globe, Loader2, AlertCircle, RefreshCw, X, Pencil, Trash2, Save } from 'lucide-react';
import { Tool } from '../types';
import { supabase } from '../lib/supabaseClient';

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [iframeKey, setIframeKey] = useState(0); 
  const [showWarning, setShowWarning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ titulo: '', url: '', descricao: '' });

  // --- Helpers Seguros ---
  const toFrontend = (data: any): Tool => ({
    id: data.id,
    titulo: data.titulo || data.title || 'Ferramenta',
    descricao: data.descricao || data.description || '',
    url: data.url || '',
    icone: data.icone,
    categoria: data.categoria
  });

  const fetchTools = async () => {
    // Prompt: Implementação de Optimistic UI com Supabase (READ/INIT)
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('ferramentas').select('*');
      if (data && Array.isArray(data)) {
        setTools(data.map(toFrontend));
      } else if (error) {
        console.error('Erro ao buscar ferramentas:', error);
      }
    } catch (e) {
      console.error('Erro inesperado:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const getFavicon = (url: string) => {
    if (!url) return '';
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

  const handleOpenModal = (tool?: Tool) => {
    if (tool) {
      setEditingToolId(tool.id);
      setFormData({ titulo: tool.titulo, url: tool.url, descricao: tool.descricao });
    } else {
      setEditingToolId(null);
      setFormData({ titulo: '', url: '', descricao: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingToolId(null);
    setFormData({ titulo: '', url: '', descricao: '' });
  };

  const handleDelete = async (id: string) => {
    // Prompt: Implementação de Optimistic UI com Supabase (DELETE)
    // Optimistic UI: Remove imediatamente da lista antes do servidor
    const previousTools = [...tools];
    setTools(tools.filter(t => t.id !== id));

    // Se for ID temporário, não chama backend
    if (id.startsWith('temp-')) return;

    try {
      const { error } = await supabase.from('ferramentas').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao excluir ferramenta. Ela pode reaparecer ao atualizar.');
      setTools(previousTools); // Rollback
    }
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.url) return;

    let formattedUrl = formData.url;
    try {
        if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;
        new URL(formattedUrl); // Validate
    } catch (e) {
        alert("URL inválida.");
        return;
    }

    const payload = {
      titulo: formData.titulo,
      url: formattedUrl,
      descricao: formData.descricao,
      categoria: 'Geral'
    };

    if (editingToolId) {
      // Prompt: Implementação de Optimistic UI com Supabase (UPDATE)
      // Atualização imediata no estado local
      const previousTools = [...tools];
      setTools(tools.map(t => t.id === editingToolId ? { ...t, ...payload } : t));
      handleCloseModal();

      const { error } = await supabase.from('ferramentas').update(payload).eq('id', editingToolId);
      if (error) { console.error(error); setTools(previousTools); }

    } else {
      // Prompt: Implementação de Optimistic UI com Supabase (CREATE)
      // Criação imediata com ID temporário
      const tempId = `temp-${Date.now()}`;
      const newTool: Tool = { id: tempId, ...payload };
      setTools([newTool, ...tools]);
      handleCloseModal();

      const { data, error } = await supabase.from('ferramentas').insert([payload]).select().single();
      if (data) {
        const realTool = toFrontend(data);
        setTools(current => current.map(t => t.id === tempId ? realTool : t));
      } else if (error) {
        console.error(error);
        setTools(current => current.filter(t => t.id !== tempId));
      }
    }
  };

  if (activeTool) {
    return (
      <div className="flex flex-col h-full bg-workspace-main animate-fade-in relative">
        <div className="h-14 border-b border-workspace-border flex items-center justify-between px-6 bg-workspace-surface shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-workspace-accent-hover rounded-full text-workspace-muted hover:text-workspace-text transition-colors">
              <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
            </button>
            <div className="flex items-center gap-3">
              <img src={getFavicon(activeTool.url)} alt="icon" className="w-5 h-5 rounded-sm opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <h2 className="text-sm font-medium text-workspace-text tracking-wide">{activeTool.titulo}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reloadIframe} className="p-2 text-workspace-muted hover:text-workspace-text transition-colors rounded-md hover:bg-workspace-accent-hover" title="Recarregar">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-workspace-border mx-1" />
            <a href={activeTool.url} target="_blank" rel="noreferrer" className="text-xs text-workspace-muted hover:text-workspace-text flex items-center gap-2 transition-colors px-3 py-1.5 border border-workspace-border rounded-md hover:bg-workspace-accent-hover bg-workspace-main">
              <span>Abrir no Navegador</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        {showWarning && (
          <div className="bg-workspace-surface border-b border-workspace-border px-6 py-2 flex items-center justify-between z-10 animate-fade-in">
             <div className="flex items-center gap-2 text-[10px] text-workspace-muted">
               <AlertCircle className="w-3 h-3 text-amber-500/80" />
               <span>Nota: Alguns sites bloqueiam visualização interna. Use "Abrir no Navegador" se necessário.</span>
             </div>
             <button onClick={() => setShowWarning(false)} className="text-workspace-muted hover:text-workspace-text"><X className="w-3 h-3" /></button>
          </div>
        )}
        <div className="flex-1 bg-workspace-main relative w-full h-full overflow-hidden">
             <div className="absolute inset-0 flex flex-col items-center justify-center text-workspace-muted z-0">
                <Globe className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-xs font-light opacity-40">Carregando interface remota...</p>
             </div>
             <iframe key={iframeKey} src={activeTool.url} className="w-full h-full border-none relative z-10 bg-white" title={activeTool.titulo} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="no-referrer" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-fade-in relative">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-workspace-text tracking-tight mb-2">Ferramentas Integradas</h1>
          <p className="text-sm text-workspace-muted font-light">Gerencie e acesse seus utilitários externos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-workspace-accent hover:opacity-90 text-white text-xs font-medium tracking-wide rounded-md transition-all">
            <Plus className="w-4 h-4" /> NOVA FERRAMENTA
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {isLoading && tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-workspace-muted"><Loader2 className="w-6 h-6 animate-spin mb-2" /><p className="text-xs">Sincronizando...</p></div>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-workspace-muted opacity-60">
             <Globe className="w-12 h-12 mb-4 stroke-[1]" />
             <p className="font-light">Nenhuma ferramenta adicionada.</p>
             <p className="text-xs mt-2">Clique em "Nova Ferramenta" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                  <div key={tool.id} onClick={() => setActiveTool(tool)} className="group relative bg-workspace-surface border border-workspace-border rounded-lg p-5 cursor-pointer hover:border-workspace-accent hover:bg-workspace-accent-hover transition-all duration-300 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-workspace-main border border-workspace-border flex items-center justify-center shrink-0 group-hover:bg-workspace-accent-hover transition-colors">
                          <img src={getFavicon(tool.url)} alt="" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <Globe className="w-4 h-4 text-workspace-muted absolute -z-10" />
                      </div>
                      <div className="flex-1 min-w-0 pr-14"> 
                          <h3 className="text-sm font-medium text-workspace-text truncate mb-1">{tool.titulo}</h3>
                          <p className="text-xs text-workspace-muted line-clamp-2 leading-relaxed font-light">{tool.descricao || "Sem descrição."}</p>
                      </div>
                      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button 
                            onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                handleOpenModal(tool); 
                            }} 
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            className="p-1.5 text-workspace-muted hover:text-workspace-text hover:bg-workspace-main rounded-md transition-colors relative z-20" 
                            title="Editar"
                            type="button"
                          >
                              <Pencil className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                          <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(tool.id);
                            }} 
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            className="p-1.5 text-workspace-muted hover:text-red-500 hover:bg-workspace-main rounded-md transition-colors relative z-20" 
                            title="Excluir"
                            type="button"
                          >
                              <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-workspace-surface w-full max-w-md border border-workspace-border rounded-lg shadow-2xl p-6 relative m-4">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-workspace-muted hover:text-workspace-text transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-light text-workspace-text mb-6 flex items-center gap-2">
              {editingToolId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {editingToolId ? 'Editar Ferramenta' : 'Nova Ferramenta'}
            </h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Título</label><input type="text" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors" placeholder="Ex: Minha Planilha" /></div>
              <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Link (URL)</label><input type="text" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors" placeholder="Ex: https://google.com" /></div>
              <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Breve Descrição</label><textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors h-24 resize-none" placeholder="Descreva o propósito desta ferramenta..." /></div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-4 py-2 text-xs font-medium text-workspace-text hover:bg-workspace-main rounded-md transition-colors">CANCELAR</button>
              <button onClick={handleSave} disabled={!formData.titulo || !formData.url} className="px-6 py-2 bg-workspace-accent hover:opacity-90 text-white text-xs font-medium tracking-wide rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Save className="w-3 h-3" /> SALVAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;