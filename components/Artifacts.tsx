import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Folder, FileCode, FileText, Plus, Search, Box, Layers, 
  Trash2, Copy, Check, Pencil, Download, Upload, Loader2, File
} from 'lucide-react';
import { Artifact, ArtifactCollection } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Helpers de Mapeamento ---
const toSupabaseCol = (col: Partial<ArtifactCollection>) => ({ nome: col.name, descricao: col.description, icone: col.icon });
const toFrontendCol = (data: any): ArtifactCollection => ({ id: data.id, name: data.nome, description: data.descricao, icon: data.icone });
const toSupabaseArt = (art: Partial<Artifact>) => ({ colecao_id: art.collectionId, titulo: art.title, conteudo: art.content, tipo: art.type, icone: art.icon, cor: art.color });
const toFrontendArt = (data: any): Artifact => ({ 
  id: data.id, 
  collectionId: data.colecao_id, 
  title: data.titulo, 
  content: data.conteudo || '', 
  description: '', 
  type: data.tipo, 
  createdAt: new Date(data.criado_em), 
  icon: data.icone, 
  color: data.cor 
});

const formatError = (error: any) => error?.message || JSON.stringify(error);

const ICON_MAP: Record<string, React.ElementType> = {
  'folder': Folder, 'box': Box, 'layers': Layers, 'code': FileCode, 'file': FileText, 'word': FileText, 'pdf': FileText
};

const COLOR_OPTIONS = [
  { id: 'default', text: 'text-workspace-muted' },
  { id: 'blue', text: 'text-blue-500' },
  { id: 'emerald', text: 'text-emerald-500' },
  { id: 'amber', text: 'text-amber-500' },
  { id: 'red', text: 'text-red-500' }
];

const Artifacts: React.FC = () => {
  const [collections, setCollections] = useState<ArtifactCollection[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColIcon, setNewColIcon] = useState('folder');

  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [artifactForm, setArtifactForm] = useState({ title: '', content: '', type: 'text' as Artifact['type'], icon: 'file' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: colData } = await supabase.from('colecoes').select('*');
      const { data: artData } = await supabase.from('artefatos').select('id, colecao_id, titulo, tipo, criado_em, icone, cor');
      if (colData) setCollections(colData.map(toFrontendCol));
      if (artData) setArtifacts(artData.map(toFrontendArt));
    } catch (e) {
      console.error('[SUPABASE] Erro:', formatError(e));
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
        console.error('Erro ao carregar conteúdo do artefato:', e);
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

  const saveCollection = async () => {
    if (!newColName.trim()) return;
    const colData = { name: newColName, icon: newColIcon };
    setIsCollectionModalOpen(false);
    if (editingCollectionId) {
      setCollections(prev => prev.map(c => c.id === editingCollectionId ? { ...c, ...colData } : c));
      await supabase.from('colecoes').update(toSupabaseCol(colData)).eq('id', editingCollectionId);
    } else {
      const { data } = await supabase.from('colecoes').insert([toSupabaseCol(colData)]).select().single();
      if (data) setCollections(prev => [...prev, toFrontendCol(data)]);
    }
  };

  const openArtifactModal = (art?: Artifact) => {
    setEditingArtifactId(art?.id || null);
    setArtifactForm({ title: art?.title || '', content: art?.content || '', type: art?.type || 'text', icon: art?.icon || 'file' });
    setIsArtifactModalOpen(true);
  };

  const saveArtifact = async () => {
    if (!artifactForm.title.trim() || !selectedCollectionId) return;
    const artData = { ...artifactForm, collectionId: selectedCollectionId };
    setIsArtifactModalOpen(false);
    if (editingArtifactId) {
      setArtifacts(prev => prev.map(a => a.id === editingArtifactId ? { ...a, ...artData } as Artifact : a));
      await supabase.from('artefatos').update(toSupabaseArt(artData)).eq('id', editingArtifactId);
    } else {
      const { data } = await supabase.from('artefatos').insert([toSupabaseArt(artData)]).select().single();
      if (data) setArtifacts(prev => [...prev, toFrontendArt(data)]);
    }
  };

  const deleteArtifact = async (id: string) => {
    if (!confirm('Deseja excluir?')) return;
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (selectedArtifactId === id) setSelectedArtifactId(null);
    await supabase.from('artefatos').delete().eq('id', id);
  };

  return (
    <div className="flex h-full w-full bg-workspace-main overflow-hidden border-t border-workspace-border">
      {/* Coluna 1: Coleções */}
      <div className="w-[200px] border-r border-workspace-border flex flex-col shrink-0 bg-workspace-main">
        <div className="h-12 flex items-center justify-between px-3 border-b border-workspace-border shrink-0">
          <span className="text-[10px] font-bold text-workspace-muted uppercase tracking-widest flex items-center gap-2">
            {isLoading && <Loader2 className="w-2.5 h-2.5 animate-spin" />} Coleções
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
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-l-2 transition-colors ${selectedCollectionId === col.id ? 'bg-workspace-surface border-workspace-accent' : 'border-transparent hover:bg-workspace-surface/50'}`}
              >
                <div className={`p-1 rounded ${selectedCollectionId === col.id ? 'bg-workspace-accent text-white' : 'bg-workspace-surface text-workspace-muted'}`}><Icon className="w-3.5 h-3.5" /></div>
                <span className={`text-xs font-semibold truncate flex-1 ${selectedCollectionId === col.id ? 'text-workspace-text' : 'text-workspace-text/70'}`}>{col.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coluna 2: Lista */}
      <div className="w-[260px] border-r border-workspace-border flex flex-col shrink-0 bg-workspace-surface/10">
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
            <span className="text-[9px] font-black uppercase tracking-widest text-workspace-muted pr-2">{activeCollection?.name || 'Lista'}</span>
            <button onClick={() => openArtifactModal()} className="text-[9px] font-bold text-workspace-accent uppercase flex items-center gap-1 hover:opacity-70"><Plus className="w-2.5 h-2.5" /> Novo</button>
          </div>
          <div className="divide-y divide-workspace-border/20">
            {filteredArtifacts.map(art => {
              const Icon = getIcon(art.icon || 'file');
              const color = COLOR_OPTIONS.find(c => c.id === art.color)?.text || 'text-workspace-muted';
              return (
                <button 
                  key={art.id} 
                  onClick={() => setSelectedArtifactId(art.id)}
                  className={`w-full p-3 text-left transition-colors flex flex-col gap-1 border-l-2 ${selectedArtifactId === art.id ? 'bg-workspace-surface border-workspace-accent' : 'border-transparent hover:bg-workspace-surface/40'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded bg-workspace-surface border border-workspace-border shrink-0 shadow-none">
                      <Icon className={`w-3 h-3 ${color}`} />
                    </div>
                    <span className="text-[11px] font-bold truncate leading-none flex-1">{art.title}</span>
                  </div>
                  <span className="text-[9px] text-workspace-muted pl-7 uppercase tracking-tighter opacity-60">
                    {['pdf', 'word', 'excel', 'powerpoint'].includes(art.type) ? 'Documento' : 'Texto'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coluna 3: Detalhes */}
      <div className="flex-1 flex flex-col bg-workspace-main min-w-0 overflow-hidden relative">
        {activeArtifact ? (
          <>
            <div className="h-12 border-b border-workspace-border flex items-center justify-between px-6 shrink-0 z-10">
              <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                <div className="p-1.5 bg-workspace-surface border border-workspace-border rounded shrink-0 shadow-none">
                  {(() => { 
                    const Icon = getIcon(activeArtifact.icon || 'file'); 
                    const colorClass = COLOR_OPTIONS.find(c => c.id === activeArtifact.color)?.text || 'text-workspace-accent';
                    return <Icon className={`w-3.5 h-3.5 ${colorClass}`} />; 
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xs font-bold text-workspace-text truncate leading-tight" title={activeArtifact.title}>{activeArtifact.title}</h1>
                  <span className="text-[8px] text-workspace-muted uppercase font-black tracking-widest opacity-60">{activeArtifact.type} • {activeArtifact.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-4">
                {isContentLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-workspace-accent mr-2" />}
                {['pdf', 'word', 'excel', 'powerpoint'].includes(activeArtifact.type) ? (
                  <button 
                    disabled={isContentLoading || !activeArtifact.content}
                    onClick={handleDownload} 
                    className="px-3 py-1 bg-workspace-accent text-white rounded text-[9px] font-black uppercase flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40"
                  >
                    <Download className="w-2.5 h-2.5" /> Baixar
                  </button>
                ) : (
                  <button 
                    disabled={isContentLoading || !activeArtifact.content}
                    onClick={handleCopy} 
                    className="p-1.5 border border-workspace-border rounded hover:bg-workspace-surface transition-colors disabled:opacity-40"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-workspace-muted" />}
                  </button>
                )}
                <button onClick={() => openArtifactModal(activeArtifact)} className="p-1.5 hover:bg-workspace-surface text-workspace-muted rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteArtifact(activeArtifact.id)} className="p-1.5 hover:bg-red-500/10 text-workspace-muted hover:text-red-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-workspace-main relative">
              <div className="max-w-2xl space-y-4">
                {['pdf', 'word', 'excel', 'powerpoint'].includes(activeArtifact.type) ? (
                  <div className="flex flex-col gap-6 animate-fade-in-quick">
                    <div className="flex items-center gap-3 p-4 bg-workspace-surface border border-workspace-border border-l-4 border-l-workspace-accent rounded shadow-none">
                      <div className="w-10 h-10 bg-workspace-surface border border-workspace-border rounded flex items-center justify-center shrink-0 shadow-none">
                        {(() => { 
                          const Icon = getIcon(activeArtifact.icon || 'file'); 
                          const colorClass = COLOR_OPTIONS.find(c => c.id === activeArtifact.color)?.text || 'text-workspace-accent';
                          return <Icon className={`w-5 h-5 ${colorClass}`} />; 
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold truncate mb-1">{activeArtifact.title}</h3>
                        <span className="text-[9px] uppercase tracking-widest text-workspace-muted font-bold opacity-60">
                          Formato: {activeArtifact.type} | {activeArtifact.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <button 
                        disabled={isContentLoading || !activeArtifact.content}
                        onClick={handleDownload} 
                        className="p-2 text-workspace-muted hover:text-workspace-text hover:bg-workspace-main rounded-md disabled:opacity-30"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`text-workspace-text font-light leading-relaxed whitespace-pre-wrap selection:bg-workspace-accent/20 border-l-2 border-transparent pl-4 ${activeArtifact.type === 'code' ? 'font-mono text-[10px] bg-workspace-surface p-4 border border-workspace-border border-l-workspace-accent rounded' : 'text-xs'}`}>
                    {isContentLoading ? (
                        <div className="flex items-center gap-3 py-4 text-workspace-muted">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Carregando conteúdo...</span>
                        </div>
                    ) : (activeArtifact.content || 'Este artefato não possui conteúdo.')}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-workspace-muted opacity-10">
            <Box className="w-12 h-12 mb-2 stroke-[1]" />
            <p className="text-[10px] uppercase font-black tracking-widest">Workspace Vazio</p>
          </div>
        )}
      </div>

      {/* Modais Minimalistas */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-workspace-surface w-full max-w-[220px] border border-workspace-border rounded shadow-2xl p-4">
            <h2 className="text-[9px] font-black mb-4 uppercase tracking-widest">Nova Coleção</h2>
            <input 
              type="text" 
              value={newColName} 
              onChange={(e) => setNewColName(e.target.value)} 
              className="w-full bg-workspace-main border border-workspace-border rounded px-2 py-1.5 text-[10px] mb-4 focus:outline-none focus:border-workspace-accent" 
              placeholder="Nome"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsCollectionModalOpen(false)} className="text-[8px] font-bold text-workspace-muted uppercase px-2 py-1">Sair</button>
              <button onClick={saveCollection} className="px-3 py-1 bg-workspace-accent text-white text-[8px] font-black rounded uppercase">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {isArtifactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-workspace-surface w-full max-w-md border border-workspace-border rounded shadow-2xl p-5 flex flex-col max-h-[85vh]">
            <h2 className="text-[9px] font-black mb-4 uppercase tracking-widest">Artefato</h2>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              <input 
                type="text" 
                value={artifactForm.title} 
                onChange={(e) => setArtifactForm({...artifactForm, title: e.target.value})} 
                className="w-full bg-workspace-main border border-workspace-border rounded px-2 py-2 text-[10px] focus:outline-none focus:border-workspace-accent" 
                placeholder="Título"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button onClick={() => setArtifactForm({...artifactForm, type: 'text'})} className={`flex-1 py-1.5 rounded border border-workspace-border text-[8px] font-black ${artifactForm.type === 'text' ? 'bg-workspace-accent text-white border-workspace-accent' : 'bg-workspace-main text-workspace-muted'}`}>TEXTO</button>
                <button onClick={() => setArtifactForm({...artifactForm, type: 'code'})} className={`flex-1 py-1.5 rounded border border-workspace-border text-[8px] font-black ${artifactForm.type === 'code' ? 'bg-workspace-accent text-white border-workspace-accent' : 'bg-workspace-main text-workspace-muted'}`}>CÓDIGO</button>
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-1.5 rounded border border-workspace-border bg-workspace-main text-[8px] font-black flex items-center justify-center gap-1 hover:bg-workspace-surface"><Upload className="w-2.5 h-2.5" /> ARQUIVO</button>
              </div>
              <textarea 
                value={artifactForm.content} 
                onChange={(e) => setArtifactForm({...artifactForm, content: e.target.value})} 
                className="w-full bg-workspace-main border border-workspace-border rounded px-2 py-2 text-[10px] min-h-[150px] resize-none focus:outline-none focus:border-workspace-accent" 
                placeholder="Insira o texto ou arraste um arquivo..."
              />
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => { 
                const f = e.target.files?.[0]; 
                if(f) { 
                    const r = new FileReader(); 
                    r.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        let type: Artifact['type'] = 'text';
                        if (f.type.includes('pdf')) type = 'pdf';
                        else if (f.type.includes('word')) type = 'word';
                        else if (f.type.includes('excel')) type = 'excel';
                        else if (f.type.includes('powerpoint')) type = 'powerpoint';
                        
                        setArtifactForm({
                            ...artifactForm, 
                            title: f.name, 
                            content: base64, 
                            type: type,
                            icon: type === 'text' ? 'file' : type
                        });
                    };
                    r.readAsDataURL(f); 
                } 
            }} className="hidden" />
            <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-workspace-border shrink-0">
              <button onClick={() => setIsArtifactModalOpen(false)} className="text-[8px] font-bold text-workspace-muted uppercase px-2 py-1">Cancelar</button>
              <button onClick={saveArtifact} className="px-5 py-1.5 bg-workspace-accent text-white text-[8px] font-black rounded uppercase">Salvar Artefato</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Artifacts;