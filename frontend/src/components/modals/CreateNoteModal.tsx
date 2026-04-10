import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { NoteModel } from '../../models/NoteModel';
import { noteService } from '../../services/NoteService';
import {
    formatReminderDisplay,
} from './noteModalUtils';
import { ImageResizer } from './ImageResizer';
import { SongNoteContent } from '../board/SongNoteContent';
import { DemoNoteContent } from '../board/DemoNoteContent';

const PRESET_COLORS = [
    '#5dbb6a', '#4f8ef7', '#f7874f', '#f7cf4f',
    '#c44ff7', '#f74f7a', '#4ff7e8', '#f7f74f',
    '#a0aec0', '#fc8181',
];

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNoteCreated: () => void;
    categoryId?: number;
    categoryType?: string;
}

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ isOpen, onClose, onNoteCreated, categoryId, categoryType }) => {
    const [title, setTitle] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [remindAt, setRemindAt] = useState('');
    const [noteColor, setNoteColor] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [noteType, setNoteType] = useState<'text' | 'song' | 'demo'>('text');
    const [attachments, setAttachments] = useState<any[]>([]);

    const [showReminderPicker, setShowReminderPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const editorRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const reminderRef = useRef<HTMLDivElement>(null);
    const colorRef = useRef<HTMLDivElement>(null);
    const songBodyRef = useRef<HTMLDivElement>(null);
    const [songBodyHeight, setSongBodyHeight] = useState(0);
    const addSectionFnRef = useRef<(type: string) => void>(() => {});
    const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
    const [customSectionType, setCustomSectionType] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setHtmlContent('');
            setNoteType(categoryType === 'music' ? 'song' : 'text');
            setRemindAt('');
            setNoteColor('');
            setAttachments([]);
            setIsSubmitting(false);
            setShowReminderPicker(false);
            setShowColorPicker(false);

            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
        }
    }, [isOpen, categoryType]);

    useEffect(() => {
        if (noteType !== 'song' || !isOpen) return;
        const measure = () => {
            if (songBodyRef.current) setSongBodyHeight(songBodyRef.current.clientHeight);
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (songBodyRef.current) ro.observe(songBodyRef.current);
        return () => ro.disconnect();
    }, [noteType, isOpen]);

    useEffect(() => {
        if (!showReminderPicker && !showColorPicker) return;
        const handler = (e: MouseEvent) => {
            if (reminderRef.current && !reminderRef.current.contains(e.target as Node)) setShowReminderPicker(false);
            if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColorPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showReminderPicker, showColorPicker]);

    // Collapse any image selection before running a format command so that
    // commands like insertUnorderedList don't accidentally wrap the <img>.
    const collapseImageSelection = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const node = sel.focusNode;
        const el = node?.nodeType === 1 ? node as HTMLElement : node?.parentElement;
        if (el?.tagName === 'IMG' || el?.closest('img')) {
            sel.removeAllRanges();
        }
    };

    const execCmd = (cmd: string, val: string | undefined = undefined) => {
        collapseImageSelection();
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
        updateHtml();
    };

    const updateHtml = () => {
        if (editorRef.current) {
            setHtmlContent(editorRef.current.innerHTML);
        }
    };

    const handleTypeChange = (newType: 'text' | 'song' | 'demo') => {
        if (newType === noteType) return;
        setNoteType(newType);
        setHtmlContent('');
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
    };

    const handleSongChange = useCallback((newContent: any) => {
        setHtmlContent(JSON.stringify(newContent));
    }, []);

    const handleDemoChange = useCallback((lyrics: string) => {
        setHtmlContent(lyrics);
    }, []);

    const handleDemoAttachment = useCallback((att: any) => {
        setAttachments(prev => [...prev, att]);
    }, []);

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
                // Constrain to editor width; user can resize via ImageResizer after
                const editorW = editorRef.current?.offsetWidth ?? 600;
                const displayW = Math.min(width, editorW);
                img.style.width = `${displayW}px`;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.borderRadius = '1rem';
                img.style.marginBottom = '1rem';
                img.style.display = 'block';
                img.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                img.setAttribute('draggable', 'true');

                const editor = editorRef.current;
                if (editor) {
                    const sel = window.getSelection();
                    // Only use the live selection if it is actually inside the editor;
                    // otherwise (e.g. user had focus on the title input) append at the end.
                    const selInEditor =
                        sel &&
                        sel.rangeCount > 0 &&
                        editor.contains(sel.getRangeAt(0).commonAncestorContainer);

                    if (selInEditor && sel) {
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
        if (!categoryId) return;
        const currentHtml = noteType === 'text' ? (editorRef.current?.innerHTML ?? htmlContent) : htmlContent;
        const hasContent = currentHtml.trim() !== '' && currentHtml !== '<br>' && currentHtml !== '<p><br></p>';
        if (!title.trim() && noteType === 'text' && !hasContent && !noteColor) return;

        setIsSubmitting(true);
        const newNote: NoteModel = {
            title: title.trim(),
            content: noteType === 'text' ? (editorRef.current?.innerHTML ?? htmlContent) : htmlContent,
            contentType: noteType,
            categoryId,
            attachments: attachments,
            remindAt: remindAt || undefined,
            color: noteColor || undefined,
        };

        // Close instantly for better UX
        onClose();

        try {
            await noteService.addNote(newNote);
            onNoteCreated();
        } catch (error) {
            console.error("Failed to create note", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

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
            <div className="absolute inset-0 cursor-default" onClick={onClose} />

            <div
                className="w-[95vw] lg:max-w-7xl h-[95vh] sm:h-[90vh] rounded-[2rem] flex flex-col relative overflow-hidden transition-all duration-500 border border-border-dark"
                style={{
                    background: noteColor
                        ? `linear-gradient(160deg, ${noteColor}30 0%, rgba(24,30,25,0.97) 55%), #181e19`
                        : '#181e19',
                    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.05), 0 32px 96px -12px ${noteColor ? `${noteColor}40` : 'rgba(0,0,0,0.6)'}`,
                    border: noteColor ? `1px solid ${noteColor}30` : undefined,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Backing Ambient Gradient */}
                {noteColor && (
                    <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                            background: `linear-gradient(160deg, ${noteColor}25 0%, ${noteColor}10 50%, transparent 100%)`
                        }}
                    />
                )}

                {/* ── TOP NAV ── */}
                <div className="flex items-center justify-between px-8 pt-6 pb-2 shrink-0 z-10 relative">
                    {/* Left: title + type switcher */}
                    <div className="flex-1 flex items-center gap-4 mr-6">
                        <input
                            type="text"
                            placeholder={noteType === 'song' ? 'Song Title' : noteType === 'demo' ? 'Demo Name' : 'Title'}
                            value={title}
                            autoFocus
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent border-none outline-none text-2xl font-black text-slate-50 placeholder-white/30 tracking-tight leading-tight min-w-0 flex-1"
                        />
                        {categoryType === 'music' && (
                            <div className="flex items-center gap-1 p-1 bg-black/20 rounded-xl shrink-0 border border-white/5">
                                <button
                                    onClick={() => handleTypeChange('song')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${noteType === 'song' ? 'bg-primary text-background-dark shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    Song
                                </button>
                                <button
                                    onClick={() => handleTypeChange('demo')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${noteType === 'demo' ? 'bg-[#c44ff7] text-background-dark shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    Demo
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Right: color + close */}
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
                        <button onClick={onClose} className="group relative w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all active:scale-90">
                            <span className="material-icons-round text-[20px] text-slate-400 group-hover:rotate-90 group-hover:scale-110 transition-all duration-300">close</span>
                        </button>
                    </div>
                </div>

                {/* ── TITLE / CONTENT DIVIDER ── */}
                <div className="shrink-0 px-8 relative z-10">
                    <div
                        className="h-px w-full"
                        style={{
                            background: noteColor
                                ? `linear-gradient(to right, transparent 0%, ${noteColor}70 25%, ${noteColor}70 75%, transparent 100%)`
                                : 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.10) 25%, rgba(255,255,255,0.10) 75%, transparent 100%)'
                        }}
                    />
                </div>

                {/* ── EDITOR BODY ── */}
                <div
                    ref={noteType === 'song' ? songBodyRef : undefined}
                    className={`flex-1 min-h-0 relative z-0 flex flex-col ${
                        noteType === 'song'
                            ? 'overflow-hidden px-8 sm:px-12 pt-3'
                            : 'overflow-y-auto custom-scrollbar px-8 sm:px-16 pb-32'
                    }`}
                    onClick={() => editorRef.current?.focus()}
                >
                    <div className={`flex flex-col h-full ${
                        noteType === 'song' ? 'w-full' : 'w-full gap-6 pt-4'
                    }`}>

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

                        <div className={`relative ${noteType === 'song' ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                            {noteType === 'song' ? (
                                <SongNoteContent
                                    note={{ content: htmlContent } as any}
                                    onChange={handleSongChange}
                                    containerHeight={songBodyHeight}
                                    onRegisterAdd={(fn) => { addSectionFnRef.current = fn; }}
                                />
                            ) : noteType === 'demo' ? (
                                <DemoNoteContent note={{ content: htmlContent, attachments } as any} onChange={handleDemoChange} onAddAttachment={handleDemoAttachment} />
                            ) : (
                                <>
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
                                        style={{ whiteSpace: 'pre-wrap' }}
                                        suppressContentEditableWarning={true}
                                    />
                                    <ImageResizer editorRef={editorRef} onUpdate={updateHtml} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── FLOATING BOTTOM TOOLBAR + SAVE ── */}
                <div className="absolute bottom-8 left-0 right-0 pointer-events-none flex justify-center px-8 z-20">
                    <div className="flex items-center justify-between w-full max-w-3xl">

                        {noteType === 'song' ? (
                            <>
                                <div className="pointer-events-auto flex items-center gap-1.5 p-2 rounded-2xl bg-card-dark/95 backdrop-blur-xl border border-border-dark shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5)] flex-wrap max-w-[calc(100%-180px)]">
                                    {['Verse', 'Chorus', 'Pre-Chorus', 'Bridge', 'Intro', 'Outro'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => addSectionFnRef.current(t)}
                                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all flex items-center gap-1"
                                        >
                                            <span className="material-icons-round text-[13px]">add</span>
                                            {t}
                                        </button>
                                    ))}
                                    {isAddingCustomSection ? (
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            if (customSectionType.trim()) {
                                                addSectionFnRef.current(customSectionType.trim());
                                                setCustomSectionType('');
                                                setIsAddingCustomSection(false);
                                            }
                                        }}>
                                            <input
                                                autoFocus
                                                value={customSectionType}
                                                onChange={e => setCustomSectionType(e.target.value)}
                                                onBlur={() => setTimeout(() => { if (!customSectionType.trim()) setIsAddingCustomSection(false); }, 150)}
                                                className="px-3 py-1.5 rounded-xl border border-primary/50 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider outline-none w-28 text-center placeholder-primary/40"
                                                placeholder="TYPE NAME…"
                                            />
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() => setIsAddingCustomSection(true)}
                                            className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all flex items-center gap-1"
                                        >
                                            <span className="material-icons-round text-[13px]">add</span>
                                            Custom
                                        </button>
                                    )}
                                </div>
                                <div className="pointer-events-auto ml-4">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="h-[48px] px-7 rounded-2xl bg-primary text-[#1a231d] text-[13px] font-black tracking-wide shadow-[0_12px_32px_-8px_rgba(93,187,106,0.5)] hover:bg-[#4ea65a] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                                    >
                                        <span className="material-icons-round text-[18px]">add</span>
                                        CREATE
                                    </button>
                                </div>
                            </>
                        ) : noteType === 'text' ? (
                            /* Format Pill + Save — text notes */
                            <>
                                <div className="pointer-events-auto flex items-center gap-1 p-2 rounded-2xl bg-card-dark/95 backdrop-blur-xl border border-border-dark shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5)] transition-all">
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
                                                <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-4 px-1">Set Date &amp; Time</div>
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

                                {/* CREATE button — right side */}
                                <div className="pointer-events-auto ml-4">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || (!title.trim() && !(htmlContent.trim() !== '' && htmlContent !== '<br>' && htmlContent !== '<p><br></p>') && !noteColor)}
                                        className="h-[56px] px-8 rounded-2xl bg-primary text-[#1a231d] text-[14px] font-black tracking-wide shadow-[0_12px_32px_-8px_rgba(93,187,106,0.5)] hover:bg-[#4ea65a] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-icons-round text-[18px] animate-spin">sync</span>
                                                CREATING
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-icons-round text-[18px]">add</span>
                                                CREATE NOTE
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : null /* demo */}

                        {/* Save — demo notes only; song + text include their own */}
                        {noteType === 'demo' && (
                            <div className="pointer-events-auto">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="h-[56px] px-8 rounded-2xl bg-primary text-[#1a231d] text-[14px] font-black tracking-wide shadow-[0_12px_32px_-8px_rgba(93,187,106,0.5)] hover:bg-[#4ea65a] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-icons-round text-[18px] animate-spin">sync</span>
                                            CREATING
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons-round text-[18px]">add</span>
                                            CREATE NOTE
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

