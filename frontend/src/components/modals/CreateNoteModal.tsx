import React, { useState, useEffect, useRef } from 'react';
import type { NoteModel } from '../../models/NoteModel';
import { noteService } from '../../services/NoteService';

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNoteCreated: () => void;
    categoryId?: number;
}

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ isOpen, onClose, onNoteCreated, categoryId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
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
        if (isOpen) {
            setTitle('');
            setContent('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!categoryId) return;
        if (!title.trim() && !content.trim()) return;

        setIsSubmitting(true);
        const newNote: NoteModel = {
            title: title.trim() || 'Untitled Note',
            content,
            contentType: 'text',
            categoryId,
            priority: 1,
            isPinned: false,
            attachments: []
        };

        try {
            await noteService.addNote(newNote);
            onNoteCreated();
            onClose();
        } catch (error) {
            console.error("Failed to create note", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-8" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
            <div
                className="bg-[#242c26] w-full max-w-4xl h-full max-h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-2.5 text-[#5dbb6a]">
                        <span className="material-icons-round text-lg">post_add</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#63846b]">CREATING NODE</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5">
                            <span className="material-icons-round text-[18px]">push_pin</span>
                        </button>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5">
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
                            autoFocus
                        />

                        {/* Content area */}
                        <textarea
                            ref={textareaRef}
                            placeholder="Start typing your note here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-[15px] leading-relaxed text-slate-300 placeholder-slate-600 resize-none overflow-hidden min-h-[300px]"
                        />
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
                            Create Note
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
