import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { SystemStats } from './SystemStats';
import { Outlet } from 'react-router-dom';
import { CreateCategoryModal } from '../modals/CreateCategoryModal';
import { EditNoteModal } from '../modals/EditNoteModal';
import { SmartSearchBar } from './SmartSearchBar';

import { categoryService } from '../../services/CategoryService';
import type { CategoryModel } from '../../models/CategoryModel';
import type { NoteModel } from '../../models/NoteModel';

const LEFT_DEFAULT = 256;
const LEFT_COLLAPSED = 60;

const RIGHT_COLLAPSED_WIDTH = 36;
const RIGHT_DEFAULT = 320;

export const MainLayout: React.FC = () => {
    const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
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
        <div className="flex h-screen overflow-hidden bg-background-dark text-slate-100 font-display">

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
                    onCreateCategory={() => setIsCreateCategoryOpen(true)}
                />
            </div>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-border-dark flex items-center justify-between px-6 bg-background-dark z-10 shrink-0">
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

            <CreateCategoryModal
                isOpen={isCreateCategoryOpen}
                onClose={() => setIsCreateCategoryOpen(false)}
                onCategoryCreated={handleNoteCreated}
            />

            {selectedNote && (
                <EditNoteModal
                    isOpen={isEditNoteOpen}
                    note={selectedNote}
                    onClose={() => { setIsEditNoteOpen(false); setSelectedNote(null); }}
                    onNoteUpdated={handleNoteCreated}
                />
            )}
        </div>
    );
};
