import React, { useEffect, useState, useRef } from 'react';
import { noteService } from '../../services/NoteService';
import { categoryService } from '../../services/CategoryService';

interface SystemStatsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    refreshKey: number;
    anchorIconOnly: boolean;
}

export const SystemStatsPopover: React.FC<SystemStatsPopoverProps> = ({ isOpen, onClose, refreshKey }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({
        totalNotes: 0,
        totalCategories: 0,
        notesPerCategory: {} as Record<string, number>
    });
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const fetchStats = async () => {
            const start = Date.now();
            try {
                const [notes, categories] = await Promise.all([
                    noteService.getAllNotes(),
                    categoryService.getAllCategories()
                ]);
                setLatency(Date.now() - start);
                const counts: Record<string, number> = {};
                notes.forEach(note => {
                    const catName = categories.find(c => c.id === note.categoryId)?.name || 'Unknown';
                    counts[catName] = (counts[catName] || 0) + 1;
                });
                setStats({ totalNotes: notes.length, totalCategories: categories.length, notesPerCategory: counts });
            } catch {
                setLatency(null);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [isOpen, refreshKey]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Delay so the opening click doesn't immediately close it
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handler);
        }, 50);
        return () => {
            clearTimeout(timeout);
            document.removeEventListener('mousedown', handler);
        };
    }, [isOpen, onClose]);

    // Close on ESC
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="fixed z-[200] flex flex-col"
            style={{
                bottom: 16,
                left: 68,
                width: 300,
                maxHeight: 'calc(100vh - 100px)',
                animation: 'stats-pop-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
            }}
        >
            {/* Glass panel */}
            <div
                className="rounded-2xl border border-border-dark/80 overflow-hidden flex flex-col"
                style={{
                    background: 'linear-gradient(165deg, rgba(18,24,20,0.97) 0%, rgba(12,16,13,0.98) 100%)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(93,187,106,0.08), 0 0 40px rgba(93,187,106,0.06)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-dark/50">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <span className="material-icons-round text-sm text-primary/60">analytics</span>
                        System Overview
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary hover:bg-card-dark transition-all"
                    >
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                </div>

                {/* ── Scrollable content ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {/* Network */}
                    <div className="p-4 rounded-xl bg-card-dark border border-border-dark">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</h3>
                            <div className={`w-1.5 h-1.5 rounded-full ${latency !== null ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
                        </div>
                        <div className="flex justify-between text-[9px] mb-1.5 font-mono">
                            <span className="text-slate-500 uppercase">Latency</span>
                            <span className={latency !== null ? 'text-primary' : 'text-red-400'}>
                                {latency !== null ? `${latency}ms` : 'OFFLINE'}
                            </span>
                        </div>
                        <div className="h-1 bg-background-dark rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${latency !== null ? 'bg-primary' : 'bg-red-500'}`}
                                style={{ width: latency ? `${Math.min(latency / 2, 100)}%` : '0%' }}
                            />
                        </div>
                    </div>

                    {/* Database */}
                    <div className="p-4 rounded-xl bg-card-dark border border-border-dark">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database</h3>
                            <span className="material-icons-round text-slate-600 text-sm">storage</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-background-dark/60 p-3 rounded-lg border border-border-dark/60">
                                <div className="text-2xl font-black text-slate-100">{stats.totalNotes}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Notes</div>
                            </div>
                            <div className="bg-background-dark/60 p-3 rounded-lg border border-border-dark/60">
                                <div className="text-2xl font-black text-slate-100">{stats.totalCategories}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Categories</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-2">Distribution</div>
                            {Object.entries(stats.notesPerCategory).map(([catName, count]) => (
                                <div key={catName} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 truncate">{catName}</span>
                                    <span className="text-xs font-mono text-slate-500 ml-2 shrink-0">{count}</span>
                                </div>
                            ))}
                            {Object.keys(stats.notesPerCategory).length === 0 && (
                                <div className="text-[10px] text-slate-600 italic">No notes yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-4 pb-4 pt-3 border-t border-border-dark/30">
                    <div className="text-center text-[9px] text-slate-600 font-mono">v2.0.1-alpha</div>
                </div>
            </div>

            <style>{`
                @keyframes stats-pop-in {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};
