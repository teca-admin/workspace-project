import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Bold, 
  Italic, 
  Underline, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Search,
  PenLine,
  StickyNote,
  Check,
  X,
  ExternalLink,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Loader2
} from 'lucide-react';
import { Note } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Mapeamento de Colunas (De/Para) ---

// Frontend -> Supabase
const toSupabase = (note: Partial<Note>) => {
  return {
    titulo: note.title,
    conteudo: note.content,
  };
};

// Supabase -> Frontend
const toFrontend = (data: any): Note => ({
  id: data.id,
  title: data.titulo || 'Sem Título',
  content: data.conteudo || '',
  createdAt: new Date(data.criado_em),
  updatedAt: new Date(data.atualizado_em)
});

// Helper para formatar erro
const formatError = (error: any) => {
  return error?.message || JSON.stringify(error);
};

interface ToolButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  label: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon: Icon, onClick, label }) => (
  <button 
    onClick={onClick} 
    className="p-1.5 text-workspace-muted hover:text-workspace-text hover:bg-workspace-surface rounded-md transition-colors focus:outline-none"
    title={label}
  >
    <Icon className="w-4 h-4 stroke-[1.5]" />
  </button>
);

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);

  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionRange = useRef<Range | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // --- READ (Buscar dados) ---
  const fetchNotes = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('notas')
        .select('*');
      
      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        const mappedNotes = data.map(toFrontend).sort((a, b) => 
          b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        setNotes(mappedNotes);
        console.log('[SUPABASE] ✅ Notas sincronizadas');
      }
    } catch (e) {
      console.error('[SUPABASE] ❌ Erro ao buscar:', formatError(e));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    setShowLinkInput(false);
    setLinkValue('');
    setSelectedElement(null);
    
    if (contentEditableRef.current && activeNote) {
      if (contentEditableRef.current.innerHTML !== activeNote.content) {
        contentEditableRef.current.innerHTML = activeNote.content;
      }
    }
  }, [activeNoteId]);

  // --- CRUD Actions (Optimistic UI) ---

  // CREATE
  const handleCreateNote = async () => {
    const tempId = `temp-${Date.now()}`;
    const newNote: Note = {
      id: tempId,
      title: 'Nova Nota',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(tempId);

    try {
      const { data, error } = await supabase
        .from('notas')
        .insert([{ titulo: 'Nova Nota', conteudo: '' }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const realNote = toFrontend(data);
        setNotes(current => current.map(n => n.id === tempId ? realNote : n));
        setActiveNoteId(realNote.id);
        console.log('[SUPABASE] ✅ Nota criada');
      }
    } catch (e) {
      console.error('[SUPABASE] ❌ Erro ao criar:', formatError(e));
      setNotes(prev => prev.filter(n => n.id !== tempId));
      if (activeNoteId === tempId) setActiveNoteId(null);
      alert(`Erro ao criar nota: ${formatError(e)}`);
    }
  };

  // DELETE
  const handleDeleteNote = async (id: string) => {
    const noteRemovida = notes.find(n => n.id === id);
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeNoteId === id) {
      setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
    }
    if (id.startsWith('temp-')) return;
    try {
      const { error } = await supabase.from('notas').delete().eq('id', id);
      if (error) throw error;
      console.log('[SUPABASE] ✅ Nota excluída');
    } catch (error) {
      console.error('[SUPABASE] ❌ Erro ao excluir:', formatError(error));
      setNotes(prev => noteRemovida ? [noteRemovida, ...prev] : prev);
      if (activeNoteId === id) setActiveNoteId(id);
      alert(`Erro ao excluir nota: ${formatError(error)}`);
    }
  };

  // UPDATE (Optimistic with Debounce)
  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNoteId) return;
    const updatedNotes = notes.map(note => 
      note.id === activeNoteId 
        ? { ...note, ...updates, updatedAt: new Date() } 
        : note
    );
    setNotes(updatedNotes);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (activeNoteId.startsWith('temp-')) return;
      setIsSyncing(true);
      try {
        const noteToUpdate = updatedNotes.find(n => n.id === activeNoteId);
        if (noteToUpdate) {
            const { error } = await supabase
                .from('notas')
                .update(toSupabase(noteToUpdate))
                .eq('id', activeNoteId);
            if (error) throw error;
            console.log('[SUPABASE] ✅ Nota atualizada');
        }
      } catch (error) {
        console.error('[SUPABASE] ❌ Erro ao atualizar:', formatError(error));
      } finally {
        setIsSyncing(false);
      }
    }, 1000);
  };

  // --- Selection & Formatting logic ---
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      const editor = contentEditableRef.current;
      let isInside = false;
      while (node) {
        if (node === editor) { isInside = true; break; }
        node = node.parentNode;
      }
      if (isInside) selectionRange.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (selectionRange.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionRange.current);
      }
    } else if (contentEditableRef.current) {
        contentEditableRef.current.focus();
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    restoreSelection();
    document.execCommand(command, false, value);
    if (contentEditableRef.current) updateActiveNote({ content: contentEditableRef.current.innerHTML });
  };

  const handleFormat = (command: string) => { saveSelection(); execCommand(command); };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showLinkInput) {
        // Confirmar link com Enter ou Ctrl+Enter
        if (e.key === 'Enter') { e.preventDefault(); confirmLinkInput(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelLinkInput(); }
    } else {
        // Atalho Ctrl+Enter para ações contextuais se necessário futuramente, 
        // ou apenas para forçar sincronização se houver demanda.
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          // No editor de notas, apenas focamos o editor se não estiver focado
          if (document.activeElement !== contentEditableRef.current) {
              contentEditableRef.current?.focus();
          }
        }
    }
  };

  const startLinkInput = () => { saveSelection(); setShowLinkInput(true); setLinkValue(''); };
  const cancelLinkInput = () => { setShowLinkInput(false); setLinkValue(''); restoreSelection(); };
  const confirmLinkInput = () => {
    if (!linkValue) { cancelLinkInput(); return; }
    restoreSelection();
    execCommand('createLink', linkValue);
    setShowLinkInput(false); setLinkValue('');
  };

  const handleOpenLink = () => {
    if (selectedElement && selectedElement.tagName === 'A') {
      window.open((selectedElement as HTMLAnchorElement).href, '_blank');
    }
  };

  const handleUnlink = () => {
    if (selectedElement && selectedElement.tagName === 'A') {
      const range = document.createRange();
      range.selectNode(selectedElement);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        execCommand('unlink');
        setSelectedElement(null);
      }
    }
  };

  const handleImageClick = () => { saveSelection(); fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            restoreSelection();
            if (ev.target?.result) execCommand('insertImage', ev.target.result as string);
        };
        reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageResize = (width: string) => {
    if (selectedElement && selectedElement.tagName === 'IMG') {
        selectedElement.style.width = width;
        selectedElement.style.height = 'auto';
        if (contentEditableRef.current) updateActiveNote({ content: contentEditableRef.current.innerHTML });
    }
  };

  const handleImageAlign = (align: 'left' | 'center' | 'right') => {
      if (selectedElement && selectedElement.tagName === 'IMG') {
          selectedElement.style.display = 'block';
          selectedElement.style.marginLeft = align === 'center' || align === 'right' ? 'auto' : '0';
          selectedElement.style.marginRight = align === 'center' || align === 'left' ? 'auto' : '0';
          if (contentEditableRef.current) updateActiveNote({ content: contentEditableRef.current.innerHTML });
      }
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') { setSelectedElement(target); return; }
    const anchor = target.closest('a');
    if (anchor) { setSelectedElement(anchor); return; }
    if (!showLinkInput) setSelectedElement(null);
  };

  const filteredNotes = notes.filter(note => 
    (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (note.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-workspace-main animate-fade-in overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Sidebar */}
      <div className="w-80 border-r border-workspace-border flex flex-col bg-workspace-main shrink-0">
        <div className="p-4 border-b border-workspace-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-light text-workspace-text tracking-tight flex items-center gap-2">
              Minhas Notas
              {isSyncing && <Loader2 className="w-3 h-3 animate-spin text-workspace-accent" />}
            </h2>
            <button onClick={handleCreateNote} className="p-2 bg-workspace-accent hover:bg-workspace-accent/90 text-white rounded-md transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-workspace-muted group-focus-within:text-workspace-accent transition-colors" />
            <input 
              type="text" placeholder="Pesquisar notas..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-workspace-surface border border-workspace-border rounded-lg pl-9 pr-3 py-2 text-xs text-workspace-text placeholder-workspace-muted focus:outline-none focus:border-workspace-accent transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredNotes.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-workspace-muted opacity-60">
                <PenLine className="w-8 h-8 mb-2 stroke-[1]" />
                <span className="text-xs">Nenhuma nota encontrada</span>
             </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className={`group relative border-b border-workspace-border transition-all duration-200 border-l-2 ${activeNoteId === note.id ? 'bg-workspace-surface border-l-workspace-accent' : 'bg-transparent border-l-transparent hover:bg-workspace-surface/50'}`}>
                <div onClick={() => setActiveNoteId(note.id)} className="p-4 cursor-pointer w-full select-none">
                    <div className="flex justify-between items-start mb-1.5">
                        <h3 className={`text-sm font-semibold truncate pr-8 ${activeNoteId === note.id ? 'text-workspace-text' : 'text-workspace-text/90'}`}>{note.title || 'Sem Título'}</h3>
                    </div>
                    <div className="text-xs text-workspace-muted line-clamp-2 h-8 overflow-hidden font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: (note.content || '').replace(/<[^>]+>/g, ' ') || 'Sem conteúdo...' }} />
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-workspace-muted font-medium opacity-60">
                            {note.updatedAt instanceof Date && !isNaN(note.updatedAt.getTime()) ? note.updatedAt.toLocaleDateString('pt-BR') : 'Data inválida'}
                        </span>
                        {activeNoteId === note.id && <div className="w-1.5 h-1.5 rounded-full bg-workspace-accent" />}
                    </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="absolute top-4 right-4 z-10 p-1.5 rounded-md text-workspace-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"
                  title="Excluir nota"
                >
                    <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      {activeNote ? (
        <div className="flex-1 flex flex-col h-full bg-workspace-surface/50 relative">
          <div className="h-12 border-b border-workspace-border flex items-center px-6 gap-2 bg-workspace-main shrink-0 overflow-hidden relative shadow-sm z-10">
             {showLinkInput ? (
               <div className="flex items-center gap-2 w-full animate-fade-in">
                 <span className="text-xs font-medium text-workspace-muted uppercase tracking-wider min-w-[60px]">URL:</span>
                 <input autoFocus type="text" value={linkValue} onChange={(e) => setLinkValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Cole seu link aqui..." className="flex-1 bg-workspace-surface border border-workspace-border rounded px-2 py-1 text-sm text-workspace-text focus:border-workspace-accent focus:outline-none" />
                 <button onClick={confirmLinkInput} className="p-1 text-emerald-500 hover:bg-workspace-surface rounded" title="Enter para confirmar"><Check className="w-4 h-4" /></button>
                 <button onClick={cancelLinkInput} className="p-1 text-red-500 hover:bg-workspace-surface rounded" title="Esc para cancelar"><X className="w-4 h-4" /></button>
               </div>
             ) : selectedElement?.tagName === 'IMG' ? (
                <div className="flex items-center gap-2 w-full animate-fade-in">
                    <span className="text-xs font-medium text-workspace-muted uppercase tracking-wider flex items-center gap-2 border-r border-workspace-border pr-2 mr-2"><ImageIcon className="w-4 h-4" /> Imagem</span>
                    <div className="flex items-center gap-1">
                        <ToolButton icon={AlignLeft} onClick={() => handleImageAlign('left')} label="Esq" />
                        <ToolButton icon={AlignCenter} onClick={() => handleImageAlign('center')} label="Cen" />
                        <ToolButton icon={AlignRight} onClick={() => handleImageAlign('right')} label="Dir" />
                    </div>
                    <div className="w-[1px] h-4 bg-workspace-border mx-2" />
                    <div className="flex items-center gap-1 text-xs text-workspace-text">
                        <button onClick={() => handleImageResize('25%')} className="px-2 py-1 hover:bg-workspace-surface rounded">25%</button>
                        <button onClick={() => handleImageResize('50%')} className="px-2 py-1 hover:bg-workspace-surface rounded">50%</button>
                        <button onClick={() => handleImageResize('100%')} className="px-2 py-1 hover:bg-workspace-surface rounded">100%</button>
                    </div>
                    <button onClick={() => setSelectedElement(null)} className="ml-auto p-1 text-workspace-muted hover:text-workspace-text"><X className="w-4 h-4" /></button>
                </div>
             ) : selectedElement?.tagName === 'A' ? (
                <div className="flex items-center gap-3 w-full animate-fade-in bg-blue-50/50 dark:bg-blue-900/20 -mx-6 px-6 h-full">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2 border-r border-blue-200 dark:border-blue-800 pr-3 mr-1"><LinkIcon className="w-4 h-4" /> Link</span>
                    <span className="text-xs text-workspace-muted truncate max-w-[200px] hidden md:block italic">{(selectedElement as HTMLAnchorElement).href}</span>
                    <button onClick={handleOpenLink} className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow-sm ml-auto"><ExternalLink className="w-3 h-3" /> Abrir</button>
                    <button onClick={handleUnlink} className="flex items-center gap-2 px-3 py-1 bg-workspace-surface border border-workspace-border hover:bg-red-50 hover:text-red-500 text-workspace-text text-xs rounded"><Unlink className="w-3 h-3" /> Remover</button>
                    <button onClick={() => setSelectedElement(null)} className="p-1 text-workspace-muted hover:text-workspace-text"><X className="w-4 h-4" /></button>
                </div>
             ) : (
               <>
                 <ToolButton icon={Bold} onClick={() => handleFormat('bold')} label="Negrito" />
                 <ToolButton icon={Italic} onClick={() => handleFormat('italic')} label="Itálico" />
                 <ToolButton icon={Underline} onClick={() => handleFormat('underline')} label="Sublinhado" />
                 <div className="w-[1px] h-4 bg-workspace-border mx-2" />
                 <ToolButton icon={LinkIcon} onClick={startLinkInput} label="Link" />
                 <ToolButton icon={ImageIcon} onClick={handleImageClick} label="Imagem" />
               </>
             )}
          </div>
          <div className="px-8 pt-8 pb-4">
            <input type="text" value={activeNote.title} onChange={(e) => updateActiveNote({ title: e.target.value })} onKeyDown={handleKeyDown} className="w-full text-3xl font-light text-workspace-text bg-transparent border-none outline-none placeholder-workspace-muted/40" placeholder="Título da Nota" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-12 cursor-text" onClick={() => { if (document.activeElement !== contentEditableRef.current && !showLinkInput && !selectedElement) contentEditableRef.current?.focus(); }}>
            <div ref={contentEditableRef} className={`w-full h-full outline-none text-workspace-text text-base leading-relaxed font-light prose prose-sm dark:prose-invert max-w-none border-l-2 border-transparent pl-6 transition-colors focus:border-l-workspace-accent ${selectedElement?.tagName === 'IMG' ? 'selection:bg-transparent' : ''}`} contentEditable onInput={(e) => updateActiveNote({ content: e.currentTarget.innerHTML })} onKeyDown={handleKeyDown} onKeyUp={saveSelection} onMouseUp={saveSelection} onClick={handleEditorClick} suppressContentEditableWarning={true} style={{ minHeight: '50vh' }} data-placeholder="Comece a escrever aqui..." />
          </div>
          <div className="px-6 py-2 border-t border-workspace-border text-[10px] text-workspace-muted flex justify-between items-center bg-workspace-main">
              <div className="flex gap-4">
                <span>{(activeNote.content || '').replace(/<[^]*>/g, '').length} caracteres</span>
                {isSyncing ? <span className="text-workspace-accent animate-pulse">Salvando...</span> : <span>Salvo</span>}
              </div>
              <span>Última edição: {activeNote.updatedAt instanceof Date && !isNaN(activeNote.updatedAt.getTime()) ? activeNote.updatedAt.toLocaleTimeString() : '--:--'}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-workspace-muted bg-workspace-surface/30">
          <StickyNote className="w-16 h-16 mb-4 opacity-10" />
          <p className="font-light">Selecione uma nota ou crie uma nova para começar.</p>
        </div>
      )}
    </div>
  );
};

export default Notes;