import React, { useState, useEffect } from 'react';
import { 
  Folder, FileCode, FileText, Plus, Search, ChevronRight, Box, Terminal, Layers, 
  Trash2, Copy, Check, Archive, X, Database, Cloud, Shield, Smartphone, Cpu, Globe, 
  Hash, Layout, GitBranch, Save, Sparkles, Pencil, Brain, Bot, Wand2, Target, Flag, 
  Kanban, TrendingUp, BarChart2, PieChart, Activity, Sigma, Calculator, Truck, 
  Package, Container, MapPin, ClipboardList, Factory, Plane, Ship, FileSpreadsheet, 
  Presentation, Table, Briefcase, Book, Calendar, Users, Lightbulb, Puzzle, Timer, 
  Award, Server, Monitor, Settings, Loader2 
} from 'lucide-react';
import { Artifact, ArtifactCollection } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Mapeamento de Colunas (De/Para) ---

// Frontend -> Supabase (Collections)
const toSupabaseCol = (col: Partial<ArtifactCollection>) => ({
  nome: col.name,
  descricao: col.description,
  icone: col.icon
});

// Supabase -> Frontend (Collections)
const toFrontendCol = (data: any): ArtifactCollection => ({
  id: data.id, 
  name: data.nome, 
  description: data.descricao, 
  icon: data.icone
});

// Frontend -> Supabase (Artifacts)
const toSupabaseArt = (art: Partial<Artifact>) => ({
  colecao_id: art.collectionId,
  titulo: art.title,
  conteudo: art.content,
  tipo: art.type,
  icone: art.icon,
  cor: art.color
});

// Supabase -> Frontend (Artifacts)
const toFrontendArt = (data: any): Artifact => ({
  id: data.id, 
  collectionId: data.colecao_id, 
  title: data.titulo, 
  content: data.conteudo, 
  type: data.tipo, 
  createdAt: new Date(data.criado_em), 
  icon: data.icone, 
  color: data.cor
});

// Helper para formatar erro
const formatError = (error: any) => {
  return error?.message || JSON.stringify(error);
};

// --- Configuração de Ícones Disponíveis ---
const ICON_MAP: Record<string, React.ElementType> = {
  'folder': Folder, 'box': Box, 'archive': Archive, 'layers': Layers, 'settings': Settings,
  'sparkles': Sparkles, 'brain': Brain, 'bot': Bot, 'magic': Wand2, 'cpu': Cpu, 'code': FileCode,
  'terminal': Terminal, 'database': Database, 'cloud': Cloud, 'shield': Shield, 'git': GitBranch,
  'server': Server, 'monitor': Monitor, 'web': Globe, 'mobile': Smartphone, 'target': Target,
  'kanban': Kanban, 'flag': Flag, 'calendar': Calendar, 'users': Users, 'briefcase': Briefcase,
  'trending': TrendingUp, 'chart': BarChart2, 'pie': PieChart, 'activity': Activity, 'sigma': Sigma,
  'lightbulb': Lightbulb, 'puzzle': Puzzle, 'timer': Timer, 'award': Award, 'truck': Truck,
  'plane': Plane, 'ship': Ship, 'package': Package, 'container': Container, 'factory': Factory,
  'location': MapPin, 'checklist': ClipboardList, 'excel': FileSpreadsheet, 'word': FileText,
  'ppt': Presentation, 'calc': Calculator, 'table': Table, 'book': Book,
};

const COLOR_OPTIONS = [
  { id: 'default', label: 'Padrão', bg: 'bg-workspace-border', border: 'border-workspace-border', text: 'text-workspace-muted' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
  { id: 'emerald', label: 'Verde', bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500' },
  { id: 'amber', label: 'Âmbar', bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500' },
  { id: 'red', label: 'Vermelho', bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' },
  { id: 'purple', label: 'Roxo', bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
  { id: 'pink', label: 'Rosa', bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500' },
];

const Artifacts: React.FC = () => {
  const [collections, setCollections] = useState<ArtifactCollection[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modais
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColIcon, setNewColIcon] = useState('folder');

  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [artifactForm, setArtifactForm] = useState({
    title: '', content: '', type: 'text' as 'text' | 'code' | 'spell', icon: '', color: 'default'
  });

  // --- Handlers de Interação (Teclado) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCollectionModalOpen) {
          setIsCollectionModalOpen(false);
        } else if (isArtifactModalOpen) {
          setIsArtifactModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollectionModalOpen, isArtifactModalOpen]);

  const activeCollection = collections.find(c => c.id === selectedCollectionId);
  const activeArtifact = artifacts.find(a => a.id === selectedArtifactId);
  
  const filteredArtifacts = artifacts.filter(a => 
    a.collectionId === selectedCollectionId && 
    (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     a.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- Helpers ---
  const getIconComponent = (iconName: string) => ICON_MAP[iconName] || Folder;
  const getArtifactColor = (colorId?: string) => COLOR_OPTIONS.find(c => c.id === colorId) || COLOR_OPTIONS[0];

  const handleCopy = () => {
    if (activeArtifact) {
      navigator.clipboard.writeText(activeArtifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Supabase Data Fetching ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Coleções
      const { data: colData, error: colError } = await supabase.from('colecoes').select('*');
      if (colError) throw colError;
      if (colData) {
        setCollections(colData.map(toFrontendCol));
      }

      // Fetch Artefatos
      const { data: artData, error: artError } = await supabase.from('artefatos').select('*');
      if (artError) throw artError;
      if (artData) {
        setArtifacts(artData.map(toFrontendArt));
      }
      console.log('[SUPABASE] ✅ Artefatos sincronizados');
    } catch (e) {
      console.error('[SUPABASE] ❌ Erro ao sincronizar:', formatError(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CRUD Coleções (Optimistic UI) ---
  const openCollectionModal = (collection?: ArtifactCollection) => {
    if (collection) {
      setEditingCollectionId(collection.id);
      setNewColName(collection.name);
      setNewColDesc(collection.description || '');
      setNewColIcon(collection.icon);
    } else {
      setEditingCollectionId(null);
      setNewColName('');
      setNewColDesc('');
      setNewColIcon('folder');
    }
    setIsCollectionModalOpen(true);
  };

  const handleSaveCollection = async () => {
    if (!newColName.trim()) return;
    
    const colData: Partial<ArtifactCollection> = {
      name: newColName,
      description: newColDesc,
      icon: newColIcon
    };

    if (editingCollectionId) {
        // UPDATE
        // 1. Atualizar local IMEDIATAMENTE
        setCollections(c => c.map(item => item.id === editingCollectionId ? { ...item, ...colData } as ArtifactCollection : item));
        setIsCollectionModalOpen(false);

        // 2. Enviar para Supabase
        try {
            const { error } = await supabase.from('colecoes').update(toSupabaseCol(colData)).eq('id', editingCollectionId);
            if (error) throw error;
            console.log('[SUPABASE] ✅ Coleção atualizada');
        } catch (error) {
            console.error('[SUPABASE] ❌ Erro:', formatError(error));
            fetchData(); // Revert
            alert(`Erro ao atualizar coleção: ${formatError(error)}`);
        }

    } else {
        // CREATE
        // 1. Atualizar local IMEDIATAMENTE
        const tempId = `temp-${Date.now()}`;
        const newCol = { id: tempId, ...colData } as ArtifactCollection;
        setCollections(prev => [...prev, newCol]);
        setIsCollectionModalOpen(false);

        // 2. Enviar para Supabase
        try {
            const { data, error } = await supabase.from('colecoes').insert([toSupabaseCol(colData)]).select().single();
            if (error) throw error;
            
            // 3. Substituir
            setCollections(c => c.map(item => item.id === tempId ? toFrontendCol(data) : item));
            console.log('[SUPABASE] ✅ Coleção criada');
        } catch (error) {
            console.error('[SUPABASE] ❌ Erro:', formatError(error));
            setCollections(prev => prev.filter(c => c.id !== tempId)); // Revert
            alert(`Erro ao criar coleção: ${formatError(error)}`);
        }
    }
  };

  const handleDeleteCollection = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Excluir esta coleção e todos os seus itens?")) return;

    // 1. Guardar para restaurar
    const colRemoved = collections.find(c => c.id === id);
    const artsRemoved = artifacts.filter(a => a.collectionId === id);

    // 2. Remover local IMEDIATAMENTE
    setCollections(collections.filter(c => c.id !== id));
    setArtifacts(artifacts.filter(a => a.collectionId !== id));
    if (selectedCollectionId === id) { setSelectedCollectionId(null); setSelectedArtifactId(null); }

    // 3. Enviar para Supabase
    try {
        const { error } = await supabase.from('colecoes').delete().eq('id', id);
        if (error) throw error;
        console.log('[SUPABASE] ✅ Coleção excluída');
    } catch (error) {
        console.error('[SUPABASE] ❌ Erro:', formatError(error));
        // Restore
        if (colRemoved) setCollections(prev => [...prev, colRemoved]);
        if (artsRemoved.length) setArtifacts(prev => [...prev, ...artsRemoved]);
        alert(`Erro ao excluir: ${formatError(error)}`);
    }
  };

  // --- CRUD Artefatos (Optimistic UI) ---
  const openArtifactModal = (artifact?: Artifact) => {
    if (artifact) {
      setEditingArtifactId(artifact.id);
      setArtifactForm({ title: artifact.title, content: artifact.content, type: artifact.type, icon: artifact.icon || '', color: artifact.color || 'default' });
    } else {
      setEditingArtifactId(null);
      setArtifactForm({ title: '', content: '', type: 'text', icon: '', color: 'default' });
    }
    setIsArtifactModalOpen(true);
  };

  const handleSaveArtifact = async () => {
    if (!artifactForm.title.trim() || !selectedCollectionId) return;

    const artData: Partial<Artifact> = {
      collectionId: selectedCollectionId,
      title: artifactForm.title,
      content: artifactForm.content,
      type: artifactForm.type,
      icon: artifactForm.icon,
      color: artifactForm.color
    };

    if (editingArtifactId) {
      // UPDATE
      // 1. Atualizar local
      setArtifacts(a => a.map(item => item.id === editingArtifactId ? { ...item, ...artData } as Artifact : item));
      setIsArtifactModalOpen(false);

      // 2. Enviar para Supabase
      try {
          const { error } = await supabase.from('artefatos').update(toSupabaseArt(artData)).eq('id', editingArtifactId);
          if (error) throw error;
          console.log('[SUPABASE] ✅ Artefato atualizado');
      } catch (error) {
          console.error('[SUPABASE] ❌ Erro:', formatError(error));
          fetchData(); // Revert
          alert(`Erro ao atualizar artefato: ${formatError(error)}`);
      }
    } else {
      // CREATE
      // 1. Atualizar local
      const tempId = `temp-${Date.now()}`;
      const newArtifact = {
        id: tempId,
        createdAt: new Date(),
        ...artData
      } as Artifact;

      setArtifacts(prev => [...prev, newArtifact]);
      setSelectedArtifactId(tempId);
      setIsArtifactModalOpen(false);
      
      // 2. Enviar para Supabase
      try {
          const { data, error } = await supabase.from('artefatos').insert([toSupabaseArt(artData)]).select().single();
          if (error) throw error;

          // 3. Substituir
          setArtifacts(a => a.map(item => item.id === tempId ? toFrontendArt(data) : item));
          setSelectedArtifactId(data.id);
          console.log('[SUPABASE] ✅ Artefato criado');
      } catch (error) {
          console.error('[SUPABASE] ❌ Erro:', formatError(error));
          setArtifacts(prev => prev.filter(a => a.id !== tempId)); // Revert
          if (selectedArtifactId === tempId) setSelectedArtifactId(null);
          alert(`Erro ao criar artefato: ${formatError(error)}`);
      }
    }
  };

  const handleDeleteArtifact = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // 1. Guardar para restaurar
    const itemRemoved = artifacts.find(a => a.id === id);

    // 2. Remover local
    if (selectedArtifactId === id) setSelectedArtifactId(null);
    setArtifacts(artifacts.filter(a => a.id !== id));
    
    // 3. Enviar para Supabase
    try {
        const { error } = await supabase.from('artefatos').delete().eq('id', id);
        if (error) throw error;
        console.log('[SUPABASE] ✅ Artefato excluído');
    } catch (error) {
        console.error('[SUPABASE] ❌ Erro:', formatError(error));
        if (itemRemoved) setArtifacts(prev => [...prev, itemRemoved]);
        alert(`Erro ao excluir: ${formatError(error)}`);
    }
  };

  return (
    <div className="flex h-full w-full bg-workspace-main animate-fade-in overflow-hidden relative">
      
      {/* 1. COLUNA: COLEÇÕES */}
      <div className="w-64 border-r border-workspace-border flex flex-col bg-workspace-main shrink-0">
        <div className="p-4 h-16 border-b border-workspace-border flex items-center justify-between shrink-0">
          <h2 className="text-xs font-medium text-workspace-muted uppercase tracking-widest flex items-center gap-2">
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />} <Layers className="w-4 h-4" /> Coleções
          </h2>
          <div className="flex items-center gap-1">
             {selectedCollectionId && activeCollection && (
               <>
                 <button onClick={() => openCollectionModal(activeCollection)} className="p-1 hover:bg-workspace-surface rounded text-workspace-muted hover:text-workspace-text transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                 <button onClick={() => handleDeleteCollection(selectedCollectionId)} className="p-1 hover:bg-red-500/10 rounded text-workspace-muted hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                 <div className="w-[1px] h-3 bg-workspace-border mx-1" />
               </>
             )}
             <button onClick={() => openCollectionModal()} className="p-1 hover:bg-workspace-surface rounded text-workspace-muted hover:text-workspace-text transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {collections.map(collection => {
            const Icon = getIconComponent(collection.icon);
            return (
              <div key={collection.id} onClick={() => { setSelectedCollectionId(collection.id); setSelectedArtifactId(null); }} className={`relative w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all group cursor-pointer ${selectedCollectionId === collection.id ? 'bg-workspace-surface border border-transparent shadow-sm' : 'hover:bg-workspace-surface border border-transparent'}`}>
                <div className={`p-2 rounded-md ${selectedCollectionId === collection.id ? 'bg-workspace-accent text-white' : 'bg-workspace-surface text-workspace-muted group-hover:text-workspace-text'}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <span className={`block text-sm font-medium truncate ${selectedCollectionId === collection.id ? 'text-workspace-text' : 'text-workspace-text/80'}`}>{collection.name}</span>
                  <span className="text-[10px] text-workspace-muted truncate block opacity-70">{collection.description || `${artifacts.filter(a => a.collectionId === collection.id).length} itens`}</span>
                </div>
                {selectedCollectionId === collection.id && <ChevronRight className="w-3 h-3 text-workspace-accent" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. COLUNA: LISTA DE RECURSOS */}
      {selectedCollectionId ? (
        <div className="w-72 border-r border-workspace-border flex flex-col bg-workspace-surface/30 shrink-0">
           <div className="p-4 h-16 border-b border-workspace-border flex items-center justify-between shrink-0">
             <div className="relative w-full">
                <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-workspace-muted" />
                <input type="text" placeholder="Filtrar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-workspace-surface border border-workspace-border rounded-md pl-8 pr-2 py-1.5 text-xs text-workspace-text focus:outline-none focus:border-workspace-accent transition-all" />
             </div>
           </div>
           <div className="flex-1 overflow-y-auto">
             <div className="px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h3 className="text-xs font-semibold text-workspace-text uppercase tracking-wider truncate max-w-[150px]" title={activeCollection?.name}>{activeCollection?.name}</h3>
                <button onClick={() => openArtifactModal()} className="text-[10px] flex items-center gap-1 text-workspace-accent hover:underline decoration-1 underline-offset-2"><Plus className="w-3 h-3" /> Novo Item</button>
             </div>
             <div className="px-2 space-y-1 pb-4">
               {filteredArtifacts.length === 0 ? (
                 <div className="text-center py-8 opacity-50 flex flex-col items-center"><button onClick={() => openArtifactModal()} className="group border border-dashed border-workspace-muted/40 rounded-lg p-6 hover:border-workspace-accent hover:bg-workspace-surface transition-all w-full flex flex-col items-center justify-center gap-2 mb-2"><Plus className="w-6 h-6 text-workspace-muted group-hover:text-workspace-accent" /></button><p className="text-xs text-workspace-muted">Vazio.</p></div>
               ) : (
                 filteredArtifacts.map(artifact => {
                    const colorData = getArtifactColor(artifact.color);
                    const CustomIcon = artifact.icon ? getIconComponent(artifact.icon) : null;
                    const DefaultIcon = artifact.type === 'code' ? FileCode : FileText;
                    const IconToRender = CustomIcon || DefaultIcon;
                    return (
                   <div key={artifact.id} className={`relative w-full text-left rounded-md border transition-all group ${selectedArtifactId === artifact.id ? `bg-workspace-surface border-transparent shadow-sm` : `bg-transparent hover:bg-workspace-surface hover:border-workspace-border border-transparent`}`}>
                     <button onClick={() => setSelectedArtifactId(artifact.id)} className="w-full p-3 text-left focus:outline-none">
                       <div className="flex items-start gap-2 mb-1 pr-6">
                          <IconToRender className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${artifact.color && artifact.color !== 'default' ? colorData.text : (artifact.type === 'code' ? 'text-blue-500' : 'text-amber-500')}`} />
                          <span className={`text-sm font-medium line-clamp-1 ${selectedArtifactId === artifact.id ? 'text-workspace-text' : 'text-workspace-text/80'}`}>{artifact.title}</span>
                       </div>
                       <p className="text-[10px] text-workspace-muted line-clamp-2 pl-5.5 font-light min-h-[1.25rem]">{artifact.content}</p>
                     </button>
                   </div>
                 );})
               )}
             </div>
           </div>
        </div>
      ) : (
        <div className="w-72 border-r border-workspace-border bg-workspace-surface/30 flex items-center justify-center text-workspace-muted flex-col p-6 text-center">
            <Folder className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-xs">Selecione uma coleção.</p>
        </div>
      )}

      {/* 3. COLUNA: DETALHES */}
      <div className="flex-1 bg-workspace-main flex flex-col h-full overflow-hidden relative">
        {activeArtifact ? (
           <>
             <div className="h-16 border-b border-workspace-border flex items-center justify-between px-8 bg-workspace-main shrink-0">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-md transition-colors ${activeArtifact.color && activeArtifact.color !== 'default' ? `border ${getArtifactColor(activeArtifact.color).border} ${getArtifactColor(activeArtifact.color).text} bg-transparent` : 'border-transparent bg-workspace-accent/10'}`}>
                    {(() => { const CustomIcon = activeArtifact.icon ? getIconComponent(activeArtifact.icon) : null; const DefaultIcon = activeArtifact.type === 'code' ? FileCode : FileText; const IconToRender = CustomIcon || DefaultIcon; return <IconToRender className={`w-5 h-5 ${activeArtifact.color && activeArtifact.color !== 'default' ? '' : 'text-workspace-text'}`} />; })()}
                 </div>
                 <div>
                   <h1 className="text-lg font-light text-workspace-text tracking-tight">{activeArtifact.title}</h1>
                   <div className="flex items-center gap-2 text-[10px] text-workspace-muted">
                      <span>{activeArtifact.type === 'code' ? 'Snippet' : 'Texto'}</span>
                      <span className="w-1 h-1 rounded-full bg-workspace-muted/50" />
                      <span>{activeArtifact.createdAt.toLocaleDateString()}</span>
                   </div>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 border border-workspace-border rounded-md hover:bg-workspace-surface transition-colors text-xs text-workspace-muted hover:text-workspace-text">
                   {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copiado' : 'Copiar'}
                 </button>
                 <button onClick={() => openArtifactModal(activeArtifact)} className="p-2 hover:bg-workspace-surface hover:text-workspace-text text-workspace-muted rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                 <button onClick={(e) => handleDeleteArtifact(activeArtifact.id, e)} className="p-2 hover:bg-red-50 hover:text-red-500 text-workspace-muted rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <div className="max-w-3xl mx-auto">
                 {activeArtifact.type === 'code' ? (
                   <pre className="bg-workspace-surface border border-workspace-border rounded-lg p-6 overflow-x-auto text-sm font-mono text-workspace-text shadow-sm relative group">
                      <div className="absolute top-2 right-2 text-[10px] text-workspace-muted opacity-50 uppercase tracking-wider">Snippet</div>
                      <code>{activeArtifact.content}</code>
                   </pre>
                 ) : (
                   <div className="prose prose-sm dark:prose-invert max-w-none font-light leading-relaxed text-workspace-text whitespace-pre-wrap">{activeArtifact.content}</div>
                 )}
               </div>
             </div>
           </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-workspace-muted opacity-60"><Box className="w-16 h-16 mb-4 stroke-[1]" /><h3 className="text-lg font-light mb-2">Nenhum Item Selecionado</h3></div>
        )}
      </div>

      {/* --- MODAL COLEÇÃO --- */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-workspace-surface w-full max-w-[22rem] border border-workspace-border rounded-lg shadow-2xl p-5 relative m-4 max-h-[90vh] flex flex-col">
            <button onClick={() => setIsCollectionModalOpen(false)} className="absolute top-4 right-4 text-workspace-muted hover:text-workspace-text transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-light text-workspace-text mb-6 flex items-center gap-2 shrink-0">{editingCollectionId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {editingCollectionId ? 'Editar Coleção' : 'Nova Coleção'}</h2>
            <div className="space-y-5 overflow-y-auto custom-scrollbar pr-2 flex-1">
              <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Nome</label><input type="text" value={newColName} onChange={(e) => setNewColName(e.target.value)} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors" placeholder="Ex: Infraestrutura" autoFocus /></div>
              <div><label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Descrição</label><input type="text" value={newColDesc} onChange={(e) => setNewColDesc(e.target.value)} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors" placeholder="Opcional" /></div>
              <div><label className="block text-xs font-medium text-workspace-muted mb-2 uppercase tracking-wider">Ícone</label><div className="grid grid-cols-6 gap-2 p-2 bg-workspace-main border border-workspace-border rounded-lg max-h-48 overflow-y-auto custom-scrollbar">{Object.keys(ICON_MAP).map((iconKey) => { const IconComponent = ICON_MAP[iconKey]; const isSelected = newColIcon === iconKey; return (<button key={iconKey} onClick={() => setNewColIcon(iconKey)} className={`flex items-center justify-center p-2.5 rounded-md transition-all focus:outline-none ${isSelected ? 'bg-workspace-accent text-white shadow-sm ring-1 ring-workspace-text/20' : 'bg-workspace-surface text-workspace-muted hover:bg-workspace-surface/80 hover:text-workspace-text'}`}><IconComponent className="w-5 h-5 stroke-[1.5]" /></button>);})}</div></div>
            </div>
            <div className="mt-8 flex justify-end gap-3 shrink-0 pt-4 border-t border-workspace-border"><button onClick={() => setIsCollectionModalOpen(false)} className="px-4 py-2 text-xs font-medium text-workspace-text hover:bg-workspace-main rounded-md transition-colors">CANCELAR</button><button onClick={handleSaveCollection} disabled={!newColName} className="px-6 py-2 bg-workspace-accent hover:opacity-90 text-white text-xs font-medium tracking-wide rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Save className="w-3 h-3" /> SALVAR</button></div>
          </div>
        </div>
      )}

      {/* --- MODAL ARTEFATO --- */}
      {isArtifactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-workspace-surface w-full max-w-lg border border-workspace-border rounded-lg shadow-2xl p-5 relative m-4 max-h-[85vh] flex flex-col">
            <button onClick={() => setIsArtifactModalOpen(false)} className="absolute top-4 right-4 text-workspace-muted hover:text-workspace-text transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-light text-workspace-text mb-4 flex items-center gap-2 shrink-0">{editingArtifactId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {editingArtifactId ? 'Editar Item' : 'Novo Item'}</h2>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
              
              {/* Row 1: Title and Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Título</label>
                    <input type="text" value={artifactForm.title} onChange={(e) => setArtifactForm({...artifactForm, title: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-2 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors" placeholder="Ex: Snippet de Python" autoFocus />
                </div>
                <div>
                    <label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Tipo</label>
                    <div className="flex bg-workspace-main border border-workspace-border rounded-md p-1 h-[38px]">
                        <button onClick={() => setArtifactForm({...artifactForm, type: 'text'})} className={`flex-1 flex items-center justify-center gap-1.5 rounded text-xs font-medium transition-all ${artifactForm.type === 'text' ? 'bg-workspace-surface shadow-sm text-workspace-text' : 'text-workspace-muted hover:text-workspace-text'}`}><FileText className="w-3.5 h-3.5" /> </button>
                        <button onClick={() => setArtifactForm({...artifactForm, type: 'code'})} className={`flex-1 flex items-center justify-center gap-1.5 rounded text-xs font-medium transition-all ${artifactForm.type === 'code' ? 'bg-workspace-surface shadow-sm text-blue-500' : 'text-workspace-muted hover:text-workspace-text'}`}><FileCode className="w-3.5 h-3.5" /> </button>
                    </div>
                </div>
              </div>

              {/* Row 2: Icon and Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Ícone</label>
                    <div className="relative">
                        <div className="grid grid-cols-6 gap-1 p-1.5 bg-workspace-main border border-workspace-border rounded-lg max-h-24 overflow-y-auto custom-scrollbar">
                            <button onClick={() => setArtifactForm({...artifactForm, icon: ''})} className={`flex items-center justify-center p-1.5 rounded-md transition-all ${artifactForm.icon === '' ? 'bg-workspace-surface shadow-sm ring-1 ring-workspace-text/20 text-workspace-text' : 'text-workspace-muted hover:text-workspace-text'}`}><span className="text-[10px] font-mono">--</span></button>
                            {Object.keys(ICON_MAP).map((iconKey) => { 
                                const IconComponent = ICON_MAP[iconKey]; 
                                const isSelected = artifactForm.icon === iconKey; 
                                return (<button key={iconKey} onClick={() => setArtifactForm({...artifactForm, icon: iconKey})} className={`flex items-center justify-center p-1.5 rounded-md transition-all ${isSelected ? 'bg-workspace-accent text-white shadow-sm' : 'text-workspace-muted hover:bg-workspace-surface hover:text-workspace-text'}`}><IconComponent className="w-3.5 h-3.5 stroke-[1.5]" /></button>);
                            })}
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Cor</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-workspace-main border border-workspace-border rounded-lg h-24 content-start overflow-y-auto custom-scrollbar">
                        {COLOR_OPTIONS.map(color => (
                            <button key={color.id} onClick={() => setArtifactForm({...artifactForm, color: color.id})} className={`w-5 h-5 rounded-full border-2 transition-all ${color.bg} ${artifactForm.color === color.id ? 'ring-2 ring-offset-2 ring-offset-workspace-main ring-workspace-text scale-110' : 'opacity-70 hover:opacity-100 border-transparent'}`} />
                        ))}
                    </div>
                 </div>
              </div>

              {/* Row 3: Content */}
              <div>
                <label className="block text-xs font-medium text-workspace-muted mb-1.5 uppercase tracking-wider">Conteúdo</label>
                <textarea 
                    value={artifactForm.content} 
                    onChange={(e) => setArtifactForm({...artifactForm, content: e.target.value})} 
                    className={`w-full bg-workspace-main border border-workspace-border rounded-md px-3 py-3 text-sm text-workspace-text focus:outline-none focus:border-workspace-accent transition-colors min-h-[150px] resize-y font-light leading-relaxed ${artifactForm.type === 'code' ? 'font-mono text-xs' : ''}`} 
                    placeholder={artifactForm.type === 'code' ? '// Código aqui...' : 'Texto aqui...'} 
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 shrink-0 pt-4 border-t border-workspace-border">
                <button onClick={() => setIsArtifactModalOpen(false)} className="px-4 py-2 text-xs font-medium text-workspace-text hover:bg-workspace-main rounded-md transition-colors">CANCELAR</button>
                <button onClick={handleSaveArtifact} disabled={!artifactForm.title} className="px-6 py-2 bg-workspace-accent hover:opacity-90 text-white text-xs font-medium tracking-wide rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Save className="w-3 h-3" /> SALVAR</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Artifacts;