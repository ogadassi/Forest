import React from 'react';
import type { NoteModel } from '../../models/NoteModel';
import { TimerNote } from './TimerNote';

interface NoteCardProps {
    note: NoteModel;
    onClick: () => void;
    onDelete?: () => void;
    hasLeftHandle?: boolean;
    onUpdate?: (updates: Partial<NoteModel>) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onDelete, hasLeftHandle, onUpdate }) => {
    function getDir(text: string): 'rtl' | 'ltr' {
        return /[\u0590-\u05FF\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr';
    }

    const rawContentStr = typeof note.content === 'string'
        ? note.content
        : JSON.stringify(note.content, null, 2);

    const plainTextForDir = rawContentStr.replace(/<[^>]+>/g, '').replace(/&nbsp;/ig, ' ');
    const defaultDir = getDir(plainTextForDir);

    let previewHTML = rawContentStr.replace(/!\[.*?\]\(.*?\)/g, '').trim();

    const hasContent = previewHTML.length > 0;
    const isTinted = !!note.color;
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const container = contentRef.current;
        if (!container || !onUpdate) return;

        const handleChecklistClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // Check if we clicked on or inside a checklist item, but not on a link
            const li = target.closest('li');
            if (!li || target.closest('a')) return;
            
            // Ensure the list is actually a checklist
            const ul = li.closest('ul');
            if (!ul || !ul.classList.contains('checklist')) return;

            // Toggle the checked state
            li.classList.toggle('checked');
            
            // Sync changes upstream instantly
            onUpdate({ content: container.innerHTML });
        };

        container.addEventListener('click', handleChecklistClick);
        return () => container.removeEventListener('click', handleChecklistClick);
    }, [onUpdate]);

    if (note.contentType === 'timer') {
        return (
            <div
                className="h-full flex flex-col group relative rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden shadow-sm hover:shadow-xl"
                style={{
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    background: isTinted
                        ? `linear-gradient(160deg, ${note.color}15 0%, rgba(30,38,31,0.8) 60%), #1e261f`
                        : 'rgba(30,38,31,0.6)',
                    border: isTinted ? `1px solid ${note.color}40` : '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {/* Delete overlay button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    className="absolute top-2 right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
                    title="Delete timer note"
                >
                    <span className="material-icons-round text-sm">close</span>
                </button>
                <div className="flex-1 p-0 flex flex-col items-center justify-center overflow-hidden">
                    <TimerNote
                        note={note}
                        color={note.color || 'var(--color-primary)'}
                        onUpdate={onUpdate || (() => {})}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className="h-full flex flex-col group relative rounded-2xl cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden hover:-translate-y-1 hover:shadow-2xl active:scale-95"
            style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: isTinted
                    ? `linear-gradient(160deg, ${note.color}30 0%, rgba(30,38,31,0.6) 60%), #1e261f`
                    : 'rgba(30,38,31,0.6)',
                border: isTinted ? `1px solid ${note.color}40` : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isTinted
                    ? `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 ${note.color}30`
                    : '0 12px 32px -10px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.03)',
            }}
        >
            {/* Delete Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="absolute top-2 right-2 z-30 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200"
                title="Delete note"
            >
                <span className="material-icons-round text-[16px]">delete</span>
            </button>

            {/* Base Tint Wrapper */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    background: isTinted
                        ? `linear-gradient(160deg, ${note.color}40 0%, ${note.color}20 100%)`
                        : 'transparent'
                }}
            />

            {/* Hover Glow */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
                style={{
                    background: `linear-gradient(135deg, ${isTinted ? note.color : 'var(--color-primary)'}20 0%, transparent 60%)`,
                    boxShadow: `inset 0 0 0 1px ${isTinted ? note.color : 'var(--color-primary)'}40`
                }}
            />

            {/* Content Layer */}
            <div className="relative z-10 flex-1 flex flex-col h-full">
                <div className="px-5 pt-5 flex-1 flex flex-col overflow-hidden">
                    {note.title?.trim() && (
                        <>
                            <div className={`flex items-start justify-between gap-3 mb-3 transition-[padding] duration-200 ${hasLeftHandle ? 'group-hover:pl-6' : ''}`}>
                                <h3 dir={getDir(note.title)} className="note-title font-bold text-[15px] sm:text-base text-slate-100 leading-tight line-clamp-2 flex-1 tracking-tight drop-shadow-sm">
                                    {note.title}
                                </h3>
                            </div>

                            {/* Title / content divider — only shown when there's content below the title */}
                            {hasContent && (
                                <div
                                    className="h-px w-full mb-3"
                                    style={{
                                        background: isTinted
                                            ? `linear-gradient(to right, transparent 0%, ${note.color}70 25%, ${note.color}70 75%, transparent 100%)`
                                            : 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.10) 25%, rgba(255,255,255,0.10) 75%, transparent 100%)'
                                    }}
                                />
                            )}
                        </>
                    )}

                    {hasContent ? (
                        <div
                            className="flex-1 min-h-[40px] overflow-hidden relative"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)'
                            }}
                        >
                            {note.contentType === 'song' ? (
                                <div className="flex flex-col mt-1">
                                    {(() => {
                                        try {
                                            const secStr = typeof note.content === 'string' ? note.content : JSON.stringify(note.content);
                                            const sections = JSON.parse(secStr) as any[];
                                            if (!Array.isArray(sections) || sections.length === 0) {
                                                return <span className="text-slate-500 italic text-[14px]">No lyrics yet...</span>;
                                            }
                                            return sections.map((sec, i) => (
                                                <div key={i} className="flex flex-col mb-4">
                                                    <span
                                                        className="text-[10px] font-black uppercase tracking-[0.15em] mb-1"
                                                        style={{ color: sec.vocalistColor || '#4f8ef7' }}
                                                    >
                                                        {sec.type}
                                                    </span>
                                                    <span className="text-[14px] text-slate-300 leading-[1.65] whitespace-pre-wrap font-medium">
                                                        {sec.lyrics || <span className="opacity-30 italic">...</span>}
                                                    </span>
                                                </div>
                                            ));
                                        } catch (e) {
                                            return <span className="text-slate-500 italic text-[14px]">No lyrics yet...</span>;
                                        }
                                    })()}
                                </div>
                            ) : (
                                <div
                                    dir={defaultDir}
                                    className="text-[17px] text-slate-300 leading-[1.7] whitespace-pre-wrap break-words font-medium 
                                        [&_img]:w-full [&_img]:rounded-xl [&_img]:my-6 [&_img]:shadow-lg
                                        [&_h1]:text-4xl [&_h1]:font-black [&_h1]:text-slate-50 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight 
                                        [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-200 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight 
                                        [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:text-slate-200 [&_h3]:mt-4 [&_h3]:mb-2 
                                        
                                        /* Custom Checklist-Style Bullets */
                                        [&_ul.checklist]:list-none [&_ul.checklist]:p-0 [&_ul.checklist]:my-4 [&_ul.checklist]:space-y-2
                                        [&_ul.checklist_li]:relative [&_ul.checklist_li]:flex [&_ul.checklist_li]:items-start [&_ul.checklist_li]:gap-3 [&_ul.checklist_li]:border [&_ul.checklist_li]:border-white/10 [&_ul.checklist_li]:bg-white/[0.03] hover:[&_ul.checklist_li]:bg-white/[0.06] [&_ul.checklist_li]:rounded-xl [&_ul.checklist_li]:px-4 [&_ul.checklist_li]:py-3 [&_ul.checklist_li]:my-1 [&_ul.checklist_li]:transition-colors [&_ul.checklist_li]:cursor-pointer
                                        [&_ul.checklist_li::before]:content-[''] [&_ul.checklist_li::before]:block [&_ul.checklist_li::before]:w-5 [&_ul.checklist_li::before]:h-5 [&_ul.checklist_li::before]:rounded [&_ul.checklist_li::before]:border-[1.5px] [&_ul.checklist_li::before]:border-primary/50 [&_ul.checklist_li::before]:bg-background-dark [&_ul.checklist_li::before]:shadow-sm [&_ul.checklist_li::before]:shrink-0 [&_ul.checklist_li::before]:mt-[1px] [&_ul.checklist_li::before]:transition-colors
                                        /* Checked state */
                                        [&_ul.checklist_li.checked]:opacity-60 [&_ul.checklist_li.checked]:text-slate-500 [&_ul.checklist_li.checked]:line-through
                                        [&_ul.checklist_li.checked::before]:bg-primary [&_ul.checklist_li.checked::before]:border-primary
                                        [&_ul.checklist_li.checked::after]:content-[''] [&_ul.checklist_li.checked::after]:absolute [&_ul.checklist_li.checked::after]:left-[24px] rtl:[&_ul.checklist_li.checked::after]:left-auto rtl:[&_ul.checklist_li.checked::after]:right-[24px] [&_ul.checklist_li.checked::after]:top-[16px] [&_ul.checklist_li.checked::after]:w-[5px] [&_ul.checklist_li.checked::after]:h-[9px] [&_ul.checklist_li.checked::after]:border-b-[2px] [&_ul.checklist_li.checked::after]:border-r-[2px] [&_ul.checklist_li.checked::after]:border-background-dark [&_ul.checklist_li.checked::after]:rotate-45
                                        
                                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 
                                        [&_blockquote]:border-l-2 [&_blockquote]:border-slate-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-1 
                                        [&_p]:my-3 
                                        [&_strong]:text-slate-100 [&_strong]:font-bold
                                        [&_em]:text-slate-400
                                        [&_a]:text-primary [&_a]:underline
                                        
                                        /* Restore typical bullet lists */
                                        [&_ul:not(.checklist)]:list-disc [&_ul:not(.checklist)]:pl-6 [&_ul:not(.checklist)]:my-4 [&_ul:not(.checklist)_li]:my-1 [&_ul:not(.checklist)_li::marker]:text-primary/50"
                                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-[12px] text-white/20 italic select-none">Empty note</span>
                        </div>
                    )}

                    {(note.contentType === 'checklist' || note.contentType === 'song' || note.contentType === 'demo' || note.remindAt) && (
                        <div className="mt-auto pt-3 pb-5 border-t border-border-dark flex items-center gap-2.5 flex-wrap">
                            {note.contentType === 'checklist' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-background-dark/80 px-2.5 py-1 rounded-md border border-white/5">
                                    <span className="material-icons-round text-[11px]">checklist</span>
                                    Checklist
                                </span>
                            )}
                            {note.contentType === 'song' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-white/5">
                                    <span className="material-icons-round text-[11px]">music_note</span>
                                    Song
                                </span>
                            )}
                            {note.contentType === 'demo' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#c44ff7] bg-[#c44ff7]/10 px-2.5 py-1 rounded-md border border-white/5">
                                    <span className="material-icons-round text-[11px]">mic</span>
                                    Demo
                                </span>
                            )}
                            {note.remindAt && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md ml-auto">
                                    <span className="material-icons-round text-[11px] animate-pulse">alarm</span>
                                    Reminder
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
