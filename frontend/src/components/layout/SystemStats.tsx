import React, { useEffect, useState } from 'react';
import { noteService } from '../../services/NoteService';
import { categoryService } from '../../services/CategoryService';
import { useSettings } from '../../context/SettingsContext';

interface SystemStatsProps {
    refreshKey: number;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export const SystemStats: React.FC<SystemStatsProps> = ({ refreshKey, collapsed, onToggleCollapse }) => {
    const { sidebarClickMode } = useSettings();
    const isDouble = sidebarClickMode === 'double';
    const modeWord = isDouble ? 'Double-click' : 'Click';
    const stripProps = isDouble
        ? { onDoubleClick: onToggleCollapse }
        : { onClick: onToggleCollapse };
    const [stats, setStats] = useState({
        totalNotes: 0,
        totalCategories: 0,
        notesPerCategory: {} as Record<string, number>
    });
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
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
    }, [refreshKey]);

    /* ── COLLAPSED: thin vertical strip ── */
    if (collapsed) {
        return (
            <aside
                {...stripProps}
                title={`${modeWord} to expand System Overview`}
                className="h-full w-full bg-background-dark border-l border-border-dark flex flex-col items-center justify-center cursor-pointer group overflow-hidden relative select-none"
            >
                {/* Subtle hover glow */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />

                {/* Rotated label — icon + text in one row */}
                <div
                    className="flex items-center gap-2 select-none"
                    style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}
                >
                    <span className="material-icons-round text-base text-primary/70 group-hover:text-primary transition-colors">
                        analytics
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-slate-200 transition-colors">
                        System Overview
                    </span>
                </div>

                {/* Expand hint */}
                <div className="absolute bottom-4 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="material-icons-round text-sm text-primary/60">chevron_left</span>
                </div>
            </aside>
        );
    }

    /* ── EXPANDED ── */
    const handleEmptyClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        if (!(e.target as HTMLElement).closest('button, a, input, select, label, [role="button"]')) {
            onToggleCollapse();
        }
    };
    const expandedProps = isDouble
        ? { onDoubleClick: handleEmptyClick }
        : { onClick: handleEmptyClick };

    return (
        <aside
            {...expandedProps}
            title={`${modeWord} to collapse System Overview`}
            className="h-full bg-background-dark border-l border-border-dark flex flex-col overflow-hidden cursor-pointer select-none"
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-border-dark/50 shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <span className="material-icons-round text-sm text-primary/60">analytics</span>
                    System Overview
                </h2>
                <button
                    onClick={onToggleCollapse}
                    title="Collapse panel"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary hover:bg-card-dark transition-all"
                >
                    <span className="material-icons-round text-base">chevron_right</span>
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
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

            {/* Footer */}
            <div className="shrink-0 px-5 pb-5 pt-4 border-t border-border-dark/30">
                <button className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer p-3 rounded-lg flex items-center justify-center gap-2 text-background-dark font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                    <span className="material-icons-round text-sm">sync</span>
                    Sync All Nodes
                </button>
                <div className="text-center mt-3 text-[9px] text-slate-600 font-mono">v2.0.1-alpha</div>
            </div>
        </aside>
    );
};
