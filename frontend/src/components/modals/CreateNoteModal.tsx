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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
            <div
                className="bg-[#242c26] w-full max-w-2xl max-h-[95vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-2.5 text-[#5dbb6a]">
                        <span className="material-icons-round text-lg">post_add</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#63846b]">Creating Note</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5">
                            <span className="material-icons-round text-base">push_pin</span>
                        </button>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5">
                            <span className="material-icons-round text-lg">close</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8">
                    <div className="max-w-3xl mx-auto space-y-4">
                        <input
                            type="text"
                            placeholder="Title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-2xl sm:text-3xl font-black text-slate-100 placeholder-slate-600 transition-colors"
                            autoFocus
                        />

                        <textarea
                            ref={textareaRef}
                            placeholder="Start typing..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-sm sm:text-base leading-relaxed text-slate-300 placeholder-slate-600 resize-none overflow-hidden min-h-[20vh]"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/5 bg-[#202722] shrink-0 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <button className="hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="Bold"><span className="material-icons-round text-base">format_bold</span></button>
                        <button className="hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="Italic"><span className="material-icons-round text-base">format_italic</span></button>
                        <button className="hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="List"><span className="material-icons-round text-base">format_list_bulleted</span></button>
                        <div className="w-px h-5 bg-white/10 mx-1"></div>
                        <button className="hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="Add Image"><span className="material-icons-round text-base">image</span></button>
                        <button className="hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="Add Reminder"><span className="material-icons-round text-base">notifications</span></button>
                        <button className="hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="Color palette"><span className="material-icons-round text-base">palette</span></button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">Unsaved</span>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!title.trim() && !content.trim())}
                            className="px-5 py-2 bg-[#5dbb6a] text-[#1a231d] text-xs font-black tracking-wide rounded-lg hover:bg-[#4ea65a] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center gap-2"
                        >
                            {isSubmitting ? <span className="material-icons-round text-base animate-spin">refresh</span> : <span className="material-icons-round text-base">add</span>}
                            Create Note
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
