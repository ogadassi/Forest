import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Responsive } from 'react-grid-layout';
import type { CategoryModel } from '../../models/CategoryModel';
import type { NoteModel } from '../../models/NoteModel';
import { NoteCard } from './NoteCard';
import { searchIcons } from '../../data/materialIcons';
import { categoryService } from '../../services/CategoryService';
import { noteService } from '../../services/NoteService';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const ResponsiveGridLayout = Responsive as any;

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

interface GridItem {
    i: string; x: number; y: number;
    w: number; h: number; minW?: number; minH?: number;
}
type Layouts = { [breakpoint: string]: GridItem[] };

function loadNoteLayouts(categoryId: number): Layouts {
    try { return JSON.parse(localStorage.getItem(`forest-notes-layout-v2-${categoryId}`) ?? '{}'); } catch { return {}; }
}
function saveNoteLayouts(categoryId: number, layouts: Layouts) {
    localStorage.setItem(`forest-notes-layout-v2-${categoryId}`, JSON.stringify(layouts));
}

function buildDefaultNoteLayouts(notes: NoteModel[], existing: Layouts): Layouts {
    const newLayouts: Layouts = { lg: [], md: [], sm: [], xs: [], xxs: [] };
    ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => {
        const base = existing[bp] || [];
        const existingIds = new Set(base.map(l => l.i));
        const missing = notes.filter(n => !existingIds.has(String(n.id)));
        const validBase = base.filter(l => notes.some(n => String(n.id) === l.i));

        let w = 4;
        if (bp === 'md') w = 5;
        if (bp === 'sm') w = 6;
        if (bp === 'xs' || bp === 'xxs') w = COLS[bp as keyof typeof COLS];

        const colsForBp = COLS[bp as keyof typeof COLS];
        const itemsPerRow = Math.max(1, Math.floor(colsForBp / w));

        const newItems: GridItem[] = missing.map((note, idx) => ({
            i: String(note.id),
            x: ((validBase.length + idx) % itemsPerRow) * w,
            y: Math.floor((validBase.length + idx) / itemsPerRow) * 9,
            w, h: 8, minW: 1, minH: 2,
        }));
        newLayouts[bp] = [...validBase, ...newItems];
    });
    return newLayouts;
}

interface CategoryPanelProps {
    category: CategoryModel;
    notes: NoteModel[];
    onNoteClick: (note: NoteModel) => void;
    onRename: (newName: string) => void;
    onDelete: () => void;
    onAddNoteClick?: () => void;
    isFullscreenView?: boolean;
    onHeaderClick?: () => void;
    onRefreshNotes?: () => void;
}

const PRESET_COLORS = [
    '#5dbb6a', '#4f8ef7', '#f7874f', '#f7cf4f',
    '#c44ff7', '#f74f7a', '#4ff7e8', '#f7f74f',
    '#a0aec0', '#fc8181',
];

const SortableChecklistItem = ({ note, color, onToggle, onDelete }: { note: NoteModel, color: string, onToggle: (e: React.MouseEvent) => void, onDelete: (e: React.MouseEvent) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id! });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        borderColor: isDragging ? color : `${color}30`,
        backgroundColor: `${color}0A`, // Very subtle background tint
    };
    const displayText = (note.content as string) || note.title;
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center justify-between gap-3 border ${isDragging ? 'shadow-xl z-50 relative' : ''} hover:bg-white/5 rounded-xl px-4 py-3 transition-colors`}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}60`; }}
            onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.borderColor = `${color}30`; }}
        >

            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:text-white mr-1 flex-shrink-0 touch-none flex items-center justify-center transition-colors" style={{ color: `${color}80` }}>
                <span className="material-icons-round text-sm">drag_indicator</span>
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    className="w-5 h-5 rounded flex items-center justify-center border-[1.5px] hover:border-primary shrink-0 transition-colors bg-background-dark shadow-sm"
                    style={note.isCompleted ? { backgroundColor: color, borderColor: color } : { borderColor: `${color}80` }}
                    onClick={onToggle}
                >
                    <span className={`material-icons-round text-[14px] font-black transition-opacity ${note.isCompleted ? 'opacity-100 text-background-dark' : 'opacity-0'}`}>check</span>
                </button>
                <span
                    title={displayText}
                    className={`flex-1 text-[13px] leading-tight font-medium transition-all ${note.isCompleted ? 'line-through opacity-50 text-slate-500' : 'text-slate-200'} whitespace-pre-wrap break-words`}
                >
                    {displayText}
                </span>
            </div>

            <button
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                style={{ color: `${color}80` }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = `${color}80`; }}
                title="Delete Item"
                onClick={onDelete}
            >
                <span className="material-icons-round text-sm">delete</span>
            </button>
        </div>
    );
};

export const CategoryPanel: React.FC<CategoryPanelProps> = ({
    category, notes, onNoteClick, onRename, onDelete, onAddNoteClick, isFullscreenView, onHeaderClick, onRefreshNotes
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [showChecklistInput, setShowChecklistInput] = useState(false);
    const [newName, setNewName] = useState(category.name);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const checklistInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (showChecklistInput && checklistInputRef.current) {
            checklistInputRef.current.focus();
        }
    }, [showChecklistInput]);

    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [iconResults, setIconResults] = useState<string[]>([]);
    const iconSearchRef = useRef<HTMLInputElement>(null);

    const color = category.color || '#5DBB6A';
    const icon = category.icon || 'folder';

    useEffect(() => {
        setIconResults(searchIcons(iconSearch));
    }, [iconSearch]);

    const [layouts, setLayouts] = useState<Layouts>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!isFullscreenView) return;
        const saved = loadNoteLayouts(category.id!);
        if (saved && Object.keys(saved).length > 0) {
            const reconciled = { ...saved };
            Object.keys(BREAKPOINTS).forEach(bp => {
                if (reconciled[bp]) {
                    reconciled[bp] = reconciled[bp].map(item => ({ ...item, minW: 1, minH: 2 }));
                }
            });
            setLayouts(reconciled);
        } else {
            const initial = buildDefaultNoteLayouts(notes, {});
            setLayouts(initial);
        }
    }, [category.id, notes.length, isFullscreenView]);

    useLayoutEffect(() => {
        if (!isFullscreenView) return;
        const el = containerRef.current;
        if (!el) return;
        setContainerWidth(el.offsetWidth);
        const ro = new ResizeObserver(entries => {
            setContainerWidth(entries[0].contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [isFullscreenView]);

    const [sortedNotes, setSortedNotes] = useState<NoteModel[]>(notes);
    useEffect(() => {
        setSortedNotes([...notes].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }, [notes]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over?.id) {
            const oldIndex = sortedNotes.findIndex(n => n.id === active.id);
            const newIndex = sortedNotes.findIndex(n => n.id === over.id);
            const newArray = arrayMove(sortedNotes, oldIndex, newIndex);
            setSortedNotes(newArray);
            const updates = newArray.map((note, index) => ({ id: note.id!, order: index }));
            try {
                await noteService.reorderNotes(updates);
            } catch (err) {
                console.error("Failed to save reorder", err);
                setSortedNotes([...notes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            }
        }
    };

    const handleLayoutChange = useCallback((_currentLayout: readonly GridItem[], allLayouts: any) => {
        setLayouts(prev => {
            const merged = { ...prev };
            Object.keys(allLayouts).forEach(bp => {
                const currentArr = allLayouts[bp] as GridItem[];
                const unseen = (merged[bp] || []).filter(oldItem => !currentArr.find(a => a.i === oldItem.i));
                merged[bp] = [...currentArr, ...unseen];
            });
            saveNoteLayouts(category.id!, merged);
            return merged;
        });
    }, [category.id]);

    const handleUpdateInline = async (updates: Partial<CategoryModel>) => {
        const updatedCat = { ...category, ...updates };
        try {
            await categoryService.updateCategory(updatedCat);
        } catch (error) {
            console.error('Failed inline update:', error);
        }
    };

    const handleSubmitRename = (e?: React.FormEvent | MouseEvent) => {
        e?.preventDefault();
        if (newName.trim() && newName !== category.name) onRename(newName.trim());
        else setNewName(category.name);
        setIsEditing(false);
    };

    useEffect(() => {
        if (!confirmDelete && !showIconPicker && !showColorPicker && !isEditing) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (confirmDelete) setConfirmDelete(false);
            if (showIconPicker) setShowIconPicker(false);
            if (showColorPicker) setShowColorPicker(false);
            if (isEditing) handleSubmitRename(e);
        };
        document.addEventListener('click', handleOutsideClick);
        return () => { document.removeEventListener('click', handleOutsideClick); };
    }, [confirmDelete, showIconPicker, showColorPicker, isEditing, newName, category.name]);

    return (
        <div
            className={`category-panel-root h-full flex flex-col rounded-2xl overflow-hidden select-none relative ${isFullscreenView ? '' : 'cursor-pointer'}`}
            onClick={!isFullscreenView ? onHeaderClick : undefined}
            style={{
                containerType: 'size',
                background: `linear-gradient(160deg, ${color}30 0%, rgba(26,32,27,0.6) 60%), #1e261f`,
                border: `1px solid ${color}40`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 ${color}30`,
            }}
        >
            <div
                className="panel-header flex items-center px-4 py-3 shrink-0 relative"
                style={{ borderBottom: `1px solid ${color}18` }}
            >
                {!isFullscreenView && (
                    <div
                        className="panel-drag-handle drag-handle pr-2 mr-1 cursor-grab active:cursor-grabbing flex items-center justify-center h-full opacity-30 hover:opacity-70 transition-opacity flex-shrink-0"
                        style={{ color }}
                        title="Drag to move"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="material-icons-round text-base hover:scale-110 active:scale-95 transition-transform">drag_indicator</span>
                    </div>
                )}
                <div
                    className="non-draggable flex-1 flex items-center gap-2.5 min-w-0 group"
                    title={isFullscreenView ? '' : 'Click to open fullscreen'}
                >
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowIconPicker(!showIconPicker); }}
                            className="w-8 h-8 flex items-center justify-center shrink-0 rounded-xl hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
                            title="Change icon"
                        >
                            <span className="material-icons-round text-sm" style={{ color }}>{icon}</span>
                        </button>
                        {showIconPicker && (
                            <div
                                className="absolute top-10 left-0 bg-card-dark border border-border-dark rounded-xl shadow-2xl z-50 p-3 w-[260px] animate-in fade-in zoom-in-95 duration-200"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative mb-2">
                                    <span className="material-icons-round absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">search</span>
                                    <input
                                        ref={iconSearchRef}
                                        autoFocus
                                        type="text"
                                        placeholder="Search icons..."
                                        className="w-full bg-background-dark border border-border-dark rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 outline-none focus:border-primary truncate"
                                        value={iconSearch}
                                        onChange={e => setIconSearch(e.target.value)}
                                    />
                                </div>
                                <div className="h-32 overflow-y-auto custom-scrollbar bg-background-dark rounded-lg border border-border-dark p-1.5 grid grid-cols-6 gap-1 mt-2">
                                    {iconResults.length > 0 ? iconResults.map(resIcon => (
                                        <button
                                            key={resIcon}
                                            type="button"
                                            onClick={() => { handleUpdateInline({ icon: resIcon }); setShowIconPicker(false); }}
                                            className={`aspect-square rounded-md flex items-center justify-center hover:scale-110 ${icon === resIcon ? 'text-background-dark' : 'text-slate-400 hover:text-white'}`}
                                            style={icon === resIcon ? { backgroundColor: color } : {}}
                                            title={resIcon.replace(/_/g, ' ')}
                                        >
                                            <span className="material-icons-round text-sm">{resIcon}</span>
                                        </button>
                                    )) : (
                                        <div className="col-span-6 flex items-center justify-center text-xs text-slate-500 py-4">No icons found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0" onClick={e => isEditing ? e.stopPropagation() : undefined}>
                        {isEditing ? (
                            <form onSubmit={handleSubmitRename} className="w-full">
                                <input
                                    autoFocus
                                    className="w-full bg-transparent text-slate-100 font-bold text-sm outline-none border-b pb-px"
                                    style={{ borderColor: color }}
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onBlur={handleSubmitRename}
                                    onKeyDown={e => e.stopPropagation()}
                                />
                            </form>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span
                                    className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors truncate cursor-text"
                                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                    title="Click to rename category"
                                >
                                    {category.name}
                                </span>
                            </div>
                        )}
                    </div>
                    <span
                        className="panel-note-count text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 group-hover:bg-white/10 transition-colors"
                        style={{ color, background: `${color}18` }}
                    >
                        {notes.length}
                    </span>
                </div>
                <div className="panel-options non-draggable relative ml-2 shrink-0 flex items-center gap-1" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                    <div className="relative">
                        <button
                            onClick={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
                            title="Change color"
                        >
                            <span className="material-icons-round text-sm" style={{ color: color || '#94a3b8' }}>palette</span>
                        </button>
                        {showColorPicker && (
                            <div
                                className="absolute top-10 right-0 bg-card-dark border border-border-dark rounded-2xl shadow-2xl z-50 p-4 w-[200px] animate-in fade-in slide-in-from-top-2 duration-200"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Color</div>
                                <div className="grid grid-cols-5 gap-2">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => { handleUpdateInline({ color: c }); setShowColorPicker(false); }}
                                            className="w-8 h-8 rounded-xl transition-all hover:scale-110 relative flex items-center justify-center border border-white/5"
                                            style={{
                                                backgroundColor: c,
                                                boxShadow: color.toLowerCase() === c ? `0 0 0 2px ${c}99, 0 0 10px ${c}aa` : 'none',
                                                transform: color.toLowerCase() === c ? 'scale(1.15)' : 'none'
                                            }}
                                            title={`Set color to ${c}`}
                                        >
                                            {color.toLowerCase() === c && <span className="material-icons-round text-white text-[12px]">check</span>}
                                        </button>
                                    ))}
                                    <label
                                        className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform overflow-hidden border border-white/10"
                                        title="Custom color"
                                        style={{
                                            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                                        }}
                                    >
                                        <input
                                            type="color"
                                            className="opacity-0 absolute w-0 h-0"
                                            value={color}
                                            onChange={e => handleUpdateInline({ color: e.target.value })}
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                    {confirmDelete ? (
                        <>
                            <span className="text-xs text-red-400 font-semibold ml-1">Delete?</span>
                            <button
                                onPointerDown={e => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                                className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-all"
                            >Cancel</button>
                            <button
                                onPointerDown={e => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); onDelete(); }}
                                className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 rounded-lg transition-all"
                            >Delete</button>
                        </>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                            onPointerDown={e => e.stopPropagation()}
                            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all active:scale-90"
                            title="Delete category"
                        >
                            <span className="material-icons-round text-sm">delete</span>
                        </button>
                    )}
                    {isFullscreenView && (
                        <button
                            onClick={() => { if (onHeaderClick) onHeaderClick(); }}
                            className="w-8 h-8 ml-1 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
                            title="Minimize category"
                        >
                            <span className="material-icons-round text-sm">remove</span>
                        </button>
                    )}
                </div>
            </div >

            <div
                className={`non-draggable flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar ${isFullscreenView ? '' : 'space-y-2'}`}
                ref={isFullscreenView ? containerRef : undefined}
            >
                {category.type === 'checklist' ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 pb-4">
                            {sortedNotes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500/80 py-10 opacity-80 animate-in fade-in">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-card-dark/50 shadow-inner border border-white/5">
                                        <span className="material-icons-round text-2xl opacity-70">checklist</span>
                                    </div>
                                    <span className="text-xs text-slate-500/80 font-medium">No items yet. Add one below.</span>
                                </div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                                    <SortableContext items={sortedNotes.map(n => n.id!)} strategy={verticalListSortingStrategy}>
                                        {sortedNotes.map(note => (
                                            <SortableChecklistItem
                                                key={note.id}
                                                note={note}
                                                color={color}
                                                onToggle={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await noteService.updateNote({ ...note, isCompleted: !note.isCompleted });
                                                        if (onRefreshNotes) onRefreshNotes();
                                                    } catch (err) { }
                                                }}
                                                onDelete={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await noteService.deleteNote(note.id!);
                                                        if (onRefreshNotes) onRefreshNotes();
                                                    } catch (err) { }
                                                }}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                        {showChecklistInput && (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const trimmedText = newItemTitle.trim();
                                    if (!trimmedText || isAddingItem) {
                                        setShowChecklistInput(false);
                                        return;
                                    }
                                    setIsAddingItem(true);
                                    try {
                                        const newNote: NoteModel = {
                                            title: trimmedText.substring(0, 50),
                                            content: trimmedText,
                                            contentType: 'text',
                                            categoryId: category.id!,
                                            isCompleted: false,
                                            attachments: []
                                        };
                                        await noteService.addNote(newNote);
                                        setNewItemTitle('');
                                        setShowChecklistInput(false);
                                        if (onRefreshNotes) onRefreshNotes();
                                    } catch (err) {
                                        console.error("Failed to add checklist item", err);
                                    } finally {
                                        setIsAddingItem(false);
                                    }
                                }}
                                className="bg-background-dark/80 border border-primary/40 rounded-xl px-4 py-3 flex items-center gap-3 mt-3 shrink-0 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-bottom-2 duration-200"
                            >
                                <span className="material-icons-round text-primary text-lg">add_task</span>
                                <input
                                    ref={checklistInputRef}
                                    type="text"
                                    className="bg-transparent border-none outline-none text-[13px] text-slate-200 w-full placeholder-slate-500 font-medium"
                                    placeholder="Add a new checklist item..."
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                    disabled={isAddingItem}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            if (!newItemTitle.trim()) {
                                                setShowChecklistInput(false);
                                            }
                                        }, 100);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') {
                                            setShowChecklistInput(false);
                                            setNewItemTitle('');
                                        }
                                        e.stopPropagation();
                                    }}
                                />
                            </form>
                        )}
                    </div>
                ) : notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 py-10 opacity-80 animate-in fade-in">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-card-dark/50 shadow-inner border border-white/5">
                            <span className="material-icons-round text-2xl opacity-70">inbox</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-sm font-semibold tracking-wide text-slate-400">Empty Category</span>
                            <span className="text-xs text-slate-500/80">No notes here yet.</span>
                        </div>
                    </div>
                ) : isFullscreenView && containerWidth > 0 ? (
                    <ResponsiveGridLayout
                        className="layout min-h-full pb-20 animate-fade-in"
                        layouts={layouts}
                        breakpoints={BREAKPOINTS}
                        cols={COLS}
                        rowHeight={60}
                        onLayoutChange={handleLayoutChange}
                        isDraggable={!isEditing}
                        isResizable={!isEditing}
                        dragConfig={{ handle: '.drag-handle', cancel: '.non-draggable' }}
                        resizeConfig={{ handles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'] }}
                        margin={[16, 16]}
                        containerPadding={[0, 0]}
                        width={containerWidth}
                        useCSSTransforms={true}
                        measureBeforeMount={false}
                        onDragStart={() => setIsDragging(true)}
                        onDragStop={() => setTimeout(() => setIsDragging(false), 50)}
                    >
                        {notes.map(note => {
                            const lgLayout = layouts.lg?.find(l => l.i === String(note.id));
                            const dataGrid = lgLayout ? { ...lgLayout } : { x: 0, y: 0, w: 4, h: 8 };
                            return (
                                <div key={note.id} data-grid={dataGrid} className="relative group">
                                    <div
                                        className="panel-drag-handle drag-handle absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center"
                                        title="Drag to move"
                                        onClick={e => e.stopPropagation()}
                                        onPointerDown={e => e.stopPropagation()}
                                    >
                                        <span className="material-icons-round text-sm text-slate-400">drag_indicator</span>
                                    </div>
                                    <div
                                        className="h-full cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isDragging) onNoteClick(note);
                                        }}
                                    >
                                        <NoteCard note={note} hasLeftHandle onClick={() => { }} />
                                    </div>
                                </div>
                            );
                        })}
                    </ResponsiveGridLayout>
                ) : (
                    notes.map(note => (
                        <div key={note.id} onClick={(e) => { e.stopPropagation(); }}>
                            <NoteCard note={note} onClick={() => onNoteClick(note)} />
                        </div>
                    ))
                )}
            </div>

            {onAddNoteClick && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (category.type === 'checklist') {
                            setShowChecklistInput(prev => !prev);
                        } else {
                            onAddNoteClick();
                        }
                    }}
                    className={`absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-background-dark shadow-xl bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all outline-none ${showChecklistInput ? 'rotate-45 opacity-70' : ''}`}
                    style={{ backgroundColor: color }}
                    title={category.type === 'checklist' ? (showChecklistInput ? "Cancel Action" : "Quick Add Item") : "Add Note"}
                >
                    <span className="material-icons-round text-xl">add</span>
                </button>
            )}
        </div>
    );
};
