import React, { useState, useEffect } from 'react';
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

// --- Mapeamento de Colunas (De/Para) ---

// Frontend -> Supabase
const toSupabase = (tool: Partial<Tool>) => {
  return {
    titulo: tool.title,
    descricao: tool.description,
    url: tool.url,
    icone: tool.icon,
    categoria: tool.category,
    parent_id: tool.parentId,
    is_folder: tool.isFolder
  };
};

// Supabase -> Frontend
const toFrontend = (data: any): Tool => ({
  id: data.id,
  title: data.titulo,
  description: data.descricao || '',
  url: data.url || '',
  icon: data.icone,
  category: data.categoria,
  parentId: data.parent_id,
  isFolder: data.is_folder || false,
  createdAt: data.criado_em ? new Date(data.criado_em) : undefined,
  updatedAt: data.atualizado_em ? new Date(data.atualizado_em) : undefined
});

// Helper para formatar erro
const formatError = (error: any) => {
  return error?.message || JSON.stringify(error);
};

// Helper para alertar erros de schema amigavelmente
const alertError = (error: any, operation: string) => {
  const msg = formatError(error);
  console.error(`[SUPABASE] ❌ Erro ao ${operation}:`, msg);
  
  if (
    msg.includes("Could not find the") || 
    msg.includes("has no attribute") || 
    msg.includes("does not exist")
  ) {
    let missingCol = "colunas necessárias";
    if (msg.includes("atualizado_em")) missingCol = "'atualizado_em'";
    if (msg.includes("is_folder")) missingCol = "'is_folder'";
    
    alert(`⚠️ Erro de Banco de Dados (Schema)\n\nO Supabase reportou que a tabela 'ferramentas' não possui a coluna ${missingCol}.\n\nIsso geralmente acontece quando o script de migração não foi executado ou a tabela está incompleta.\n\nSOLUÇÃO: Execute o arquivo 'supabase_fix.sql' no Editor SQL do Supabase para corrigir a estrutura da tabela.`);
  } else {
    alert(`Erro ao ${operation}: ${msg}`);
  }
};

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0); 
  const [showWarning, setShowWarning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  
  // Estados de Edição/Criação
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', description: '', isFolder: false });
  
  // Estado para Mover
  const [toolToMove, setToolToMove] = useState<Tool | null>(null);

  // Drag and Drop State
  const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const canSave = formData.title && (formData.isFolder || formData.url);

  // --- Handlers de Interação (Teclado) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          handleCloseModal();
        } else if (isMoveModalOpen) {
          setIsMoveModalOpen(false);
        } else if (activeTool) {
          setActiveTool(null);
        }
      }
      
      // Atalho Ctrl+Enter ou Cmd+Enter para salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isModalOpen && canSave) {
          e.preventDefault();
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isMoveModalOpen, activeTool, formData]);

  // --- READ (Buscar dados) ---
  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('ferramentas').select('*');
      if (error) throw error;
      
      if (data) {
        setTools(data.map(toFrontend));
        console.log('[SUPABASE] ✅ Dados sincronizados');
      }
    } catch (e) {
      console.error('[SUPABASE] ❌ Erro ao buscar:', formatError(e));
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

  // --- Navegação de Pastas ---
  const getBreadcrumbs = () => {
    const path = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = tools.find(t => t.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId || null;
      } else {
        break;
      }
    }
    return path;
  };

  // --- CRUD Actions (Optimistic UI) ---
  const handleOpenModal = (tool?: Tool, createFolder: boolean = false) => {
    if (tool) {
      setEditingToolId(tool.id);
      setFormData({ 
        title: tool.title, 
        url: tool.url, 
        description: tool.description,
        isFolder: !!tool.isFolder
      });
    } else {
      setEditingToolId(null);
      setFormData({ 
        title: '', 
        url: '', 
        description: '', 
        isFolder: createFolder 
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingToolId(null);
    setFormData({ title: '', url: '', description: '', isFolder: false });
  };

  const handleDelete = async (id: string) => {
    const itemRemovido = tools.find(item => item.id === id);
    const filhosRemovidos = tools.filter(item => item.parentId === id);
    setTools(prev => prev.filter(t => t.id !== id && t.parentId !== id)); 
    if (id.startsWith('temp-')) return;
    try {
      const { error } = await supabase.from('ferramentas').delete().eq('id', id);
      if (error) throw error;
      console.log('[SUPABASE] ✅ Item removido');
    } catch (error) {
      setTools(prev => [...prev, itemRemovido!, ...filhosRemovidos]);
      alertError(error, 'excluir');
    }
  };

  const handleSave = async () => {
    if (!formData.title) return;
    if (!formData.isFolder && !formData.url) return;

    let formattedUrl = formData.url;
    if (!formData.isFolder) {
        try {
            if (formattedUrl && !formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;
            if (formattedUrl) new URL(formattedUrl);
        } catch (e) {
            alert("URL inválida.");
            return;
        }
    }

    const toolData: Partial<Tool> = {
      title: formData.title,
      url: formattedUrl,
      description: formData.description,
      category: formData.isFolder ? 'Folder' : 'Geral',
      isFolder: formData.isFolder,
      parentId: currentFolderId
    };

    if (editingToolId) {
      setTools(prev => prev.map(t => t.id === editingToolId ? { ...t, ...toolData } : t));
      handleCloseModal();
      try {
         const { error } = await supabase.from('ferramentas').update(toSupabase(toolData)).eq('id', editingToolId);
         if (error) throw error;
         console.log('[SUPABASE] ✅ Item atualizado');
      } catch (error) {
         fetchTools();
         alertError(error, 'atualizar');
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimisticTool: Tool = {
          id: tempId,
          ...toolData
      } as Tool;
      setTools(prev => [optimisticTool, ...prev]);
      handleCloseModal();
      try {
        const { data, error } = await supabase
            .from('ferramentas')
            .insert(toSupabase(toolData))
            .select()
            .single();
        if (error) throw error;
        setTools(prev => prev.map(t => t.id === tempId ? toFrontend(data) : t));
        console.log('[SUPABASE] ✅ Item adicionado');
      } catch (error) {
        setTools(prev => prev.filter(t => t.id !== tempId));
        alertError(error, 'adicionar');
      }
    }
  };

  const moveTool = async (toolId: string, targetFolderId: string | null) => {
      const previousTools = [...tools];
      setTools(prev => prev.map(t => t.id === toolId ? { ...t, parentId: targetFolderId } : t));
      try {
          const { error } = await supabase
            .from('ferramentas')
            .update({ parent_id: targetFolderId })
            .eq('id', toolId);
          if (error) throw error;
          console.log('[SUPABASE] ✅ Item movido');
      } catch (err) {
          setTools(previousTools);
          alertError(err, 'mover');
      }
  };

  const handleDragStart = (e: React.DragEvent, toolId: string) => {
      setDraggedToolId(toolId);
      e.dataTransfer.setData("toolId", toolId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      if (draggedToolId !== folderId) {
          setDragOverFolderId(folderId);
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
      e.preventDefault();
      setDragOverFolderId(null);
      const toolId = e.dataTransfer.getData("toolId");
      if (toolId && toolId !== targetFolderId) {
          await moveTool(toolId, targetFolderId);
      }
      setDraggedToolId(null);
  };

  const openMoveModal = (tool: Tool) => {
      setToolToMove(tool);
      setIsMoveModalOpen(true);
  };

  const handleMoveConfirm = (targetFolderId: string | null) => {
      if (toolToMove) {
          moveTool(toolToMove.id, targetFolderId);
          setIsMoveModalOpen(false);
          setToolToMove(null);
      }
  };

  const visibleTools = tools.filter(t => t.parentId === currentFolderId);
  visibleTools.sort((a, b) => (a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1));

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
              <h2 className="text-sm font-medium text-workspace-text tracking-wide">{activeTool.title}</h2>
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
             <iframe key={iframeKey} src={activeTool.url} className="w-full h-full border-none relative z-10 bg-white" title={activeTool.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="no-referrer" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-fade-in relative">
      <div className="mb-6">
        <div className="flex items-end justify-between mb-4">
            <div>
            <h1 className="text-2xl font-light text-workspace-text tracking-tight mb-2">Ferramentas Integradas</h1>
            <p className="text-sm text-workspace-muted font-light">Gerencie e acesse seus utilitários externos.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => handleOpenModal(undefined, true)} className="flex items-center gap-2 px-4 py-2 bg-workspace-surface border border-workspace-border hover:bg-workspace-accent-hover text-workspace-text text-xs font-medium tracking-wide rounded-md transition-all">
                    <FolderPlus className="w-4 h-4" /> NOVA PASTA
                </button>
                <button onClick={() => handleOpenModal(undefined, false)} className="flex items-center gap-2 px-4 py-2 bg-workspace-accent hover:opacity-90 text-white text-xs font-medium tracking-wide rounded-md transition-all">
                    <Plus className="w-4 h-4" /> NOVA FERRAMENTA
                </button>
            </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-workspace-muted bg-workspace-surface/50 p-2 rounded-md">
            <button 
                onClick={() => setCurrentFolderId(null)} 
                className={`p-1 rounded hover:bg-workspace-surface hover:text-workspace-text flex items-center gap-1 transition-colors ${!currentFolderId ? 'text-workspace-text font-medium' : ''}`}
            >
                <Home className="w-3.5 h-3.5" /> Início
            </button>
            {getBreadcrumbs().map((folder, index) => (
                <React.Fragment key={folder.id}>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    <button 
                        onClick={() => setCurrentFolderId(folder.id)} 
                        className={`p-1 rounded hover:bg-workspace-surface hover:text-workspace-text transition-colors ${index === getBreadcrumbs().length - 1 ? 'text-workspace-text font-medium' : ''}`}
                    >
                        {folder.title}
                    </button>
                </React.Fragment>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {isLoading && tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-workspace-muted"><Loader2 className="w-6 h-6 animate-spin mb-2" /><p className="text-xs">Sincronizando...</p></div>
        ) : visibleTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-workspace-muted opacity-60">
             <div className="relative">
                <Globe className="w-12 h-12 mb-4 stroke-[1]" />
                {currentFolderId && <Folder className="w-6 h-6 absolute -bottom-1 -right-1 text-workspace-accent" />}
             </div>
             <p className="font-light">Pasta vazia.</p>
             <p className="text-xs mt-2">Arraste itens para cá ou crie novos.</p>
             {currentFolderId && (
                 <button onClick={() => setCurrentFolderId(null)} className="mt-4 flex items-center gap-2 text-xs hover:underline">
                     <CornerUpLeft className="w-3 h-3" /> Voltar para o Início
                 </button>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTools.map((tool) => (
                  <div 
                    key={tool.id} 
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, tool.id)}
                    onDragOver={(e) => tool.isFolder ? handleDragOver(e, tool.id) : undefined}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => tool.isFolder ? handleDrop(e, tool.id) : undefined}
                    onClick={() => tool.isFolder ? setCurrentFolderId(tool.id) : setActiveTool(tool)} 
                    className={`
                        group relative bg-workspace-surface border rounded-lg p-5 cursor-pointer transition-all duration-300 flex items-start gap-4 select-none
                        ${dragOverFolderId === tool.id ? 'border-workspace-accent ring-2 ring-workspace-accent/20 bg-workspace-accent/5' : 'border-workspace-border hover:border-workspace-accent hover:bg-workspace-accent-hover'}
                    `}
                  >
                      <div className={`w-10 h-10 rounded-lg border border-workspace-border flex items-center justify-center shrink-0 transition-colors ${tool.isFolder ? 'bg-workspace-surface text-workspace-accent' : 'bg-workspace-main group-hover:bg-workspace-accent-hover'}`}>
                          {tool.isFolder ? (
                              <Folder className="w-5 h-5 fill-workspace-accent/10" />
                          ) : (
                              <>
                                <img src={getFavicon(tool.url)} alt="" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <Globe className="w-4 h-4 text-workspace-muted absolute -z-10" />
                              </>
                          )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-14"> 
                          <h3 className="text-sm font-medium text-workspace-text truncate mb-1">{tool.title}</h3>
                          <p className="text-xs text-workspace-muted line-clamp-2 leading-relaxed font-light">
                              {tool.isFolder 
                                ? `${tools.filter(t => t.parentId === tool.id).length} itens` 
                                : (tool.description || "Sem descrição.")}
                          </p>
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openMoveModal(tool); }} 
                            className="p-1.5 text-workspace-muted hover:text-workspace-text hover:bg-workspace-main rounded-md transition-colors" 
                            title="Mover"
                          >
                              <Move className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(tool); }} 
                            className="p-1.5 text-workspace-muted hover:text-workspace-text hover:bg-workspace-main rounded-md transition-colors" 
                            title="Editar"
                          >
                              <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(tool.id); }} 
                            className="p-1.5 text-workspace-muted hover:text-red-500 hover:bg-workspace-main rounded-md transition-colors" 
                            title="Excluir"
                          >
                              <Trash2 className="w-3.5 h-3.5" />
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
              {editingToolId ? <Pencil className="w-5 h-5" /> : (formData.isFolder ? <FolderPlus className="w-5 h-5" /> : <Plus className="w-5 h-5" />)} 
              {editingToolId ? 'Editar' : (formData.isFolder ? 'Nova Pasta' : 'Nova Ferramenta')}
            </h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Título</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors" placeholder="Ex: Financeiro" autoFocus /></div>
              {!formData.isFolder && (
                  <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Link (URL)</label><input type="text" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors" placeholder="Ex: https://google.com" /></div>
              )}
              <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Descrição (Opcional)</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors h-24 resize-none" placeholder="Detalhes..." /></div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-4 py-2 text-xs font-medium text-workspace-text hover:bg-workspace-main rounded-md transition-colors">CANCELAR</button>
              <button onClick={handleSave} disabled={!canSave} className="px-6 py-2 bg-workspace-accent hover:opacity-90 text-white text-xs font-medium tracking-wide rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" title="Ctrl+Enter para salvar"><Save className="w-3 h-3" /> SALVAR</button>
            </div>
          </div>
        </div>
      )}

      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-workspace-surface w-full max-w-sm border border-workspace-border rounded-lg shadow-2xl p-6 relative m-4">
                <button onClick={() => setIsMoveModalOpen(false)} className="absolute top-4 right-4 text-workspace-muted hover:text-workspace-text transition-colors"><X className="w-5 h-5" /></button>
                <h2 className="text-lg font-light text-workspace-text mb-4 flex items-center gap-2">
                    <Move className="w-5 h-5" /> Mover "{toolToMove?.title}" para...
                </h2>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar my-4">
                    <button 
                        onClick={() => handleMoveConfirm(null)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-workspace-main transition-colors text-sm ${!toolToMove?.parentId ? 'text-workspace-accent font-medium bg-workspace-accent/5' : 'text-workspace-text'}`}
                    >
                        <Home className="w-4 h-4" /> Início (Workspace)
                    </button>
                    {tools
                        .filter(t => t.isFolder && t.id !== toolToMove?.id)
                        .map(folder => (
                        <button 
                            key={folder.id}
                            onClick={() => handleMoveConfirm(folder.id)}
                            className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-workspace-main transition-colors text-sm ${toolToMove?.parentId === folder.id ? 'text-workspace-accent font-medium bg-workspace-accent/5' : 'text-workspace-text'}`}
                        >
                            <Folder className="w-4 h-4 text-workspace-muted" /> {folder.title}
                        </button>
                    ))}
                </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Tools;