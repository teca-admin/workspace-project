import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Folder, FileCode, FileText, Plus, Search, Box, Layers, 
  Trash2, Copy, Check, Pencil, Download, Upload, Loader2, File, X,
  StickyNote, Target, Zap, TrendingUp, Activity, BarChart3, PieChart, Workflow, Cpu, Bot, Briefcase, CheckCircle2, ClipboardList, Clock, Repeat, RotateCw, Shield, Users, Calendar, Kanban, Layout, Boxes, Settings, Scale, Gauge, History, ListChecks, MessageSquare, Milestone, Network, PenTool, Play, Pocket, Puzzle, Rocket, Share2, Siren, Sparkles, StepForward, StopCircle, Telescope, Timer, Wrench, Truck, Variable, Hammer, Glasses, HardDrive, Package, Inbox
} from 'lucide-react';
import { Artifact, ArtifactCollection } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Curadoria de 50 ícones: LSS, Agile, Automação e Gestão ---
const COLLECTION_ICONS: Record<string, React.ElementType> = {
  'target': Target, 'zap': Zap, 'trending': TrendingUp, 'activity': Activity, 'barchart': BarChart3, 
  'piechart': PieChart, 'repeat': Repeat, 'rotate': RotateCw, 'gauge': Gauge, 'scale': Scale, 
  'history': History, 'checkcircle': CheckCircle2, 'siren': Siren, 'kanban': Kanban, 'layout': Layout, 
  'boxes': Boxes, 'briefcase': Briefcase, 'calendar': Calendar, 'clock': Clock, 'milestone': Milestone, 
  'clipboard': ClipboardList, 'users': Users, 'workflow': Workflow, 'cpu': Cpu, 'bot': Bot, 
  'network': Network, 'variable': Variable, 'settings': Settings, 'layers': Layers, 'box': Box, 
  'shield': Shield, 'search': Search, 'telescope': Telescope, 'glasses': Glasses, 'pentool': PenTool, 
  'hammer': Hammer, 'wrench': Wrench, 'truck': Truck, 'package': Package, 'inbox': Inbox, 
  'message': MessageSquare, 'sparkles': Sparkles, 'play': Play, 'rocket': Rocket, 'stepforward': StepForward, 
  'stopcircle': StopCircle, 'filetext': FileText, 'filecode': FileCode, 'folder': Folder, 'harddrive': HardDrive
};

const COLOR_PALETTE = [
  { name: 'Slate', value: '#71717a' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Cyan', value: '#06b6d4' }
];

const toSupabaseCol = (col: Partial<ArtifactCollection>) => ({ 
  nome: col.name, 
  icone: col.icon,
  cor: col.color,
  descricao: col.description
});

const toFrontendCol = (data: any): ArtifactCollection => ({ 
  id: data.id, 
  name: data.nome, 
  icon: data.icone || 'folder',
  color: data.cor || '#71717a',
  description: data.descricao || '',
  updatedAt: data.atualizado_em ? new Date(data.atualizado_em) : undefined
});

const toSupabaseArt = (art: any) => ({
  colecao_id: art.collectionId,
  titulo: art.title,
  tipo: art.type,
  icone: art.icon,
  cor: art.color,
  conteudo: art.content || ''
});

const toFrontendArt = (data: any): Artifact => ({ 
  id: data.id, 
  collectionId: data.colecao_id, 
  title: data.titulo, 
  content: data.conteudo || '', 
  description: data.descricao || '', 
  type: data.tipo, 
  createdAt: new Date(data.criado_em), 
  updatedAt: data.atualizado_em ? new Date(data.atualizado_em) : undefined,
  icon: data.icone, 
  color: data.cor 
});

const Artifacts: React.FC = () => {
  const [collections, setCollections] = useState<ArtifactCollection[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [colForm, setColForm] = useState({ name: '', icon: 'folder', color: '#71717a', description: '' });

  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [artifactForm, setArtifactForm] = useState({ title: '', content: '', type: 'text' as Artifact['type'] });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: colData } = await supabase.from('colecoes').select('*').order('nome');
      const { data: artData } = await supabase.from('artefatos').select('id, colecao_id, titulo, tipo, criado_em, atualizado_em, icone, cor');
      if (colData) setCollections(colData.map(toFrontendCol));
      if (artData) setArtifacts(artData.map(toFrontendArt));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeCollection = useMemo(() => collections.find(c => c.id === selectedCollectionId), [collections, selectedCollectionId]);
  const activeArtifact = useMemo(() => artifacts.find(a => a.id === selectedArtifactId), [artifacts, selectedArtifactId]);

  const filteredArtifacts = useMemo(() => artifacts.filter(a => 
    a.collectionId === selectedCollectionId && a.title.toLowerCase().includes(searchQuery.toLowerCase())
  ), [artifacts, selectedCollectionId, searchQuery]);

  const getColIcon = (name: string) => COLLECTION_ICONS[name] || Folder;

  const saveCollection = async () => {
    if (!colForm.name.trim()) return;
    setIsSyncing(true);
    try {
      const payload = toSupabaseCol(colForm);
      if (editingCollectionId) {
        await supabase.from('colecoes').update(payload).eq('id', editingCollectionId);
      } else {
        await supabase.from('colecoes').insert([payload]);
      }
      setIsCollectionModalOpen(false);
      fetchData();
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteCollection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir permanentemente esta coleção e todos os seus artefatos?')) return;
    
    // UI Update otimista
    setCollections(prev => prev.filter(c => c.id !== id));
    if (selectedCollectionId === id) setSelectedCollectionId(null);

    try {
      await supabase.from('colecoes').delete().eq('id', id);
    } catch (err) {
      console.error("Erro ao deletar:", err);
      fetchData(); // Recarrega se der erro
    }
  };

  const openCollectionModal = (col?: ArtifactCollection) => {
    setEditingCollectionId(col?.id || null);
    setColForm({ 
      name: col?.name || '', icon: col?.icon || 'folder', 
      color: col?.color || '#71717a', description: col?.description || '' 
    });
    setIsCollectionModalOpen(true);
  };

  const saveArtifact = async () => {
    if (!artifactForm.title.trim() || !selectedCollectionId) return;
    setIsSyncing(true);
    try {
      const payload = toSupabaseArt({ ...artifactForm, collectionId: selectedCollectionId });
      if (editingArtifactId) {
        await supabase.from('artefatos').update(payload).eq('id', editingArtifactId);
      } else {
        await supabase.from('artefatos').insert([payload]);
      }
      setIsArtifactModalOpen(false);
      fetchData();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-workspace-main overflow-hidden border-t border-workspace-border">
      {/* Coluna 1: Coleções */}
      <div className="w-[24%] border-r border-workspace-border flex flex-col shrink-0">
        <div className="h-12 flex items-center justify-between px-3 border-b border-workspace-border">
          <span className="text-[10px] font-bold text-workspace-muted uppercase tracking-widest">Coleções</span>
          <button onClick={() => openCollectionModal()} className="p-1 hover:bg-workspace-surface rounded text-workspace-muted"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {collections.map(col => {
            const Icon = getColIcon(col.icon);
            return (
              <div 
                key={col.id} 
                onClick={() => { setSelectedCollectionId(col.id); setSelectedArtifactId(null); }}
                className={`group flex items-center gap-3 px-3 py-2.5 cursor-pointer border-l-2 transition-all ${selectedCollectionId === col.id ? 'bg-workspace-surface border-workspace-accent' : 'border-transparent hover:bg-workspace-surface/50'}`}
              >
                <div 
                  className={`p-1.5 rounded transition-colors ${selectedCollectionId === col.id ? 'text-white' : 'bg-workspace-main border border-workspace-border/30 text-workspace-muted'}`}
                  style={{ backgroundColor: selectedCollectionId === col.id ? col.color : 'transparent' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-semibold truncate flex-1 ${selectedCollectionId === col.id ? 'text-workspace-text' : 'text-workspace-text/70'}`}>{col.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openCollectionModal(col); }} className="p-1 hover:text-workspace-accent"><Pencil className="w-3 h-3" /></button>
                  <button onClick={(e) => deleteCollection(e, col.id)} className="p-1 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coluna 2: Artefatos */}
      <div className="w-[24%] border-r border-workspace-border flex flex-col shrink-0 bg-workspace-surface/10">
        <div className="h-12 flex items-center px-3 border-b border-workspace-border">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-workspace-muted" />
            <input type="text" placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-workspace-surface border border-workspace-border rounded pl-7 pr-2 py-1.5 text-[10px] focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <div className="h-8 flex items-center justify-between px-3 border-b border-workspace-border sticky top-0 bg-workspace-main z-10">
            <span className="text-[9px] font-black uppercase text-workspace-muted truncate pr-2">{activeCollection?.name || 'Selecione'}</span>
            <button disabled={!selectedCollectionId} onClick={() => { setEditingArtifactId(null); setArtifactForm({ title: '', content: '', type: 'text' }); setIsArtifactModalOpen(true); }} className={`text-[9px] font-bold uppercase ${selectedCollectionId ? 'text-workspace-accent' : 'text-workspace-muted opacity-40'}`}>+ Novo</button>
          </div>
          {filteredArtifacts.map(art => (
            <button key={art.id} onClick={() => setSelectedArtifactId(art.id)} className={`w-full p-3 text-left border-l-2 ${selectedArtifactId === art.id ? 'bg-workspace-surface border-workspace-accent' : 'border-transparent hover:bg-workspace-surface/40'}`}>
              <div className="flex items-center gap-2"><File className="w-3 h-3 text-workspace-muted" /><span className="text-[11px] font-bold truncate">{art.title}</span></div>
            </button>
          ))}
        </div>
      </div>

      {/* Coluna 3: Conteúdo */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeArtifact ? (
          <div className="flex flex-col h-full">
            <div className="h-12 border-b border-workspace-border flex items-center justify-between px-6 shrink-0">
               <h1 className="text-xs font-bold truncate">{activeArtifact.title}</h1>
               <div className="flex gap-2">
                 <button onClick={() => { setEditingArtifactId(activeArtifact.id); setArtifactForm({ ...activeArtifact }); setIsArtifactModalOpen(true); }} className="p-1.5 hover:bg-workspace-surface rounded"><Pencil className="w-3.5 h-3.5" /></button>
               </div>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar whitespace-pre-wrap text-xs font-light leading-relaxed">{activeArtifact.content}</div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10"><Box className="w-16 h-16 mb-4" /><p className="text-[10px] uppercase font-black tracking-widest">Artefatos</p></div>
        )}
      </div>

      {/* Modal Coleção */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-workspace-surface w-full max-w-xl border border-workspace-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-workspace-border flex items-center justify-between">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-workspace-accent">{editingCollectionId ? 'EDITAR' : 'NOVA COLEÇÃO'}</h2>
               <button onClick={() => setIsCollectionModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <input type="text" value={colForm.name} onChange={(e) => setColForm({...colForm, name: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-lg px-4 py-3 text-sm focus:outline-none" placeholder="Nome da Coleção" />
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map(c => <button key={c.value} onClick={() => setColForm({...colForm, color: c.value})} className={`w-6 h-6 rounded-full ${colForm.color === c.value ? 'ring-2 ring-workspace-accent ring-offset-2 ring-offset-workspace-surface' : ''}`} style={{backgroundColor: c.value}} />)}
              </div>
              <div className="grid grid-cols-10 gap-2 bg-workspace-main/50 p-4 rounded-xl h-48 overflow-y-auto custom-scrollbar border border-workspace-border">
                {Object.keys(COLLECTION_ICONS).map(iconKey => {
                  const Icon = COLLECTION_ICONS[iconKey];
                  return <button key={iconKey} onClick={() => setColForm({...colForm, icon: iconKey})} className={`aspect-square flex items-center justify-center rounded-lg border ${colForm.icon === iconKey ? 'bg-workspace-accent text-white' : 'border-workspace-border text-workspace-muted hover:border-workspace-accent/40'}`}><Icon className="w-4 h-4" /></button>
                })}
              </div>
              <textarea value={colForm.description} onChange={(e) => setColForm({...colForm, description: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-xl px-4 py-4 text-xs min-h-[80px] resize-none focus:outline-none" placeholder="Notas/Observações da coleção..." />
            </div>
            <div className="p-4 bg-workspace-main border-t border-workspace-border flex justify-end gap-3">
              <button onClick={() => setIsCollectionModalOpen(false)} className="text-[9px] font-black uppercase">Cancelar</button>
              <button onClick={saveCollection} className="px-8 py-2 bg-workspace-accent text-white text-[9px] font-black rounded-lg uppercase">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Artefato */}
      {isArtifactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-workspace-surface w-full max-w-xl border border-workspace-border rounded-xl p-6">
            <h2 className="text-[10px] font-black uppercase text-workspace-accent mb-6">GERENCIAR ARTEFATO</h2>
            <div className="space-y-4">
              <input type="text" value={artifactForm.title} onChange={(e) => setArtifactForm({...artifactForm, title: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-lg px-4 py-3 text-sm focus:outline-none" placeholder="Título" />
              <textarea value={artifactForm.content} onChange={(e) => setArtifactForm({...artifactForm, content: e.target.value})} className="w-full bg-workspace-main border border-workspace-border rounded-lg px-4 py-4 text-xs min-h-[200px] resize-none focus:outline-none" placeholder="Conteúdo..." />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsArtifactModalOpen(false)} className="text-[9px] font-black uppercase">Cancelar</button>
              <button onClick={saveArtifact} className="px-8 py-2 bg-workspace-accent text-white text-[9px] font-black rounded-lg uppercase">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Artifacts;