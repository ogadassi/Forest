import React, { useState, useEffect, useRef } from 'react';
import type { NoteModel } from '../../models/NoteModel';
import { noteService } from '../../services/NoteService';
import {
    formatReminderDisplay,
    formatDatetimeLocal,
} from './noteModalUtils';
import { ImageResizer } from './ImageResizer';

const PRESET_COLORS = [
    '#5dbb6a', '#4f8ef7', '#f7874f', '#f7cf4f',
    '#c44ff7', '#f74f7a', '#4ff7e8', '#f7f74f',
    '#a0aec0', '#fc8181',
];

interface EditNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNoteUpdated: (updatedNote?: NoteModel, deletedId?: number) => void;
    note: NoteModel | null;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({ isOpen, onClose, onNoteUpdated, note }) => {
    const [title, setTitle] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [remindAt, setRemindAt] = useState('');
    const [noteColor, setNoteColor] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [showReminderPicker, setShowReminderPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const editorRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const reminderRef = useRef<HTMLDivElement>(null);
    const colorRef = useRef<HTMLDivElement>(null);
    const deleteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (note && isOpen) {
            setTitle(note.title);
            const contentStr = typeof note.content === 'string'
                ? note.content
                : JSON.stringify(note.content, null, 2);

            let initialHtml = contentStr;
            if (!initialHtml.includes('<p>') && !initialHtml.includes('<br>') && !initialHtml.includes('<div>') && !initialHtml.includes('<h1>') && !initialHtml.includes('<h2>')) {
                initialHtml = initialHtml.replace(/\n/g, '<br>');
            }

            setHtmlContent(initialHtml);
            setCategoryId(note.categoryId);
            setRemindAt(note.remindAt ? formatDatetimeLocal(note.remindAt) : '');
            setNoteColor(note.color ?? '');
            setIsSubmitting(false);

            if (editorRef.current) {
                editorRef.current.innerHTML = initialHtml;
            }
        }
    }, [note, isOpen]);

    useEffect(() => {
        if (!showReminderPicker && !showColorPicker) return;
        const handler = (e: MouseEvent) => {
            if (reminderRef.current && !reminderRef.current.contains(e.target as Node)) setShowReminderPicker(false);
            if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColorPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showReminderPicker, showColorPicker]);

    useEffect(() => {
        if (!confirmDelete) return;
        const handler = (e: MouseEvent) => {
            if (deleteRef.current && !deleteRef.current.contains(e.target as Node)) {
                setConfirmDelete(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [confirmDelete]);

    const execCmd = (cmd: string, val: string | undefined = undefined) => {
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
        updateHtml();
    };

    const updateHtml = () => {
        if (editorRef.current) {
            setHtmlContent(editorRef.current.innerHTML);
        }
    };

    const setDirection = (dir: 'ltr' | 'rtl') => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        let node = selection.focusNode;
        if (!node) return;

        let blockNode = node.nodeType === 3 ? node.parentElement : node as HTMLElement;
        while (blockNode && blockNode !== editorRef.current &&
            !['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'].includes(blockNode.tagName)) {
            blockNode = blockNode.parentElement;
        }

        if (!blockNode || blockNode === editorRef.current) {
            document.execCommand('formatBlock', false, 'DIV');
            setTimeout(() => setDirection(dir), 10);
            return;
        }

        if (blockNode && blockNode !== editorRef.current) {
            blockNode.setAttribute('dir', dir);
            updateHtml();
        }
        editorRef.current?.focus();
    };

    const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const originalDataUrl = reader.result as string;

            const tempImg = new Image();
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = tempImg;
                const MAX_SIZE = 1200;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(tempImg, 0, 0, width, height);
                const dataUrl = ctx ? canvas.toDataURL('image/jpeg', 0.7) : originalDataUrl;

                const img = document.createElement('img');
                img.src = dataUrl;
                img.style.width = '100%';
                img.style.maxWidth = '100%';
                img.style.borderRadius = '1rem';
                img.style.marginTop = '1.5rem';
                img.style.display = 'block';
                img.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                img.setAttribute('draggable', 'true');

                const editor = editorRef.current;
                if (editor) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        range.collapse(false);
                        range.insertNode(img);
                        range.setStartAfter(img);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else {
                        editor.appendChild(img);
                    }
                    updateHtml();
                }
            };
            tempImg.src = originalDataUrl;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSubmit = async () => {
        if (!categoryId || !note?.id) return;
        const currentHtml = editorRef.current?.innerHTML ?? htmlContent;
        if (!title.trim() && !editorRef.current?.innerText.trim() && !currentHtml.includes('<img')) return;

        const updatedNote: NoteModel = {
            ...note,
            title: title.trim() || 'Untitled Note',
            content: currentHtml,
            categoryId: Number(categoryId),
            remindAt: remindAt || undefined,
            color: noteColor || undefined,
        };

        // Optimistic UI updates
        onNoteUpdated(updatedNote);
        onClose();

        try {
            await noteService.updateNote(updatedNote);
        } catch (error) {
            console.error("Failed to update note", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!note?.id) return;

        onNoteUpdated(undefined, note.id);
        onClose();

        try {
            await noteService.deleteNote(note.id);
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    if (!isOpen || !note) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12 animate-in fade-in zoom-in-[0.98] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
            style={{
                background: `radial-gradient(circle at 50% 50%, rgba(24, 30, 25, 0.15) 0%, rgba(24, 30, 25, 0.4) 100%)`,
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)'
            }}
        >
            {/* Click outside to close */}
            <div className="absolute inset-0 cursor-default" onClick={onClose} />

            <div
                className="w-full max-w-4xl h-[95vh] sm:h-[85vh] rounded-[2rem] flex flex-col relative overflow-hidden transition-all duration-500 shadow-[0_32px_96px_-12px_rgba(0,0,0,0.6)] border border-border-dark bg-background-dark"
                style={{
                    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.05), 0 32px 96px -12px ${noteColor ? `${noteColor}20` : 'rgba(0,0,0,0.5)'}`,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Backing Ambient Gradient */}
                {noteColor && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-40 z-0 mix-blend-screen"
                        style={{
                            background: `radial-gradient(circle at 50% 0%, ${noteColor}40 0%, transparent 70%)`
                        }}
                    />
                )}

                {/* ── TOP NAV ── */}
                <div className="flex items-center justify-between px-8 py-5 shrink-0 z-10 relative">
                    <div className="flex-1" />
                    <div className="flex items-center gap-1">
                        {/* Color picker */}
                        <div className="relative" ref={colorRef}>
                            <button
                                onClick={() => { setShowColorPicker(p => !p); }}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${noteColor ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                title="Background Color"
                            >
                                <span className="material-icons-round text-[18px]" style={{ color: noteColor || '#94a3b8' }}>palette</span>
                            </button>
                            {showColorPicker && (
                                <div className="absolute top-10 right-0 bg-card-dark border border-border-dark rounded-2xl shadow-2xl z-50 p-4 w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Color</div>
                                    <div className="grid grid-cols-5 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setNoteColor(''); setShowColorPicker(false); }}
                                            className="w-8 h-8 rounded-xl transition-all hover:scale-110 relative flex items-center justify-center border border-white/10"
                                            style={{ background: 'var(--color-card-dark)' }}
                                            title="Default"
                                        >
                                            {noteColor === '' && <span className="material-icons-round text-white text-[12px]">check</span>}
                                        </button>
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => { setNoteColor(c); setShowColorPicker(false); }}
                                                className="w-8 h-8 rounded-xl transition-all hover:scale-110 relative flex items-center justify-center border border-white/5"
                                                style={{
                                                    backgroundColor: c,
                                                    boxShadow: noteColor === c ? `0 0 0 2px ${c}99, 0 0 10px ${c}aa` : 'none',
                                                    transform: noteColor === c ? 'scale(1.15)' : 'none'
                                                }}
                                                title={c}
                                            >
                                                {noteColor === c && <span className="material-icons-round text-white text-[12px]">check</span>}
                                            </button>
                                        ))}
                                        <label
                                            className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform overflow-hidden border border-white/10"
                                            title="Custom color"
                                            style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                                        >
                                            <input
                                                type="color"
                                                className="opacity-0 absolute w-0 h-0"
                                                value={noteColor || '#5dbb6a'}
                                                onChange={e => setNoteColor(e.target.value)}
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Delete + Close */}
                        <div className="flex items-center gap-1" ref={deleteRef}>
                            {confirmDelete ? (
                                <>
                                    <span className="text-xs text-red-400 font-semibold ml-1">Delete note?</span>
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-all"
                                    >Cancel</button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 rounded-lg transition-all"
                                    >Delete</button>
                                </>
                            ) : (
                                <button onClick={() => setConfirmDelete(true)} className="group relative w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all active:scale-90">
                                    <span className="material-icons-round text-[18px]">delete_outline</span>
                                </button>
                            )}
                            <button onClick={onClose} className="group relative w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all active:scale-90 ml-1">
                                <span className="material-icons-round text-[20px] text-slate-400 group-hover:rotate-90 group-hover:scale-110 transition-all duration-300">close</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── EDITOR BODY ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 sm:px-16 pb-32 relative z-0" onClick={() => editorRef.current?.focus()}>
                    <div className="max-w-2xl mx-auto h-full flex flex-col gap-6 pt-4 relative">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-4xl sm:text-[2.75rem] font-black text-slate-50 placeholder-slate-600 shrink-0 tracking-tight leading-tight"
                        />

                        {remindAt && (
                            <div className="flex items-center">
                                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-card-dark border border-border-dark text-slate-300 text-[12px] font-bold tracking-wide shadow-sm">
                                    <span className="material-icons-round text-[14px] text-primary">alarm</span>
                                    {formatReminderDisplay(remindAt)}
                                    <button onClick={() => setRemindAt('')} className="ml-2 hover:text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                                        <span className="material-icons-round text-[14px]">close</span>
                                    </button>
                                </span>
                            </div>
                        )}

                        <div className="relative flex-1">
                            <div
                                ref={editorRef}
                                contentEditable
                                onInput={updateHtml}
                                onBlur={updateHtml}
                                className="w-full bg-transparent border-none outline-none text-[17px] leading-[1.7] text-slate-300 min-h-[50vh] h-full prose prose-invert prose-slate max-w-none 
                                    [&_h1]:text-4xl [&_h1]:font-black [&_h1]:text-slate-50 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight
                                    [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-200 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight
                                    [&_p]:my-3
                                    [&_strong]:text-slate-100 [&_strong]:font-bold
                                    [&_em]:text-slate-400
                                    [&_ul]:my-4 [&_ul]:pl-6 [&_li]:my-1 [&_ul_li]:list-disc [&_ul_li::marker]:text-primary/50
                                    focus:outline-none empty:before:content-['Start_typing...'] empty:before:text-slate-600"
                                style={{ whiteSpace: 'pre-wrap', maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}
                                suppressContentEditableWarning={true}
                            />
                            <ImageResizer editorRef={editorRef} onUpdate={updateHtml} />
                        </div>
                    </div>
                </div>

                {/* ── FLOATING BOTTOM TOOLBAR + SAVE ── */}
                <div className="absolute bottom-8 left-0 right-0 pointer-events-none flex justify-center px-8 z-20">
                    <div className="flex items-center justify-between w-full max-w-3xl">

                        {/* Format Pill */}
                        <div className="pointer-events-auto flex items-center gap-1 p-2 rounded-2xl bg-card-dark/95 backdrop-blur-xl border border-border-dark shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5)]">
                            <button onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'H1'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-black text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90" title="Heading 1">H1</button>
                            <button onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'H2'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-bold text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90" title="Heading 2">H2</button>
                            <button onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'DIV'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90" title="Normal Text">P</button>
                            <div className="w-px h-6 bg-border-dark mx-1" />
                            <button onMouseDown={e => { e.preventDefault(); execCmd('bold'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90 font-bold" title="Bold">B</button>
                            <button onMouseDown={e => { e.preventDefault(); execCmd('italic'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90 italic" title="Italic">I</button>
                            <button onMouseDown={e => { e.preventDefault(); execCmd('underline'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90 underline" title="Underline">U</button>
                            <button onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90" title="Bullet list">
                                <span className="material-icons-round text-[20px]">format_list_bulleted</span>
                            </button>
                            <div className="w-px h-6 bg-border-dark mx-1" />
                            <button onClick={() => imageInputRef.current?.click()} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90" title="Image">
                                <span className="material-icons-round text-[20px]">image</span>
                            </button>
                            <div className="w-px h-6 bg-border-dark mx-1" />
                            <button onMouseDown={e => { e.preventDefault(); setDirection('ltr'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90" title="Left-to-Right">
                                <span className="material-icons-round text-[20px]">format_textdirection_l_to_r</span>
                            </button>
                            <button onMouseDown={e => { e.preventDefault(); setDirection('rtl'); }} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all active:scale-90" title="Right-to-Left">
                                <span className="material-icons-round text-[20px]">format_textdirection_r_to_l</span>
                            </button>
                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

                            {/* Reminder popover */}
                            <div className="relative" ref={reminderRef}>
                                <button onClick={() => { setShowReminderPicker(p => !p); setShowColorPicker(false); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${remindAt ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`} title="Reminder">
                                    <span className="material-icons-round text-[20px]">notifications</span>
                                </button>
                                {showReminderPicker && (
                                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-card-dark border border-border-dark rounded-2xl shadow-2xl z-50 p-5 w-72 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 duration-200">
                                        <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-4 px-1">Set Date & Time</div>
                                        <input
                                            type="datetime-local"
                                            value={remindAt}
                                            onChange={e => setRemindAt(e.target.value)}
                                            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                        <div className="flex gap-3 mt-4">
                                            <button onClick={() => { setRemindAt(''); setShowReminderPicker(false); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border-dark text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">Clear</button>
                                            <button onClick={() => setShowReminderPicker(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-[#1a231d] text-xs font-black shadow-[0_0_20px_rgba(93,187,106,0.2)] hover:scale-105 transition-all">Done</button>
                                        </div>
                                    </div>
                                )}
                            </div>


                        </div>

                        {/* Save Pill */}
                        <div className="pointer-events-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || (!title.trim() && !editorRef.current?.innerText.trim() && !htmlContent.includes('<img'))}
                                className="h-[56px] px-8 rounded-2xl bg-primary text-[#1a231d] text-[14px] font-black tracking-wide shadow-[0_12px_32px_-8px_rgba(93,187,106,0.5)] hover:bg-[#4ea65a] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="material-icons-round text-[18px] animate-spin">sync</span>
                                        SAVING
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-round text-[18px]">done</span>
                                        SAVE NOTE
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
