import React, { useState, useEffect, useRef } from 'react';
import type { NoteModel } from '../../models/NoteModel';
import { noteService } from '../../services/NoteService';

interface EditNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNoteUpdated: () => void;
    note: NoteModel | null;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({ isOpen, onClose, onNoteUpdated, note }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [priority, setPriority] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content, isOpen]);

    useEffect(() => {
        if (note && isOpen) {
            setTitle(note.title);
            const contentStr = typeof note.content === 'string'
                ? note.content
                : JSON.stringify(note.content, null, 2);
            setContent(contentStr);
            setCategoryId(note.categoryId);
            setPriority(note.priority);
            setIsSubmitting(false);
        }
    }, [note, isOpen]);

    const handleSubmit = async () => {
        if (!categoryId || !note?.id) return;
        if (!title.trim() && !content.trim()) return;

        setIsSubmitting(true);
        const updatedNote: NoteModel = {
            ...note,
            title: title.trim() || 'Untitled Note',
            content,
            categoryId: Number(categoryId),
            priority,
        };

        try {
            await noteService.updateNote(updatedNote);
            onNoteUpdated();
            onClose();
        } catch (error) {
            console.error("Failed to update note", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!note?.id || !window.confirm("Are you sure you want to delete this note?")) return;

        try {
            await noteService.deleteNote(note.id);
            onNoteUpdated();
            onClose();
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    if (!isOpen || !note) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-8" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
            <div
                className="bg-[#242c26] w-full max-w-4xl h-full max-h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-2.5 text-[#5dbb6a]">
                        <span className="material-icons-round text-lg">edit_document</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#63846b]">EDITING NODE</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-400/10" title="Delete Note">
                            <span className="material-icons-round text-[18px]">delete</span>
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1"></div>
                        <button className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5" title="Pin Note">
                            <span className="material-icons-round text-[18px]">{note.isPinned ? "push_pin" : "push_pin"}</span>
                        </button>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5" title="Close">
                            <span className="material-icons-round text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-10 relative">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Title */}
                        <input
                            type="text"
                            placeholder="Title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-4xl font-black text-slate-100 placeholder-slate-600 transition-colors"
                        />

                        {/* Content area */}
                        <textarea
                            ref={textareaRef}
                            placeholder="Start typing your note here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-[15px] leading-relaxed text-slate-300 placeholder-slate-600 resize-none overflow-hidden min-h-[300px]"
                        />

                        {/* Optional purely visual tags section to match Figma (Stubs) */}
                        <div className="flex items-center gap-3 pt-8 pb-4 border-t border-white/5 mt-10">
                            {/* <div className="px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold text-[#5dbb6a] bg-[#5dbb6a]/10 flex items-center gap-1.5 cursor-pointer hover:bg-[#5dbb6a]/20">
                                #HEMA <span className="material-icons-round text-[12px] opacity-70">close</span>
                            </div> */}
                            <button className="px-3 py-1.5 rounded-lg border border-dashed border-white/20 text-[11px] font-bold text-slate-400 hover:text-white hover:border-white/40 flex items-center gap-1.5 transition-colors">
                                <span className="material-icons-round text-[14px]">add</span> ADD TAG
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER TOOLBAR ── */}
                <div className="px-8 py-5 border-t border-white/5 bg-[#202722] shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-5 text-slate-400">
                        <button className="hover:text-white transition-colors" title="Bold"><span className="material-icons-round text-[18px]">format_bold</span></button>
                        <button className="hover:text-white transition-colors" title="Italic"><span className="material-icons-round text-[18px]">format_italic</span></button>
                        <button className="hover:text-white transition-colors" title="List"><span className="material-icons-round text-[18px]">format_list_bulleted</span></button>
                        <div className="w-px h-5 bg-white/10 mx-1"></div>
                        <button className="hover:text-white transition-colors" title="Add Image"><span className="material-icons-round text-[18px]">image</span></button>
                        <button className="hover:text-white transition-colors" title="Add Reminder"><span className="material-icons-round text-[18px]">notifications</span></button>
                        <button className="hover:text-white transition-colors" title="Color palette"><span className="material-icons-round text-[18px]">palette</span></button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-medium text-slate-500">Unsaved changes</span>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!title.trim() && !content.trim())}
                            className="px-6 py-2.5 bg-[#5dbb6a] text-[#1a231d] text-[12px] font-black tracking-wide rounded-lg hover:bg-[#4ea65a] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
