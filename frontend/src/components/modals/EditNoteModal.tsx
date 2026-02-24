import React, { useState, useEffect, useRef } from 'react';
import type { NoteModel } from '../../models/NoteModel';
import { noteService } from '../../services/NoteService';
import { RichTextEditor } from './RichTextEditor';

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
    const [color, setColor] = useState<string | undefined>(undefined);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const COLORS = [
        { name: 'Default', value: undefined },
        { name: 'Red', value: '#3A2323' },
        { name: 'Orange', value: '#3D3624' },
        { name: 'Green', value: '#253629' },
        { name: 'Blue', value: '#23323A' },
        { name: 'Purple', value: '#32233A' },
    ];

    const handleFormat = (format: string) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        switch (format) {
            case 'bold':
                editor.chain().focus().toggleBold().run();
                break;
            case 'italic':
                editor.chain().focus().toggleItalic().run();
                break;
            case 'h1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case 'h2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
            case 'text':
                editor.chain().focus().setParagraph().run();
                break;
            case 'list':
                editor.chain().focus().toggleTaskList().run();
                break;
            case 'align-right':
                editor.chain().focus().setTextAlign('right').run();
                break;
            case 'align-left':
                editor.chain().focus().setTextAlign('left').run();
                break;
            case 'image':
                fileInputRef.current?.click();
                break;
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editorRef.current) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            editorRef.current.chain().focus().setImage({ src: base64 }).run();
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        if (note && isOpen) {
            setTitle(note.title);
            const contentStr = typeof note.content === 'string'
                ? note.content
                : JSON.stringify(note.content, null, 2);
            setContent(contentStr);
            setCategoryId(note.categoryId);
            setPriority(note.priority);
            setColor(note.color);
            setShowColorPicker(false);
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
            color,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onKeyDown={e => { if (e.key === 'Escape') onClose(); }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[90vw] md:max-w-5xl max-h-[95vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden transition-colors duration-300"
                style={{ backgroundColor: color || '#222723', border: '1px solid rgba(255,255,255,0.05)' }}
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-2.5 text-[#5dbb6a]">
                        <span className="material-icons-round text-lg">edit_document</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#63846b]">EDITING NOTE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-400/10" title="Delete Note">
                            <span className="material-icons-round text-base">delete</span>
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1"></div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5" title="Close">
                            <span className="material-icons-round text-lg">close</span>
                        </button>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 relative">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {/* Title */}
                        <input
                            type="text"
                            placeholder="Title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-3xl sm:text-4xl font-black text-[#859fbb] placeholder-[#4f6477] transition-colors"
                        />

                        {/* Content area */}
                        <RichTextEditor
                            content={content}
                            onChange={(html) => setContent(html)}
                            placeholder="Start typing your note here..."
                            editorRef={editorRef}
                        />

                    </div>
                </div>

                {/* ── FOOTER TOOLBAR ── */}
                <div className="px-6 py-4 border-t border-white/5 bg-black/10 shrink-0 flex flex-wrap items-center justify-between gap-4 relative">
                    <div className="flex items-center gap-2.5 text-[#859fbb]">
                        <button onClick={() => handleFormat('bold')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 font-serif font-black text-lg leading-none" title="Bold">B</button>
                        <button onClick={() => handleFormat('italic')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 font-serif italic font-bold text-lg leading-none" title="Italic">I</button>
                        <button onClick={() => handleFormat('h1')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 font-bold text-sm leading-none" title="Heading 1">H1</button>
                        <button onClick={() => handleFormat('h2')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 font-bold text-sm leading-none" title="Heading 2">H2</button>
                        <button onClick={() => handleFormat('text')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 font-medium text-sm leading-none" title="Regular Text">T</button>
                        <button onClick={() => handleFormat('list')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 flex" title="List"><span className="material-icons-round text-base">format_list_bulleted</span></button>

                        <div className="w-px h-5 bg-white/10 mx-1"></div>

                        <button onClick={() => handleFormat('align-right')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 flex" title="Align Right (RTL)">
                            <span className="material-icons-round text-base">format_align_right</span>
                        </button>
                        <button onClick={() => handleFormat('align-left')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 flex" title="Align Left (LTR)">
                            <span className="material-icons-round text-base">format_align_left</span>
                        </button>

                        <button onClick={() => handleFormat('image')} className="hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 flex" title="Add Image"><span className="material-icons-round text-base">image</span></button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        <div className="relative">
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className={`transition-colors p-1.5 rounded-md flex ${showColorPicker ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/10'}`}
                                title="Color palette"
                            >
                                <span className="material-icons-round text-base">palette</span>
                            </button>
                            {showColorPicker && (
                                <div className="absolute bottom-full mb-3 left-0 bg-[#2b332d] border border-white/10 rounded-xl p-2 flex gap-2 shadow-2xl z-50">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.name}
                                            onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                                            className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform flex items-center justify-center"
                                            style={{ backgroundColor: c.value || '#222723' }}
                                            title={c.name}
                                        >
                                            {color === c.value && <span className="material-icons-round text-[12px] opacity-70 mix-blend-difference">check</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">Unsaved changes</span>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!title.trim() && !content.trim())}
                            className="px-5 py-2 bg-[#5dbb6a] text-[#1a231d] text-xs font-black tracking-wide rounded-lg hover:bg-[#4ea65a] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center gap-2"
                        >
                            {isSubmitting ? <span className="material-icons-round text-base animate-spin">refresh</span> : null}
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
