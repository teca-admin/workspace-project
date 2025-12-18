import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  ExternalLink, 
  ArrowLeft, 
  Globe, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Pencil, 
  Trash2, 
  Save,
  Folder,
  FolderPlus,
  CornerUpLeft,
  Move,
  ChevronRight,
  Home
} from 'lucide-react';
import { Tool } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Mapeamentos e Helpers ---

const toSupabase = (tool: Partial<Tool>) => ({
  titulo: tool.title,
  descricao: tool.description,
  url: tool.url,
  icone: tool.icon,
  categoria: tool.category,
  parent_id: tool.parentId,
  is_folder: tool.isFolder
});

const toFrontend = (data: any): Tool => ({
  id: data.id,
  title: data.titulo || '',
  description: data.descricao || '',
  url: data.url || '',
  icon: data.icone || '',
  category: data.categoria || '',
  parentId: data.parent_id,
  isFolder: data.is_folder || false,
  createdAt: data.criado_em ? new Date(data.criado_em) : undefined,
  updatedAt: data.atualizado_em ? new Date(data.atualizado_em) : undefined,
});

const formatError = (error: any) => {
  return error?.message || JSON.stringify(error);
};

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0); 
  const [showWarning, setShowWarning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', description: '', isFolder: false });
  const [toolToMove, setToolToMove] = useState<Tool | null>(null);

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('ferramentas').select('*');
      if (error) throw error;
      if (data) setTools(data.map(toFrontend));
    } catch (e) {
      console.error('[SUPABASE] Erro:', formatError(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTools(); }, []);

  const getFavicon = (url: string) => {
    if (!url) return '';
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return ''; }
  };

  const handleOpenModal = (tool?: Tool, createFolder: boolean = false) => {
    if (tool) {
      setEditingToolId(tool.id);
      setFormData({ title: tool.title, url: tool.url, description: tool.description, isFolder: !!tool.isFolder });
    } else {
      setEditingToolId(null);
      setFormData({ title: '', url: '', description: '', isFolder: createFolder });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return;
    const toolData = { title: formData.title, url: formData.url, description: formData.description, isFolder: formData.isFolder, parentId: currentFolderId };
    setIsModalOpen(false);
    if (editingToolId) {
      await supabase.from('ferramentas').update(toSupabase(toolData)).eq('id', editingToolId);
    } else {
      await supabase.from('ferramentas').insert([toSupabase(toolData)]);
    }
    fetchTools();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir?')) return;
    await supabase.from('ferramentas').delete().eq('id', id);
    fetchTools();
  };

  const visibleTools = tools.filter(t => t.parentId === currentFolderId);
  visibleTools.sort((a, b) => (a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1));

  if (activeTool) {
    return (
      <div className="flex flex-col h-full bg-workspace-main animate-fade-in relative">
        <div className="h-14 border-b border-workspace-border flex items-center justify-between px-6 bg-workspace-surface shrink-0 z-20">
          <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-workspace-accent-hover rounded-full"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-3"><h2 className="text-sm font-medium">{activeTool.title}</h2></div>
          <a href={activeTool.url} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 border border-workspace-border rounded-md hover:bg-workspace-accent-hover">Abrir no Navegador</a>
        </div>
        <iframe key={iframeKey} src={activeTool.url} className="w-full h-full border-none bg-white" title={activeTool.title} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-fade-in relative">
      <div className="mb-6 flex justify-between items-end">
        <div><h1 className="text-2xl font-light mb-2">Ferramentas Integradas</h1><p className="text-sm text-workspace-muted">Gerencie seus utilitários externos.</p></div>
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal(undefined, true)} className="px-4 py-2 border border-workspace-border rounded-md text-xs font-medium hover:bg-workspace-accent-hover flex items-center gap-2"><FolderPlus className="w-4 h-4" /> NOVA PASTA</button>
          <button onClick={() => handleOpenModal(undefined, false)} className="px-4 py-2 bg-workspace-accent text-white rounded-md text-xs font-medium hover:opacity-90 flex items-center gap-2"><Plus className="w-4 h-4" /> NOVA FERRAMENTA</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleTools.map((tool) => (
            <div 
              key={tool.id} 
              onClick={() => tool.isFolder ? setCurrentFolderId(tool.id) : setActiveTool(tool)} 
              className="group relative bg-workspace-surface border rounded-lg p-5 cursor-pointer transition-all duration-300 flex items-start gap-4 select-none border-l-4 border-l-workspace-accent border-workspace-border hover:bg-workspace-accent-hover"
            >
              <div className="w-10 h-10 rounded-lg border border-workspace-border flex items-center justify-center shrink-0 transition-colors bg-workspace-surface group-hover:bg-workspace-surface/50 shadow-none">
                {tool.isFolder ? (
                  <Folder className="w-5 h-5 text-workspace-accent fill-workspace-accent/5" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <img src={getFavicon(tool.url)} alt="" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity z-10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <Globe className="w-4 h-4 text-workspace-accent absolute opacity-20" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 pr-14"> 
                <h3 className="text-sm font-bold truncate mb-1">{tool.title}</h3>
                <p className="text-[10px] text-workspace-muted line-clamp-2 leading-relaxed font-medium uppercase tracking-tighter opacity-70">
                  {tool.isFolder ? `${tools.filter(t => t.parentId === tool.id).length} itens` : (tool.description || "Sem descrição.")}
                </p>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(tool); }} className="p-1.5 text-workspace-muted hover:text-workspace-text hover:bg-workspace-main rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(tool.id); }} className="p-1.5 text-workspace-muted hover:text-red-500 hover:bg-workspace-main rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-workspace-surface w-full max-w-md border border-workspace-border rounded-lg p-6 relative m-4 border-l-4 border-l-workspace-accent">
            <h2 className="text-lg font-light mb-6 uppercase tracking-widest">{editingToolId ? 'Editar' : 'Novo'}</h2>
            <div className="space-y-4">
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-workspace-accent" placeholder="Título" />
              {!formData.isFolder && <input type="text" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-workspace-accent" placeholder="URL" />}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium">CANCELAR</button>
              <button onClick={handleSave} className="px-6 py-2 bg-workspace-accent text-white text-xs font-medium rounded-md hover:opacity-90">SALVAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;