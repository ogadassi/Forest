import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { SystemStats } from './SystemStats';
import { Outlet } from 'react-router-dom';
import { CreateCategoryModal } from '../modals/CreateCategoryModal';
import { EditNoteModal } from '../modals/EditNoteModal';
import { SmartSearchBar } from './SmartSearchBar';
import { LoaderScreen } from './LoaderScreen';

import { categoryService } from '../../services/CategoryService';
import type { CategoryModel } from '../../models/CategoryModel';
import type { NoteModel } from '../../models/NoteModel';

type WidgetType = 'notes' | 'checklist' | 'timer' | 'music';

const LEFT_DEFAULT = 256;
const LEFT_COLLAPSED = 60;

const RIGHT_COLLAPSED_WIDTH = 36;
const RIGHT_DEFAULT = 320;

export const MainLayout: React.FC = () => {
    const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
    const [pendingWidgetType, setPendingWidgetType] = useState<WidgetType>('notes');
    const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);

    // Close widget picker on ESC
    useEffect(() => {
        if (!isWidgetPickerOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsWidgetPickerOpen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isWidgetPickerOpen]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [selectedNote, setSelectedNote] = useState<NoteModel | null>(null);
    const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // Left sidebar (Persisted in localStorage)
    const [leftCollapsed, setLeftCollapsed] = useState(() => {
        const saved = localStorage.getItem('forest-sidebar-left-collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    // Right sidebar (Persisted in localStorage)
    const [rightCollapsed, setRightCollapsed] = useState(() => {
        const saved = localStorage.getItem('forest-sidebar-right-collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    // Update localStorage whenever collapse state changes
    useEffect(() => {
        localStorage.setItem('forest-sidebar-left-collapsed', JSON.stringify(leftCollapsed));
    }, [leftCollapsed]);

    useEffect(() => {
        localStorage.setItem('forest-sidebar-right-collapsed', JSON.stringify(rightCollapsed));
    }, [rightCollapsed]);

    // Auto icon-only when left is narrow
    const leftIconOnly = leftCollapsed;

    // Global search shortcut — uses capture phase on window so nothing can stop it
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
                e.preventDefault();
                e.stopPropagation();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handler, { capture: true });
        return () => window.removeEventListener('keydown', handler, { capture: true });
    }, []);

    useEffect(() => {
        categoryService.getAllCategories()
            .then(data => { setCategories(data); setIsConnected(true); })
            .catch(err => { console.error('Connection check/fetch failed:', err); setIsConnected(false); });
    }, [refreshKey]);

    useEffect(() => {
        // Import socket service inside the component or at the top
        import('../../services/SocketService').then(({ socketService }) => {
            socketService.connect();

            // When another client updates data, we trigger a refresh
            // Debounce so rapid events don't crush the frontend
            let timeout: ReturnType<typeof setTimeout> | null = null;
            const handleUpdate = () => {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => {
                    setRefreshKey(prev => prev + 1);
                }, 1000); // 1-second debounce
            };

            socketService.on("note-updated", handleUpdate);
            socketService.on("category-updated", handleUpdate);

            // Cleanup on unmount
            return () => {
                if (timeout) clearTimeout(timeout);
                socketService.off("note-updated", handleUpdate);
                socketService.off("category-updated", handleUpdate);
                socketService.disconnect();
            };
        }).catch(err => console.error("Failed to load socket service", err));
    }, []);

    const handleNoteCreated = () => setRefreshKey(prev => prev + 1);

    const handleLeftToggle = () => setLeftCollapsed((v: boolean) => !v);

    const leftActualWidth = leftCollapsed ? LEFT_COLLAPSED : LEFT_DEFAULT;
    const rightActualWidth = rightCollapsed ? RIGHT_COLLAPSED_WIDTH : RIGHT_DEFAULT;

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    return (
        <div className="flex h-screen overflow-hidden bg-transparent text-slate-100 font-display">

            {/* ── LOADER SCREEN ── */}
            {isConnected === null && <LoaderScreen />}

            {/* ── LEFT SIDEBAR ── */}
            <div
                className="relative flex-shrink-0"
                style={{ width: leftActualWidth, transition: isMounted ? 'width 0.18s cubic-bezier(0.4,0,0.2,1)' : 'none' }}
            >
                <Sidebar
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    iconOnly={leftIconOnly}
                    onToggleCollapse={handleLeftToggle}
                />
            </div>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-border-dark flex items-center justify-between px-6 bg-transparent z-10 shrink-0">
                    <div className="flex items-center gap-5">
                        <h1 className="text-lg font-bold tracking-tight text-slate-100">Forest</h1>

                        <div
                            className="flex items-center gap-2 text-[10px] font-mono border border-border-dark/50 px-2 py-1 rounded-full bg-card-dark"
                            title={isConnected ? 'Connected to Backend' : 'Backend Disconnected/Error'}
                        >
                            <div className={`w-2 h-2 rounded-full ${isConnected === true ? 'bg-primary shadow-[0_0_8px_rgba(93,187,106,0.5)]' : isConnected === false ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                            <span className={isConnected === true ? 'text-primary' : isConnected === false ? 'text-red-400' : 'text-slate-500'}>
                                {isConnected === true ? 'ONLINE' : isConnected === false ? 'OFFLINE' : 'CONNECTING...'}
                            </span>
                        </div>

                        <div className="h-6 w-px bg-border-dark" />

                        {selectedCategoryId ? (
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg">
                                <span className="material-icons-round text-sm">folder_open</span>
                                {categories.find(c => c.id === selectedCategoryId)?.name || 'Category'}
                                <button onClick={() => setSelectedCategoryId(null)} className="ml-2 hover:text-white transition-colors">
                                    <span className="material-icons-round text-sm">close</span>
                                </button>
                            </div>
                        ) : (
                            <SmartSearchBar
                                categories={categories}
                                isOpen={isSearchOpen}
                                onOpenChange={setIsSearchOpen}
                                onSelectCategory={(id) => { setSelectedCategoryId(id); }}
                                onOpenNote={(note) => { setSelectedNote(note); setIsEditNoteOpen(true); }}
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Global note creation removed; handled contextually in CategoryPanel */}
                    </div>
                </header>

                <div className="flex-1 overflow-hidden relative">
                    <Outlet context={{ refreshKey, selectedCategoryId, setSelectedCategoryId, setRefreshKey, setCategories }} />

                    {/* ── FAB ─ inside dashboard only ── */}
                    {!selectedCategoryId && (
                        <button
                            onClick={() => setIsWidgetPickerOpen(prev => !prev)}
                            className="absolute bottom-8 right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                            title="Create Widget"
                            style={{
                                background: 'linear-gradient(135deg, #5dbb6a 0%, #3d9e4a 100%)',
                                boxShadow: isWidgetPickerOpen
                                    ? '0 0 0 8px rgba(93,187,106,0.15), 0 8px 32px rgba(93,187,106,0.4)'
                                    : '0 8px 32px rgba(93,187,106,0.3), 0 2px 8px rgba(0,0,0,0.4)',
                            }}
                        >
                            <span
                                className="material-icons-round text-2xl text-[#1a231d] transition-transform duration-300"
                                style={{ transform: isWidgetPickerOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                            >
                                add
                            </span>
                        </button>
                    )}
                </div>
            </main>

            {/* ── RIGHT SIDEBAR ── */}
            <div
                className="relative flex-shrink-0"
                style={{ width: rightActualWidth, transition: isMounted ? 'width 0.22s cubic-bezier(0.4,0,0.2,1)' : 'none' }}
            >
                <SystemStats
                    refreshKey={refreshKey}
                    collapsed={rightCollapsed}
                    onToggleCollapse={() => setRightCollapsed((v: boolean) => !v)}
                />
            </div>

            {/* CreateNoteModal moved to BoardView */}

            {/* ── WIDGET PICKER OVERLAY ── radial bloom */}
            {isWidgetPickerOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    style={{ background: 'rgba(8,13,9,0.55)' }}
                    onClick={() => setIsWidgetPickerOpen(false)}
                >
                    {/* Radial hub */}
                    <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>

                        {/* Dark Circular Background for Readability */}
                        <div 
                            className="absolute pointer-events-none z-0"
                            style={{
                                width: 440, height: 440,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(14,18,15,0.98) 0%, rgba(14,18,15,0.95) 55%, transparent 80%)',
                                animation: 'hub-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
                            }}
                        />

                        {/* Center hub — decorative origin dot */}
                        <div
                            className="absolute rounded-full z-10"
                            style={{
                                width: 20, height: 20,
                                background: 'radial-gradient(circle, rgba(93,187,106,0.9) 0%, rgba(93,187,106,0.3) 100%)',
                                boxShadow: '0 0 16px rgba(93,187,106,0.6), 0 0 40px rgba(93,187,106,0.2)',
                                animation: 'hub-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
                            }}
                        />

                        {/* Spoke lines (connecting hub to petals) */}
                        {[
                            { angle: -135, color: '#5dbb6a' },
                            { angle:  -45, color: '#4f8ef7' },
                            { angle:   45, color: '#f7874f' },
                            { angle:  135, color: '#c44ff7' },
                        ].map((s, i) => {
                            const rad = (s.angle * Math.PI) / 180;
                            const x2 = Math.cos(rad) * 120;
                            const y2 = Math.sin(rad) * 120;
                            return (
                                <svg
                                    key={i}
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ width: 320, height: 320, overflow: 'visible', animation: `spoke-in 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}
                                >
                                    <line
                                        x1="160" y1="160"
                                        x2={160 + x2} y2={160 + y2}
                                        stroke={s.color}
                                        strokeWidth="1"
                                        strokeOpacity="0.25"
                                        strokeDasharray="4 4"
                                    />
                                </svg>
                            );
                        })}

                        {/* Petal nodes */}
                        {[
                            { type: 'notes'     as WidgetType, icon: 'dashboard', label: 'Notes Board', color: '#5dbb6a', angle: -135, delay: '0ms'   },
                            { type: 'checklist' as WidgetType, icon: 'checklist', label: 'Checklist',   color: '#4f8ef7', angle:  -45, delay: '40ms'  },
                            { type: 'timer'     as WidgetType, icon: 'timer',     label: 'Timer',       color: '#f7874f', angle:   45, delay: '80ms'  },
                            { type: 'music'     as WidgetType, icon: 'music_note',label: 'Music Board', color: '#c44ff7', angle:  135, delay: '120ms' },
                        ].map((w) => {
                            const rad = (w.angle * Math.PI) / 180;
                            const radius = 120;
                            const cx = Math.cos(rad) * radius;
                            const cy = Math.sin(rad) * radius;
                            return (
                                <button
                                    key={w.type}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        setIsWidgetPickerOpen(false);
                                        if (w.type === 'timer') {
                                            try {
                                                await categoryService.addCategory({
                                                    name: 'Timer',
                                                    color: '#f7874f',
                                                    icon: 'timer',
                                                    type: 'timer',
                                                });
                                                setRefreshKey(prev => prev + 1);
                                            } catch (err) { console.error('Failed to create timer widget', err); }
                                        } else {
                                            setPendingWidgetType(w.type);
                                            setIsCreateCategoryOpen(true);
                                        }
                                    }}
                                    className="absolute group flex flex-col items-center gap-2"
                                    style={{
                                        left: `calc(50% + ${cx}px)`,
                                        top: `calc(50% + ${cy}px)`,
                                        transform: 'translate(-50%, -50%)',
                                        animation: `petal-in 0.5s cubic-bezier(0.16,1,0.3,1) ${w.delay} both`,
                                    }}
                                    title={w.label}
                                >
                                    {/* Orb */}
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-115 group-active:scale-95"
                                        style={{
                                            background: `radial-gradient(circle at 35% 35%, ${w.color}55, ${w.color}18)`,
                                            border: `1.5px solid ${w.color}60`,
                                            boxShadow: `0 0 30px ${w.color}35, 0 0 60px ${w.color}15, inset 0 1px 0 ${w.color}40`,
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow =
                                                `0 0 50px ${w.color}70, 0 0 100px ${w.color}30, inset 0 1px 0 ${w.color}60`;
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow =
                                                `0 0 30px ${w.color}35, 0 0 60px ${w.color}15, inset 0 1px 0 ${w.color}40`;
                                        }}
                                    >
                                        <span
                                            className="material-icons-round text-4xl transition-transform duration-200 group-hover:scale-110"
                                            style={{ color: w.color, filter: `drop-shadow(0 0 8px ${w.color}90)` }}
                                        >
                                            {w.icon}
                                        </span>
                                    </div>
                                    {/* Label */}
                                    <span
                                        className="text-xs font-black tracking-wide whitespace-nowrap transition-opacity duration-200 opacity-70 group-hover:opacity-100"
                                        style={{ color: w.color, textShadow: `0 0 12px ${w.color}80` }}
                                    >
                                        {w.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ESC hint */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-600 flex items-center gap-1.5"
                        style={{ animation: 'hub-in 0.4s 0.2s both' }}>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">ESC</kbd>
                        <span>to cancel</span>
                    </div>

                    <style>{`
                        @keyframes hub-in {
                            from { opacity: 0; transform: scale(0.5); }
                            to   { opacity: 1; transform: scale(1); }
                        }
                        @keyframes spoke-in {
                            from { opacity: 0; }
                            to   { opacity: 1; }
                        }
                        @keyframes petal-in {
                            from { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
                            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        }
                        .group-hover\\:scale-115:hover { transform: scale(1.15); }
                    `}</style>
                </div>
            )}


            <CreateCategoryModal
                isOpen={isCreateCategoryOpen}
                onClose={() => setIsCreateCategoryOpen(false)}
                onCategoryCreated={handleNoteCreated}
                defaultType={pendingWidgetType as 'notes' | 'checklist' | 'timer' | 'music'}
            />

            {selectedNote && (
                <EditNoteModal
                    isOpen={isEditNoteOpen}
                    note={selectedNote}
                    onClose={() => { setIsEditNoteOpen(false); setSelectedNote(null); }}
                    onNoteUpdated={() => { }}
                />
            )}
        </div>
    );
};
