import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import type { CategoryModel } from '../models/CategoryModel';
import type { NoteModel } from '../models/NoteModel';
import { categoryService } from '../services/CategoryService';
import { noteService } from '../services/NoteService';
import { CategoryPanel } from '../components/board/CategoryPanel';
import { EditNoteModal } from '../components/modals/EditNoteModal';
import { CreateNoteModal } from '../components/modals/CreateNoteModal';

// Use standard named import now that WidthProvider is completely removed
import { Responsive } from 'react-grid-layout';
// The types for Responsive properties are often incomplete, so we cast to any for JSX usage
const ResponsiveGridLayout = Responsive as any;

const STORAGE_KEY = 'forest-dashboard-responsive-layout';
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 18, md: 15, sm: 9, xs: 6, xxs: 3 };
const ROW_HEIGHT = 20;

interface GridItem {
    i: string; x: number; y: number;
    w: number; h: number; minW?: number; minH?: number;
}
type Layouts = { [breakpoint: string]: GridItem[] };

function buildDefaultLayouts(categories: CategoryModel[], existing: Layouts): Layouts {
    const newLayouts: Layouts = { lg: [], md: [], sm: [], xs: [], xxs: [] };

    // For each breakpoint, figure out which panels are missing
    ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => {
        const base = existing[bp] || [];
        const existingIds = new Set(base.map(l => l.i));
        const missing = categories.filter(c => !existingIds.has(String(c.id)));
        const validBase = base.filter(l => categories.some(c => String(c.id) === l.i));

        // Define responsive widths based on breakpoint cols
        let w = 6; // default lg (1/3 of 18 cols)
        if (bp === 'md') w = 7; // ~1/2 of 15
        if (bp === 'sm') w = 9; // full
        if (bp === 'xs' || bp === 'xxs') w = COLS[bp as keyof typeof COLS]; // full

        const colsForBp = COLS[bp as keyof typeof COLS];
        const itemsPerRow = Math.max(1, Math.floor(colsForBp / w));

        const newItems: GridItem[] = missing.map((cat, idx) => ({
            i: String(cat.id),
            x: ((validBase.length + idx) % itemsPerRow) * w,
            y: Math.floor((validBase.length + idx) / itemsPerRow) * 29,
            w, h: 27, minW: 1, minH: 7,
        }));

        newLayouts[bp] = [...validBase, ...newItems];
    });

    return newLayouts;
}

function loadLayouts(): Layouts {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}
function saveLayouts(layouts: Layouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
}

export const BoardView: React.FC = () => {
    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [notes, setNotes] = useState<NoteModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [layouts, setLayouts] = useState<Layouts>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Read real container width before paint, then keep it updated on resize
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        setContainerWidth(el.offsetWidth);
        const ro = new ResizeObserver(entries => {
            setContainerWidth(entries[0].contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const [selectedNote, setSelectedNote] = useState<NoteModel | null>(null);
    const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);

    // Note creation state
    const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
    const [createNoteCategoryId, setCreateNoteCategoryId] = useState<number | undefined>(undefined);

    const { refreshKey, selectedCategoryId, setSelectedCategoryId, setCategories: setGlobalCategories } =
        useOutletContext<{
            refreshKey: number;
            selectedCategoryId: number | null;
            setSelectedCategoryId: (id: number | null) => void;
            setCategories?: React.Dispatch<React.SetStateAction<CategoryModel[]>>;
        }>();

    const [internalRefresh, setInternalRefresh] = useState(0);

    const loadData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            const [fetchedCategories, fetchedNotes] = await Promise.all([
                categoryService.getAllCategories(),
                noteService.getAllNotes()
            ]);
            setCategories(fetchedCategories);
            setNotes(fetchedNotes);

            setNotes(fetchedNotes);

            // Clean up deletedNoteIds for elements that the server confirms are gone
            const serverNoteIds = new Set(fetchedNotes.map(n => n.id));
            deletedNoteIds.current.forEach(id => {
                if (!serverNoteIds.has(id)) {
                    deletedNoteIds.current.delete(id);
                }
            });

            // Clean up optimisticOverrides that have no actively pending mutations
            setOptimisticOverrides(prev => {
                if (Object.keys(prev).length === 0) return prev;
                const next = { ...prev };
                Object.keys(next).forEach(key => {
                    const id = Number(key);
                    if (!mutationCounts.current[id] || mutationCounts.current[id] <= 0) {
                        delete next[id];
                    }
                });
                return next;
            });

            // Reconcile layouts with fetched categories
            const saved = loadLayouts();
            if (saved && Object.keys(saved).length > 0) {
                // Ensure new categories have a layout slot
                const reconciled = { ...saved };
                let modified = false;

                Object.keys(BREAKPOINTS).forEach(bp => {
                    if (!reconciled[bp]) reconciled[bp] = [];

                    // Force minimum dimensions on existing blocks so past layouts shrink
                    reconciled[bp] = reconciled[bp].map(item => ({ ...item, minW: 1, minH: 7 }));

                    const existingIds = new Set(reconciled[bp].map(item => item.i));

                    fetchedCategories.forEach(cat => {
                        const iStr = String(cat.id);
                        if (!existingIds.has(iStr)) {
                            // Find next available spot
                            const numCols = COLS[bp as keyof typeof COLS];
                            const itemWidth = Math.min(4, numCols);
                            const lastItem = reconciled[bp].reduce((prev, current) => (prev.y > current.y) ? prev : current, { y: 0, h: 0 } as GridItem);
                            reconciled[bp].push({ i: iStr, x: 0, y: (lastItem?.y || 0) + (lastItem?.h || 0), w: itemWidth, h: 27, minW: 1, minH: 7 });
                            modified = true;
                        }
                    });
                });

                setLayouts(reconciled);
                if (modified) saveLayouts(reconciled);
            } else {
                const initial = buildDefaultLayouts(fetchedCategories, {});
                setLayouts(initial);
            }

        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [refreshKey, internalRefresh]);

    // Initial load vs background refresh logic
    useEffect(() => {
        // We only want the loading skeleton on the very first mount
        const isFirstMount = categories.length === 0 && notes.length === 0;
        loadData(isFirstMount);
    }, [loadData]);

    const handleLayoutChange = useCallback((_currentLayout: readonly GridItem[], allLayouts: any) => {
        // react-grid-layout returns the full dictionary of all breakpoints in the second argument
        // We need to merge the current rendered (filtered) items into the active hidden items
        setLayouts(prev => {
            const merged = { ...prev };
            Object.keys(allLayouts).forEach(bp => {
                const oldItems = prev[bp] || [];
                const newItems = allLayouts[bp] || [];

                // Keep old items that aren't in the new array (because they are currently filtered out)
                const missingItems = oldItems.filter(old => !newItems.some((n: any) => n.i === old.i));
                merged[bp] = [...newItems, ...missingItems];
            });
            saveLayouts(merged);
            return merged;
        });
    }, []);

    // Handle Note Edit
    const handleNoteClick = (note: NoteModel) => {
        setSelectedNote(note);
        setIsEditNoteModalOpen(true);
    };

    // --- Optimistic Checkbox/Delete Handlers ---
    const mutationCounts = useRef<Record<number, number>>({});
    const deletedNoteIds = useRef<Set<number>>(new Set());
    const [optimisticOverrides, setOptimisticOverrides] = useState<Record<number, NoteModel>>({});

    const handleUpdateNoteOptimistic = useCallback((updatedNote: NoteModel, apiCall: () => Promise<void>) => {
        const id = updatedNote.id!;
        mutationCounts.current[id] = (mutationCounts.current[id] || 0) + 1;
        console.log(`[BoardView Optimistic] Queuing UPDATE for Note ${id} (count: ${mutationCounts.current[id]})`);

        setOptimisticOverrides(prev => ({ ...prev, [id]: updatedNote }));

        // Execute API call and handle cleanup
        apiCall().catch(err => {
            console.error("Optimistic note update failed", err);
        }).finally(() => {
            mutationCounts.current[id] -= 1;
            console.log(`[BoardView Optimistic] UPDATE Resolved for Note ${id} (count remaining: ${mutationCounts.current[id]})`);
            if (mutationCounts.current[id] <= 0) {
                delete mutationCounts.current[id];
                // Do NOT delete from optimisticOverrides here!
                // We keep the optimistic state visually alive until `loadData` fetches the true database state,
                // which prevents a visual flash/blink between the API call finishing and the local state refetching.
            }
        });
    }, []);

    const handleDeleteNoteOptimistic = useCallback((noteId: number, apiCall: () => Promise<void>) => {
        deletedNoteIds.current.add(noteId);
        // Force re-render of useMemo
        setOptimisticOverrides(prev => ({ ...prev }));

        apiCall().catch(err => {
            console.error("Optimistic delete failed", err);
            deletedNoteIds.current.delete(noteId);
            setOptimisticOverrides(prev => ({ ...prev }));
        });
    }, []);


    // Handle Category Optimistic Update (Rename, Color, Icon)
    const handleCategoryUpdate = async (id: number, updates: Partial<CategoryModel>) => {
        const cat = categories.find(c => c.id === id);
        if (!cat) return;
        const updatedCat = { ...cat, ...updates };
        setCategories(prev => prev.map(c => c.id === id ? updatedCat : c));
        if (setGlobalCategories) setGlobalCategories(prev => prev.map(c => c.id === id ? updatedCat : c));
        try {
            await categoryService.updateCategory(updatedCat);
        } catch (error) {
            console.error('Failed inline update:', error);
            // Revert optimistic update
            setCategories(prev => prev.map(c => c.id === id ? cat : c));
            if (setGlobalCategories) setGlobalCategories(prev => prev.map(c => c.id === id ? cat : c));
        }
    };

    // Handle Category Deletion
    const handleDeleteCategory = async (id: number) => {
        // Optimistic UI update
        const removedCat = categories.find(c => c.id === id);
        setCategories(prev => prev.filter(c => c.id !== id));
        if (setGlobalCategories) setGlobalCategories(prev => prev.filter(c => c.id !== id));

        // If we are currently viewing this category in fullscreen, route back to Home
        if (selectedCategoryId === id) {
            setSelectedCategoryId(null);
        }

        try {
            await categoryService.deleteCategory(id);
        } catch (err) {
            console.error('Failed to delete category', err);
            // Revert on failure
            if (removedCat) {
                setCategories(prev => [...prev, removedCat]);
                if (setGlobalCategories) setGlobalCategories(prev => [...prev, removedCat]);
            }
        }
    };

    const displayedCategories = selectedCategoryId
        ? categories.filter(c => c.id === selectedCategoryId)
        : categories;

    // Filter visible layout per breakpoint
    const visibleLayouts: Layouts = {};
    Object.keys(layouts).forEach(bp => {
        visibleLayouts[bp] = layouts[bp].filter(l =>
            displayedCategories.some(c => String(c.id) === l.i)
        );
    });

    const notesByCategory = React.useMemo(() => {
        const map = new Map<number, NoteModel[]>();
        categories.forEach(c => map.set(c.id!, []));

        if (Object.keys(optimisticOverrides).length > 0) {
            console.log("[BoardView Render] Applying optimistic overrides:", Object.keys(optimisticOverrides));
        }

        // Merge base notes and optimistic overrides, and filter deleted notes
        const finalNotes = notes
            .map(n => optimisticOverrides[n.id!] || n)
            .filter(n => !deletedNoteIds.current.has(n.id!));

        // Include overrides for any items that might not currently be in base notes
        Object.values(optimisticOverrides).forEach(n => {
            if (!notes.find(bn => bn.id === n.id) && !deletedNoteIds.current.has(n.id!)) {
                finalNotes.push(n);
            }
        });

        finalNotes.forEach(n => {
            if (map.has(n.categoryId)) {
                map.get(n.categoryId)!.push(n);
            }
        });
        return map;
    }, [notes, categories, optimisticOverrides]);

    const renderContent = () => {
        if (loading && notes.length === 0) {
            return (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[400px] rounded-2xl bg-card-dark/20 animate-pulse border border-border-dark/30 flex flex-col overflow-hidden">
                            <div className="h-12 border-b border-border-dark/30 flex items-center px-4 gap-3 shrink-0">
                                <div className="w-6 h-6 rounded-lg bg-slate-700/20" />
                                <div className="h-4 w-24 bg-slate-700/20 rounded" />
                            </div>
                            <div className="p-4 space-y-3">
                                {[1, 2].map(j => (
                                    <div key={j} className="h-24 rounded-xl bg-slate-700/10 border border-slate-700/20" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (containerWidth === 0) return null;

        if (displayedCategories.length === 0 && !loading) {
            return (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6 border border-primary/20 shadow-lg shadow-primary/5">
                        <svg
                            className="w-12 h-12 text-primary opacity-80"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-display font-semibold text-white mb-2 tracking-tight">Your Forest is empty</h2>
                    <p className="text-slate-400 text-base max-w-sm mb-8 leading-relaxed">
                        Create your first category in the sidebar to start organizing your notes, ideas, and tasks.
                    </p>
                </div>
            );
        }

        // If only one category is selected (focused view), bypass the grid entirely
        if (selectedCategoryId && displayedCategories.length === 1) {
            const category = displayedCategories[0];
            return (
                <div
                    key={`single-view-${category.id}`}
                    className="h-full p-4 md:p-6 pb-20 animate-slide-in-up"
                    onClick={() => setSelectedCategoryId(null)}
                >
                    <div className="h-full cursor-default" onClick={e => e.stopPropagation()}>
                        <CategoryPanel
                            category={category}
                            notes={notesByCategory.get(category.id!) || []}
                            onNoteClick={handleNoteClick}
                            onUpdateCategory={updates => handleCategoryUpdate(category.id!, updates)}
                            onDelete={() => handleDeleteCategory(category.id!)}
                            onAddNoteClick={() => {
                                setCreateNoteCategoryId(category.id!);
                                setIsCreateNoteOpen(true);
                            }}
                            onHeaderClick={() => setSelectedCategoryId(null)}
                            onRefreshNotes={() => setInternalRefresh(prev => prev + 1)}
                            onUpdateNoteOptimistic={handleUpdateNoteOptimistic}
                            onDeleteNoteOptimistic={handleDeleteNoteOptimistic}
                            isFullscreenView={true}
                        />
                    </div>
                </div>
            );
        }

        return (
            <ResponsiveGridLayout
                key="grid-view"
                className="layout min-h-[calc(100vh-100px)] pb-20 animate-fade-in"
                layouts={visibleLayouts}
                breakpoints={BREAKPOINTS}
                cols={COLS}
                rowHeight={ROW_HEIGHT}
                width={containerWidth}
                dragConfig={{ handle: '.drag-handle', cancel: '.non-draggable' }}
                onLayoutChange={handleLayoutChange}
                onDragStart={() => setIsDragging(true)}
                onDragStop={() => {
                    // Slight delay to outlast the onClick event that fires on mouseup
                    setTimeout(() => setIsDragging(false), 50);
                }}
                margin={[14, 14]}
                containerPadding={[16, 16]}
                resizeConfig={{ handles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'] }}
            >
                {displayedCategories.map(category => (
                    <div key={String(category.id)} className="h-full">
                        <CategoryPanel
                            category={category}
                            notes={notesByCategory.get(category.id!) || []}
                            onNoteClick={handleNoteClick}
                            onUpdateCategory={updates => handleCategoryUpdate(category.id!, updates)}
                            onDelete={() => handleDeleteCategory(category.id!)}
                            onAddNoteClick={() => {
                                setCreateNoteCategoryId(category.id!);
                                setIsCreateNoteOpen(true);
                            }}
                            onHeaderClick={() => {
                                if (!isDragging) {
                                    setSelectedCategoryId(category.id!);
                                }
                            }}
                            onRefreshNotes={() => setInternalRefresh(prev => prev + 1)}
                            onUpdateNoteOptimistic={handleUpdateNoteOptimistic}
                            onDeleteNoteOptimistic={handleDeleteNoteOptimistic}
                        />
                    </div>
                ))}
            </ResponsiveGridLayout>
        );
    };

    return (
        <div ref={containerRef} className="h-full w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {renderContent()}

            <EditNoteModal
                isOpen={isEditNoteModalOpen}
                onClose={() => setIsEditNoteModalOpen(false)}
                note={selectedNote}
                onNoteUpdated={(updatedNote, deletedId) => {
                    if (updatedNote) {
                        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
                    } else if (deletedId) {
                        setNotes(prev => prev.filter(n => n.id !== deletedId));
                    }
                }}
            />

            <CreateNoteModal
                isOpen={isCreateNoteOpen}
                onClose={() => {
                    setIsCreateNoteOpen(false);
                    setCreateNoteCategoryId(undefined);
                }}
                onNoteCreated={() => {
                    setInternalRefresh(prev => prev + 1);
                    setCreateNoteCategoryId(undefined);
                }}
                categoryId={createNoteCategoryId}
            />
        </div>
    );
};
