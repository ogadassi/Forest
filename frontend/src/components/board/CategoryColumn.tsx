import React, { useState } from 'react';
import type { CategoryModel } from '../../models/CategoryModel';
import type { NoteModel } from '../../models/NoteModel';
import { NoteCard } from './NoteCard';

interface CategoryColumnProps {
    category: CategoryModel;
    notes: NoteModel[];
    onNoteClick: (note: NoteModel) => void;
    onExpand: () => void;
    onRename: (newName: string) => void;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({ category, notes, onNoteClick, onExpand, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(category.name);

    const handleSubmitRename = (e: React.FormEvent) => {
        e.preventDefault();
        onRename(newName);
        setIsEditing(false);
    };

    return (
        <div className="w-80 flex-shrink-0 h-full flex flex-col border-r border-border-dark/50 bg-[#1a201b]">
            <div className="p-4 border-b border-border-dark/50 flex items-center justify-between sticky top-0 bg-[#1a201b]/95 backdrop-blur z-10 group">
                <div className="flex items-center gap-2 flex-1">
                    {isEditing ? (
                        <form onSubmit={handleSubmitRename} className="flex-1">
                            <input
                                autoFocus
                                className="w-full bg-card-dark text-slate-200 font-bold text-sm uppercase tracking-wider px-1 rounded border border-primary outline-none"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onBlur={handleSubmitRename}
                            />
                        </form>
                    ) : (
                        <h2
                            onClick={() => setIsEditing(true)}
                            className="font-bold text-sm text-slate-200 uppercase tracking-wider cursor-text hover:text-white transition-colors truncate"
                            title="Click to rename"
                        >
                            {category.name}
                        </h2>
                    )}

                    {!isEditing && <span className="text-xs text-slate-500 font-mono bg-card-dark px-1.5 rounded">{notes.length}</span>}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onExpand} className="text-slate-500 hover:text-primary transition-colors p-1" title="Expand / Focus">
                        <span className="material-icons-round text-sm">open_in_full</span>
                    </button>
                    <button className="text-slate-500 hover:text-primary transition-colors p-1">
                        <span className="material-icons-round text-sm">more_horiz</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* Masonry effect via CSS columns if desired, or just stack */}
                <div className="columns-1 gap-4 space-y-4">
                    {notes.map(note => (
                        <NoteCard key={note.id} note={note} onClick={() => onNoteClick(note)} />
                    ))}
                </div>
            </div>
        </div>
    );
};
