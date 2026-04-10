import React, { useState, useRef, useEffect } from 'react';
import type { CategoryModel } from '../../models/CategoryModel';
import type { NoteModel } from '../../models/NoteModel';
import { noteService } from '../../services/NoteService';
import { useCategoryDrag } from './useCategoryDrag';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const SortableChecklistItem = ({ note, color, onToggle, onDelete, isEditing, editValue, onEditChange, onEditSave, onEditCancel, onStartEdit }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id! });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        borderColor: isDragging ? color : isEditing ? `${color}80` : `${color}30`,
        backgroundColor: isEditing ? `${color}12` : `${color}0A`,
    };
    const displayText = (note.content as string) || note.title;
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center justify-between gap-3 border ${isDragging ? 'shadow-xl z-50 relative' : ''} hover:bg-white/5 rounded-xl px-4 py-3 transition-colors`}
            onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.borderColor = `${color}60`; }}
            onMouseLeave={(e) => { if (!isDragging && !isEditing) e.currentTarget.style.borderColor = `${color}30`; }}
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
                {isEditing ? (
                    <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={e => onEditChange(e.target.value)}
                        onBlur={onEditSave}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); onEditSave(); }
                            if (e.key === 'Escape') { e.preventDefault(); onEditCancel(); }
                            e.stopPropagation();
                        }}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-slate-200 min-w-0"
                    />
                ) : (
                    <span
                        title={displayText}
                        onClick={e => { e.stopPropagation(); onStartEdit(); }}
                        className={`flex-1 text-[13px] leading-tight font-medium transition-all cursor-text select-none ${note.isCompleted ? 'line-through opacity-50 text-slate-500' : 'text-slate-200'} whitespace-pre-wrap break-words`}
                    >
                        {displayText}
                    </span>
                )}
            </div>
            {!isEditing && (
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
            )}
        </div>
    );
};

interface ChecklistListProps {
    category: CategoryModel;
    color: string;
    notes: NoteModel[];
    onRefreshNotes?: () => void;
    checklistItemsRef: React.RefObject<HTMLDivElement>;
    checklistAddBarRef: React.RefObject<HTMLFormElement | HTMLButtonElement>;
}

export const ChecklistList: React.FC<ChecklistListProps> = ({ category, color, notes, onRefreshNotes, checklistItemsRef, checklistAddBarRef }) => {
    const { sortedNotes, sensors, handleDragEnd } = useCategoryDrag(notes);
    
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
    const [showChecklistInput, setShowChecklistInput] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    
    const checklistInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (showChecklistInput && checklistInputRef.current) {
            checklistInputRef.current.focus();
        }
    }, [showChecklistInput]);

    const handleStartEdit = (note: NoteModel) => {
        setEditingNoteId(note.id!);
        setEditingText((note.content as string) || note.title || '');
    };

    const handleSaveEdit = async (note: NoteModel) => {
        const trimmed = editingText.trim();
        if (trimmed && trimmed !== ((note.content as string) || note.title)) {
            try {
                await noteService.updateNote({ ...note, title: trimmed.substring(0, 50), content: trimmed });
                if (onRefreshNotes) onRefreshNotes();
            } catch (err) { console.error('Failed to update checklist item', err); }
        }
        setEditingNoteId(null);
    };

    const handleCancelEdit = () => setEditingNoteId(null);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 flex flex-col">
                {sortedNotes.length === 0 ? (
                    <div className="empty-checklist-state flex flex-col items-center justify-center gap-2 text-slate-500/80 my-auto opacity-80 animate-in fade-in">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-card-dark/50 shadow-inner border border-white/5">
                            <span className="material-icons-round text-2xl opacity-70">checklist</span>
                        </div>
                        <span className="text-xs text-slate-500/80 font-medium">No items yet. Add one below.</span>
                    </div>
                ) : (
                    <div ref={checklistItemsRef} className="my-auto w-full py-0.5">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                            <SortableContext items={sortedNotes.map(n => n.id!)} strategy={verticalListSortingStrategy}>
                                {sortedNotes.map(note => (
                                    <SortableChecklistItem
                                        key={note.id}
                                        note={note}
                                        color={color}
                                        isEditing={editingNoteId === note.id}
                                        editValue={editingNoteId === note.id ? editingText : ''}
                                        onEditChange={setEditingText}
                                        onStartEdit={() => handleStartEdit(note)}
                                        onEditSave={() => handleSaveEdit(note)}
                                        onEditCancel={handleCancelEdit}
                                        onToggle={async (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            try {
                                                await noteService.updateNote({ ...note, isCompleted: !note.isCompleted });
                                                if (onRefreshNotes) onRefreshNotes();
                                            } catch (err) { }
                                        }}
                                        onDelete={async (e: React.MouseEvent) => {
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
                    </div>
                )}
            </div>
            {showChecklistInput ? (
                <form
                    ref={checklistAddBarRef as React.RefObject<HTMLFormElement>}
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
                    onClick={e => e.stopPropagation()}
                    className="border-t flex items-center gap-3 px-4 py-2 shrink-0"
                    style={{ borderColor: `${color}30` }}
                >
                    <span className="material-icons-round text-lg" style={{ color }}>{isAddingItem ? 'hourglass_empty' : 'add_task'}</span>
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
                                if (!newItemTitle.trim()) setShowChecklistInput(false);
                            }, 100);
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Escape') { setShowChecklistInput(false); setNewItemTitle(''); }
                            e.stopPropagation();
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => { setShowChecklistInput(false); setNewItemTitle(''); }}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                    >
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                </form>
            ) : (
                <button
                    ref={checklistAddBarRef as React.RefObject<HTMLButtonElement>}
                    type="button"
                    onClick={e => { e.stopPropagation(); setShowChecklistInput(true); }}
                    className="border-t w-full flex items-center gap-3 px-4 py-2 shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                    style={{ borderColor: `${color}20` }}
                >
                    <span className="material-icons-round text-base transition-colors" style={{ color: `${color}80` }}>add</span>
                    <span className="text-[13px] font-medium">Add item</span>
                </button>
            )}
        </div>
    );
};
