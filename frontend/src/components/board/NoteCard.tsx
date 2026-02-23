import React from 'react';
import type { NoteModel } from '../../models/NoteModel';

interface NoteCardProps {
    note: NoteModel;
    onClick: () => void;
    hasLeftHandle?: boolean;
}

const PRIORITY_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Low', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
    2: { label: 'Medium', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    3: { label: 'High', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
    4: { label: 'Urgent', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    5: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

/** Returns 'rtl' if text contains Hebrew/Arabic characters, 'ltr' otherwise */
function getDir(text: string): 'rtl' | 'ltr' {
    return /[\u0590-\u05FF\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr';
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, hasLeftHandle }) => {
    const priority = PRIORITY_CONFIG[note.priority] ?? PRIORITY_CONFIG[1];

    const contentPreview = typeof note.content === 'string'
        ? note.content
        : JSON.stringify(note.content);
    const truncated = contentPreview.length > 4000
        ? contentPreview.slice(0, 4000) + '…'
        : contentPreview;

    return (
        <div
            onClick={onClick}
            className="h-full flex flex-col group relative rounded-xl cursor-pointer transition-all duration-200 overflow-hidden
                       hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
        >
            {/* Hover glow */}
            <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(93,187,106,0.04) 0%, transparent 60%)' }}
            />

            <div className="relative p-4 flex-1 flex flex-col overflow-hidden">
                {/* Top row: title + pin */}
                <div className={`flex items-start justify-between gap-2 mb-2 transition-[padding] duration-150 ${hasLeftHandle ? 'group-hover:pl-5' : ''}`}>
                    <h3 dir={getDir(note.title)} className="font-semibold text-sm text-slate-100 leading-snug line-clamp-2 flex-1 break-words">
                        {note.title}
                    </h3>
                    {note.isPinned && (
                        <span className="material-icons-round text-xs text-primary/70 rotate-45 shrink-0 mt-0.5">
                            push_pin
                        </span>
                    )}
                </div>

                {/* Content preview */}
                {truncated && (
                    <div
                        className="flex-1 min-h-7 mb-3 overflow-hidden"
                        style={{
                            maskImage: 'linear-gradient(to bottom, black calc(100% - 15px), transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 15px), transparent 100%)'
                        }}
                    >
                        <p dir={getDir(truncated)} className="text-[13px] text-slate-400 leading-relaxed whitespace-pre-wrap break-words line-clamp-[14]">
                            {truncated}
                        </p>
                    </div>
                )}

                {/* Footer: badges */}
                <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                    {/* Priority badge */}
                    <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ color: priority.color, background: priority.bg }}
                    >
                        {priority.label}
                    </span>

                    {note.contentType === 'checklist' && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            <span className="material-icons-round text-xs">checklist</span>
                            Checklist
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
