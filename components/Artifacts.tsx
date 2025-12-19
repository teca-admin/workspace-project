import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Folder, FileCode, FileText, Plus, Search, Box, Layers, 
  Trash2, Copy, Check, Pencil, Download, Upload, Loader2, File, X, Info,
  StickyNote
} from 'lucide-react';
import { Artifact, ArtifactCollection } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Mapeamento de Colunas (De/Para) conforme Manual ---

const toSupabaseCol = (col: Partial<ArtifactCollection>) => ({ 
  nome: col.name, 
  icone: col.icon 
});

const toFrontendCol = (data: any): ArtifactCollection => ({ 
  id: data.id, 
  name: data.nome, 
  icon: data.icone,
  updatedAt: data.atualizado_em ? new Date(data.atualizado_em) : undefined
});

/**
 * Mapeia o artefato do frontend para o banco de dados.
 * NOTA: A coluna 'descricao' foi removida do payload para evitar erros 42703.
 * Se você criar a coluna 'descricao' (tipo text) no Supabase, pode reativá-la aqui.
 */
const toSupabaseArt = (art: any, isUpdate: boolean) => {
  const payload: any = {
    colecao_id: art.collectionId,
    titulo: art.title,
    tipo: art.type,
    icone: art.icon,
    cor: art.color,
    // descricao: art.description // Desativado para evitar erro de coluna inexistente
  };

  if (!isUpdate) {
    payload.conteudo = art.content || '';
  } else if (art.content !== undefined && art.content !== '') {
    payload.conteudo = art.content;
  }
  
  return payload;
};

const toFrontendArt = (data: any): Artifact => ({ 
  id: data.id, 
  collectionId: data.colecao_id, 
  title: data.titulo, 
  content: data.conteudo || '', 
  description: data.descricao || '', // Se a coluna não existir no SELECT, virá como undefined/vazio
  type: data.tipo, 
  createdAt: new Date(data.criado_em), 
  updatedAt: data.atualizado_em ? new Date(data.atualizado_em) : undefined,
  icon: data.icone, 
  color: data.cor 
});

const formatError = (error: any) => {
  if (typeof error === 'string') return error;
  return error?.message || error?.details || JSON.stringify(error);
};

const ICON_MAP: Record<string, React.ElementType> = {
  'folder': Folder, 'box': Box, 'layers': Layers, 'code': FileCode, 'file': FileText, 'word': FileText, 'pdf': FileText, 'excel': FileText, 'powerpoint': FileText
};

const COLOR_OPTIONS = [
  { id: 'default', text: 'text-workspace-muted' },
  { id: 'blue', text: 'text-blue-500' },
  { id: 'emerald', text: 'text-emerald-500' },
  { id: 'amber', text: 'text-amber-500' },
  { id: 'red', text: 'text-red-500' }
];

const isDocumentType = (type: string) => ['pdf', 'word', 'excel', 'powerpoint'].includes(type);

const getFileType = (file: File): Artifact['type'] => {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('word') || mime.includes('officedocument.wordprocessingml') || name.endsWith('.doc') || name.endsWith('.docx')) return 'word';
  if (mime.includes('excel') || mime.includes('officedocument.spreadsheetml') || name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return 'excel';
  if (mime.includes('powerpoint') || mime.includes('presentationml') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'powerpoint';
  
  return 'text';
};

const Artifacts: React.FC = () => {
  const [collections, setCollections] = useState<ArtifactCollection[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColIcon, setNewColIcon] = useState('folder');

  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [artifactForm, setArtifactForm] = useState({ 
    title: '', 
    content: '', 
    description: '', 
    type: 'text' as Artifact['type'], 
    icon: 'file' 
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: colData, error: colError } = await supabase.from('colecoes').select('id, nome, icone, criado_em, atualizado_em');
      if (colError) throw colError;
      
      const { data: artData, error: artError } = await supabase.from('artefatos').select('id, colecao_id, titulo, tipo, criado_em, atualizado_em, icone, cor');
      if (artError) throw artError;
      
      if (colData) setCollections(colData.map(toFrontendCol));
      if (artData) setArtifacts(artData.map(toFrontendArt));
    } catch (e) {
      console.error('[SUPABASE] ❌ Erro ao buscar:', formatError(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeCollection = useMemo(() => collections.find(c => c.id === selectedCollectionId), [collections, selectedCollectionId]);
  const activeArtifact = useMemo(() => artifacts.find(a => a.id === selectedArtifactId), [artifacts, selectedArtifactId]);

  useEffect(() => {
    const loadArtifactContent = async () => {
      if (!selectedArtifactId || !activeArtifact) return;
      if (activeArtifact.content || selectedArtifactId.startsWith('temp-')) return;
      
      setIsContentLoading(true);
      try {
        const { data, error } = await supabase.from('artefatos').select('conteudo').eq('id', selectedArtifactId).single();
        if (data && !error) {
          setArtifacts(prev => prev.map(a => a.id === selectedArtifactId ? { ...a, content: data.conteudo } : a));
        }
      } catch (e) {
        console.error('Erro ao carregar conteúdo:', e);
      } finally {
        setIsContentLoading(false);
      }
    };
    loadArtifactContent();
  }, [selectedArtifactId]);

  const filteredArtifacts = useMemo(() => artifacts.filter(a => 
    a.collectionId === selectedCollectionId && a.title.toLowerCase().includes(searchQuery.toLowerCase())
  ), [artifacts, selectedCollectionId, searchQuery]);

  const getIcon = (name: string) => ICON_MAP[name] || File;

  const saveCollection = async () => {
    if (!newColName.trim()) return;
    const colData: Partial<ArtifactCollection> = { name: newColName, icon: newColIcon };
    setIsSyncing(true);
    setIsCollectionModalOpen(false);
    try {
      if (editingCollectionId) {
        await supabase.from('colecoes').update(toSupabaseCol(colData)).eq('id', editingCollectionId);
      } else {
        await supabase.from('colecoes').insert([toSupabaseCol(colData)]);
      }
      fetchData();
    } catch (e) {
      console.error('Erro ao salvar coleção:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteCollection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir permanentemente esta coleção e todos os seus artefatos?')) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('colecoes').delete().eq('id', id);
      if (error) throw error;
      
      setCollections(prev => prev.filter(c => c.id !== id));
      if (selectedCollectionId === id) {
        setSelectedCollectionId(null);
        setSelectedArtifactId(null);
      }
    } catch (e) {
      console.error('Erro ao excluir coleção:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveArtifact = async () => {
    if (!artifactForm.title.trim() || !selectedCollectionId) return;
    const tempId = `temp-${Date.now()}`;
    const artData = { ...artifactForm, collectionId: selectedCollectionId };
    const originalArtifacts = [...artifacts];
    const isUpdate = !!editingArtifactId;
    setIsSyncing(true);
    setIsArtifactModalOpen(false);

    if (isUpdate) {
      setArtifacts(prev => prev.map(a => a.id === editingArtifactId ? { ...a, ...artData } as Artifact : a));
    } else {
      setArtifacts(prev => [...prev, { ...artData, id: tempId, createdAt: new Date() } as Artifact]);
    }

    try {
      const payload = toSupabaseArt(artData, isUpdate);
      if (isUpdate) {
        const { error } = await supabase.from('artefatos').update(payload).eq('id', editingArtifactId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('artefatos').insert([payload]).select().single();
        if (error) throw error;
        if (data) {
          const realArt = toFrontendArt(data);
          setArtifacts(prev => prev.map(a => a.id === tempId ? realArt : a));
          if (selectedArtifactId === tempId) setSelectedArtifactId(realArt.id);
        }
      }
    } catch (e) {
      setArtifacts(originalArtifacts);
      const msg = formatError(e);
      console.error('[SUPABASE] ❌ Erro ao salvar:', msg);
      alert(`Erro ao salvar artefato: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteArtifact = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente este artefato?')) return;
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (selectedArtifactId === id) setSelectedArtifactId(null);
    await supabase.from('artefatos').delete().eq('id', id);
  };

  const handleCopy = () => {
    if (activeArtifact && activeArtifact.content) {
      navigator.clipboard.writeText(activeArtifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!activeArtifact || !activeArtifact.content) return;
    const link = document.createElement('a');
    link.href = activeArtifact.content;
    link.download = activeArtifact.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCollectionModal = (col?: ArtifactCollection) => {
    setEditingCollectionId(col?.id || null);
    setNewColName(col?.name || '');
    setNewColIcon(col?.icon || 'folder');
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (e: React.MouseEvent, col: ArtifactCollection) => {
    e.stopPropagation();
    openCollectionModal(col);
  };

  const openArtifactModal = (art?: Artifact) => {
    if (!selectedCollectionId && !art) return;
    setEditingArtifactId(art?.id || null);
    setArtifactForm({ 
      title: art?.title || '', 
      content: art?.content || '', 
      description: art?.description || '', 
      type: art?.type || 'text', 
      icon: art?.icon || 'file' 
    });
    setIsArtifactModalOpen(true);
  };

  return (
    <div className="flex h-full w-full bg-workspace-main overflow-hidden border-t border-workspace-border">
      {/* Coluna 1: Coleções (24%) */}
      <div className="w-[24%] border-r border-workspace-border flex flex-col shrink-0 bg-workspace-main">
        <div className="h-12 flex items-center justify-between px-3 border-b border-workspace-border shrink-0">
          <span className="text-[10px] font-bold text-workspace-muted uppercase tracking-widest flex items-center gap-2">
            {(isLoading || isSyncing) && <Loader2 className="w-2.5 h-2.5 animate-spin text-workspace-accent" />} Coleções
          </span>
          <button onClick={() => openCollectionModal()} className="p-1 hover:bg-workspace-surface rounded text-workspace-muted transition-colors"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {collections.map(col => {
            const Icon = getIcon(col.icon);
            return (
              <div 
                key={col.id} 
                onClick={() => { setSelectedCollectionId(col.id); setSelectedArtifactId(null); }}
                className={`group flex items-center gap-3 px-3 py-2.5 cursor-pointer border-l-2 transition-all relative ${selectedCollectionId === col.id ? 'bg-workspace-surface border-workspace-accent' : 'border-transparent hover:bg-workspace-surface/50'}`}
              >
                <div className={`p-1 rounded transition-colors ${selectedCollectionId === col.id ? 'bg-workspace-accent text-white' : 'bg-workspace-main border border-workspace-border/30 text-workspace-muted'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-semibold truncate flex-1 transition-colors ${selectedCollectionId === col.id ? 'text-workspace-text' : 'text-workspace-text/70'}`}>
                  {col.name}
                </span>
                
                {/* Botões de Ação (Editar/Excluir) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleEditCollection(e, col)}
                    className="p-1 hover:bg-workspace-main rounded text-workspace-muted hover:text-workspace-accent transition-colors"
                    title="Editar Coleção"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => deleteCollection(e, col.id)}
                    className="p-1 hover:bg-red-500/10 rounded text-workspace-muted hover:text-red-500 transition-colors"
                    title="Excluir Coleção"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coluna 2: Lista (24%) */}
      <div className="w-[24%] border-r border-workspace-border flex flex-col shrink-0 bg-workspace-surface/10">
        <div className="h-12 flex items-center px-3 border-b border-workspace-border shrink-0">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-workspace-muted" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-workspace-surface border border-workspace-border rounded pl-7 pr-2 py-1.5 text-[10px] focus:outline-none focus:border-workspace-accent"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="h-8 flex items-center justify-between px-3 border-b border-workspace-border sticky top-0 bg-workspace-main z-10">
            <span className="text-[9px] font-black uppercase tracking-widest text-workspace-muted pr-2">
              {activeCollection?.name || 'Selecione uma coleção'}
            </span>
            <button 
              disabled={!selectedCollectionId}
              onClick={() => openArtifactModal()} 
              className={`text-[9px] font-bold uppercase flex items-center gap-1 transition-all ${selectedCollectionId ? 'text-workspace-accent hover:opacity-70' : 'text-workspace-muted cursor-not-allowed opacity-40'}`}
              title={!selectedCollectionId ? 'Selecione uma coleção primeiro' : 'Novo Artefato'}
            >
              <Plus className="w-2.5 h-2.5" /> Novo
            </button>
          </div>
          <div className="divide-y divide-workspace-border/20">
            {filteredArtifacts.map(art => {
              const Icon = getIcon(art.icon || 'file');
              return (
                <button 
                  key={art.id} 
                  onClick={() => setSelectedArtifactId(art.id)}
                  className={`w-full p-3 text-left transition-colors flex flex-col gap-1 border-l-2 ${selectedArtifactId === art.id ? 'bg-workspace-surface border-workspace-accent' : 'border-transparent hover:bg-workspace-surface/40'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded bg-workspace-main border border-workspace-border/20 shrink-0">
                      <Icon className={`w-3 h-3 text-workspace-muted`} />
                    </div>
                    <span className="text-[11px] font-bold truncate leading-none flex-1">{art.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coluna 3: Detalhes (52%) */}
      <div className="flex-1 flex flex-col bg-workspace-main min-w-0 overflow-hidden relative border-l border-workspace-border/50">
        {activeArtifact ? (
          <>
            <div className="h-12 border-b border-workspace-border flex items-center justify-between px-6 shrink-0 z-10 bg-workspace-main/80 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                <div className="p-1.5 bg-workspace-main border border-workspace-border/30 rounded shrink-0 shadow-sm">
                  {(() => { 
                    const Icon = getIcon(activeArtifact.icon || 'file'); 
                    return <Icon className={`w-3.5 h-3.5 text-workspace-accent`} />; 
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xs font-bold text-workspace-text truncate leading-tight">{activeArtifact.title}</h1>
                  <span className="text-[8px] text-workspace-muted uppercase font-black tracking-widest opacity-60">{activeArtifact.type} • {activeArtifact.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-4">
                {(isContentLoading || isSyncing) && <Loader2 className="w-3.5 h-3.5 animate-spin text-workspace-accent mr-2" />}
                {isDocumentType(activeArtifact.type) ? (
                  <button onClick={handleDownload} className="px-3 py-1 bg-workspace-accent text-white rounded text-[9px] font-black uppercase flex items-center gap-1.5 hover:opacity-90"><Download className="w-2.5 h-2.5" /> Baixar</button>
                ) : (
                  <button onClick={handleCopy} className="p-1.5 border border-workspace-border rounded hover:bg-workspace-surface transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-workspace-muted" />}
                  </button>
                )}
                <button onClick={() => openArtifactModal(activeArtifact)} className="p-1.5 hover:bg-workspace-surface text-workspace-muted rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteArtifact(activeArtifact.id)} className="p-1.5 hover:bg-red-500/10 text-workspace-muted hover:text-red-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-workspace-main relative">
              <div className="max-w-3xl space-y-8">
                {activeArtifact.description && (
                  <div className="p-5 bg-amber-500/5 border-l-4 border-amber-500/50 rounded-r-xl shadow-sm animate-fade-in-quick">
                    <div className="flex items-center gap-2 mb-2.5 text-amber-600 dark:text-amber-500">
                      <StickyNote className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Notas & Observações</span>
                    </div>
                    <p className="text-xs text-workspace-text/90 leading-relaxed font-medium italic">{activeArtifact.description}</p>
                  </div>
                )}
                {isDocumentType(activeArtifact.type) ? (
                  <div className="flex flex-col gap-6 animate-fade-in-quick">
                    <div className="flex items-center gap-4 p-6 bg-workspace-surface border border-workspace-border border-l-4 border-l-workspace-accent rounded-xl shadow-sm">
                      <div className="w-12 h-12 bg-workspace-main border border-workspace-border/30 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        {(() => { 
                          const Icon = getIcon(activeArtifact.icon || 'file'); 
                          return <Icon className={`w-6 h-6 text-workspace-accent`} />; 
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold truncate mb-1.5 text-workspace-text">{activeArtifact.title}</h3>
                        <span className="text-[9px] uppercase tracking-widest text-workspace-muted font-bold opacity-70">Formato: {activeArtifact.type} | {activeArtifact.createdAt.toLocaleDateString()}</span>
                      </div>
                      <button onClick={handleDownload} className="p-2.5 bg-workspace-main border border-workspace-border text-workspace-muted hover:text-workspace-text hover:border-workspace-accent rounded-lg transition-all"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <div className={`text-workspace-text font-light leading-relaxed whitespace-pre-wrap selection:bg-workspace-accent/20 border-l-2 border-workspace-border/20 pl-6 ${activeArtifact.type === 'code' ? 'font-mono text-[10px] bg-workspace-surface/50 p-6 border border-workspace-border border-l-workspace-accent rounded-xl' : 'text-xs'}`}>
                    {isContentLoading ? <div className="flex items-center gap-3 py-10 text-workspace-muted justify-center border border-dashed border-workspace-border rounded-xl"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] uppercase font-black tracking-widest">Sincronizando...</span></div> : activeArtifact.content}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-workspace-muted opacity-10">
            <Box className="w-16 h-16 mb-4 stroke-[0.5]" /><p className="text-[10px] uppercase font-black tracking-[0.3em]">Ambiente de Artefatos</p>
          </div>
        )}
      </div>

      {/* Modal de Coleção */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-workspace-surface w-full max-w-sm border border-workspace-border rounded-xl shadow-2xl overflow-hidden animate-fade-in-quick">
            <div className="p-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-workspace-accent mb-6">
                {editingCollectionId ? 'Editar Coleção' : 'Nova Coleção'}
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-workspace-muted ml-1">Nome</label>
                  <input type="text" value={newColName} onChange={(e) => setNewColName(e.target.value)} className="w-full bg-workspace-main border border-workspace-border rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-workspace-accent font-semibold" placeholder="Nome da coleção..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-workspace-muted ml-1">Ícone</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(ICON_MAP).map(iconName => {
                      const Icon = ICON_MAP[iconName];
                      return (
                        <button key={iconName} onClick={() => setNewColIcon(iconName)} className={`p-3 rounded-lg border transition-all flex items-center justify-center ${newColIcon === iconName ? 'bg-workspace-accent text-white border-workspace-accent' : 'bg-workspace-main border-workspace-border text-workspace-muted hover:bg-workspace-surface'}`}>
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-workspace-main border-t border-workspace-border flex justify-end gap-2">
              <button onClick={() => setIsCollectionModalOpen(false)} className="px-4 py-2 text-[9px] font-black text-workspace-muted uppercase tracking-widest">Cancelar</button>
              <button onClick={saveCollection} className="px-6 py-2 bg-workspace-accent text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em]">
                {editingCollectionId ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Artefato */}
      {isArtifactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-workspace-surface w-full max-w-xl border border-workspace-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-quick">
            <div className="h-14 bg-workspace-main border-b border-workspace-border flex items-center justify-between px-6 shrink-0">
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-workspace-accent">Gerenciar Artefato</h2>
               <button onClick={() => setIsArtifactModalOpen(false)} className="p-1 hover:bg-workspace-surface rounded-md text-workspace-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-workspace-muted ml-1">Título do Artefato</label>
                <input disabled={isSyncing} type="text" value={artifactForm.title} onChange={(e) => setArtifactForm({...artifactForm, title: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-workspace-accent font-semibold" placeholder="Nomeie seu artefato..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-workspace-muted ml-1">Fonte do Conteúdo</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setArtifactForm({...artifactForm, type: 'text'})} className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${artifactForm.type === 'text' ? 'bg-workspace-accent text-white border-workspace-accent' : 'bg-workspace-main border-workspace-border text-workspace-muted'}`}><FileText className="w-4 h-4" /><span className="text-[9px] font-black tracking-widest uppercase">TEXTO</span></button>
                  <button onClick={() => setArtifactForm({...artifactForm, type: 'code'})} className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${artifactForm.type === 'code' ? 'bg-workspace-accent text-white border-workspace-accent' : 'bg-workspace-main border-workspace-border text-workspace-muted'}`}><FileCode className="w-4 h-4" /><span className="text-[9px] font-black tracking-widest uppercase">CÓDIGO</span></button>
                  <button onClick={() => fileInputRef.current?.click()} className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${isDocumentType(artifactForm.type) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-workspace-main border-workspace-border text-workspace-muted'}`}><Upload className="w-4 h-4" /><span className="text-[9px] font-black tracking-widest uppercase">{isDocumentType(artifactForm.type) ? 'ANEXO OK' : 'ANEXAR'}</span></button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-workspace-muted ml-1">{isDocumentType(artifactForm.type) ? 'Arquivo Anexado' : 'Corpo do Artefato'}</label>
                {isDocumentType(artifactForm.type) ? (
                  <div className="bg-workspace-main border border-workspace-border rounded-lg p-6 flex flex-col items-center justify-center text-center animate-fade-in-quick">
                    <div className="w-16 h-16 bg-workspace-surface border border-workspace-border rounded-2xl flex items-center justify-center mb-4 text-emerald-500 shadow-sm">
                       {(() => { const Icon = getIcon(artifactForm.icon); return <Icon className="w-8 h-8" />; })()}
                    </div>
                    <p className="text-xs font-bold text-workspace-text mb-1 truncate max-w-xs">{artifactForm.title}</p>
                    <p className="text-[9px] text-workspace-muted uppercase font-black tracking-widest opacity-60 mb-4">Documento {artifactForm.type} Detectado</p>
                    <div className="flex gap-2">
                       <button onClick={() => setArtifactForm({...artifactForm, type: 'text', content: '', icon: 'file'})} className="px-4 py-2 border border-workspace-border rounded-md text-[8px] font-black uppercase text-red-500 hover:bg-red-500/5">Remover Anexo</button>
                       <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-workspace-surface border border-workspace-border rounded-md text-[8px] font-black uppercase text-workspace-muted hover:text-workspace-text">Alterar Arquivo</button>
                    </div>
                  </div>
                ) : (
                  <textarea disabled={isSyncing} value={artifactForm.content} onChange={(e) => setArtifactForm({...artifactForm, content: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-lg px-4 py-4 text-xs min-h-[140px] resize-none focus:outline-none focus:border-workspace-accent font-light leading-relaxed custom-scrollbar shadow-inner" placeholder="Escreva ou cole o conteúdo principal aqui..." />
                )}
              </div>

              <div className="space-y-1.5 border-t border-workspace-border pt-4">
                <label className="text-[8px] font-black uppercase tracking-widest text-workspace-muted ml-1 flex items-center gap-2"><StickyNote className="w-3 h-3 text-amber-500" /> Notas & Observações</label>
                <textarea disabled={isSyncing} value={artifactForm.description} onChange={(e) => setArtifactForm({...artifactForm, description: e.target.value})} className="w-full bg-amber-500/5 border border-workspace-border border-dashed rounded-lg px-4 py-3 text-xs min-h-[80px] resize-none focus:outline-none focus:border-amber-500 font-light italic text-workspace-text placeholder:text-workspace-muted/40" placeholder="Adicione orientações contextuais..." />
              </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={(e) => { 
                const f = e.target.files?.[0]; 
                if(f) { 
                    const r = new FileReader(); 
                    r.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        const detectedType = getFileType(f);
                        setArtifactForm({ ...artifactForm, title: f.name, content: base64, type: detectedType, icon: detectedType === 'text' ? 'file' : detectedType });
                    };
                    r.readAsDataURL(f); 
                } 
            }} className="hidden" />

            <div className="p-6 bg-workspace-main border-t border-workspace-border flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsArtifactModalOpen(false)} className="px-6 py-2.5 text-[9px] font-black text-workspace-muted uppercase tracking-widest">Cancelar</button>
              <button disabled={isSyncing} onClick={saveArtifact} className="px-8 py-2.5 bg-workspace-accent text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-workspace-accent/10 transition-all flex items-center gap-3">
                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Artifacts;