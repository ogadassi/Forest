import React from 'react';
import type { NoteModel } from '../../models/NoteModel';

interface NoteCardProps {
    note: NoteModel;
    onClick: () => void;
    hasLeftHandle?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, hasLeftHandle }) => {
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
                <div className="p-5 flex-1 flex flex-col overflow-hidden">
                    <div className={`flex items-start justify-between gap-3 mb-3 transition-[padding] duration-200 ${hasLeftHandle ? 'group-hover:pl-6' : ''}`}>
                        <h3 dir={getDir(note.title)} className="font-bold text-[15px] sm:text-base text-slate-100 leading-tight line-clamp-2 flex-1 tracking-tight drop-shadow-sm">
                            {note.title}
                        </h3>
                    </div>

                    {hasContent ? (
                        <div
                            className="flex-1 min-h-[40px] mb-4 overflow-hidden relative"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)'
                            }}
                        >
                            <div
                                dir={defaultDir}
                                className="text-[17px] text-slate-300 leading-[1.7] whitespace-pre-wrap break-words font-medium 
                                    [&_img]:w-full [&_img]:rounded-xl [&_img]:my-6 [&_img]:shadow-lg
                                    [&_h1]:text-4xl [&_h1]:font-black [&_h1]:text-slate-50 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight 
                                    [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-200 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight 
                                    [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:text-slate-200 [&_h3]:mt-4 [&_h3]:mb-2 
                                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_li]:my-1 [&_ul_li::marker]:text-primary/50
                                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 
                                    [&_blockquote]:border-l-2 [&_blockquote]:border-slate-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-1 
                                    [&_p]:my-3 
                                    [&_strong]:text-slate-100 [&_strong]:font-bold
                                    [&_em]:text-slate-400
                                    [&_a]:text-primary [&_a]:underline"
                                dangerouslySetInnerHTML={{ __html: previewHTML }}
                            />
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {(note.contentType === 'checklist' || note.remindAt) && (
                        <div className="mt-auto pt-3 border-t border-border-dark flex items-center gap-2.5 flex-wrap">
                            {note.contentType === 'checklist' && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-background-dark/80 px-2.5 py-1 rounded-md border border-white/5">
                                    <span className="material-icons-round text-[11px]">checklist</span>
                                    Checklist
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
