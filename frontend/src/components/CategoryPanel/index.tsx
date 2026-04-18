import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import type { CategoryModel } from '../../models/CategoryModel';
import type { NoteModel } from '../../models/NoteModel';
import { TimerNote } from '../board/TimerNote';
import { CategoryHeader } from './CategoryHeader';
import { ChecklistList } from './ChecklistList';
import { CategoryGrid } from './CategoryGrid';

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

interface GridItem {
    i: string; x: number; y: number;
    w: number; h: number; minW?: number; minH?: number;
}
type Layouts = { [breakpoint: string]: GridItem[] };

function getNoteMinWForBreakpoint(bp: string): number {
    if (bp === 'lg') return 5;
    if (bp === 'md') return 6;
    if (bp === 'sm') return 6;
    if (bp === 'xs') return 4;
    return 2;
}

function loadNoteLayouts(categoryId: number): Layouts {
    try { return JSON.parse(localStorage.getItem(`forest-notes-layout-v2-${categoryId}`) ?? '{}'); } catch { return {}; }
}
function saveNoteLayouts(categoryId: number, layouts: Layouts) {
    localStorage.setItem(`forest-notes-layout-v2-${categoryId}`, JSON.stringify(layouts));
}

function buildDefaultNoteLayouts(notes: NoteModel[], existing: Layouts): Layouts {
    const newLayouts: Layouts = { lg: [], md: [], sm: [], xs: [], xxs: [] };
    ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => {
        const base = existing[bp] || [];
        const existingIds = new Set(base.map(l => l.i));
        const missing = notes.filter(n => !existingIds.has(String(n.id)));
        const validBase = base.filter(l => notes.some(n => String(n.id) === l.i));

        let w = 4;
        if (bp === 'md') w = 5;
        if (bp === 'sm') w = 6;
        if (bp === 'xs' || bp === 'xxs') w = COLS[bp as keyof typeof COLS];

        const colsForBp = COLS[bp as keyof typeof COLS];
        const itemsPerRow = Math.max(1, Math.floor(colsForBp / w));

        const minW = getNoteMinWForBreakpoint(bp);

        const newItems: GridItem[] = missing.map((note, idx) => ({
            i: String(note.id),
            x: ((validBase.length + idx) % itemsPerRow) * w,
            y: Math.floor((validBase.length + idx) / itemsPerRow) * 9,
            w: Math.max(minW, w), h: 8, minW, minH: 2,
        }));
        newLayouts[bp] = [...validBase, ...newItems];
    });
    return newLayouts;
}

interface CategoryPanelProps {
    category: CategoryModel;
    notes: NoteModel[];
    onNoteClick: (note: NoteModel) => void;
    onUpdateCategory: (updates: Partial<CategoryModel>) => void;
    onDelete: () => void;
    onAddNoteClick?: () => void;
    isFullscreenView?: boolean;
    onHeaderClick?: () => void;
    onRefreshNotes?: () => void;
    onUpdateNoteOptimistic?: (updatedNote: NoteModel, apiCall: () => Promise<void>) => void;
    onDeleteNoteOptimistic?: (noteId: number, apiCall: () => Promise<void>) => void;
    onAutoResize?: (pixelHeight?: number, pixelWidth?: number) => void;
}

export const CategoryPanel: React.FC<CategoryPanelProps> = ({
    category, notes, onNoteClick, onUpdateCategory, onDelete, onAddNoteClick, isFullscreenView, onHeaderClick, onRefreshNotes, onUpdateNoteOptimistic, onAutoResize
}) => {
    const color = category.color || '#5DBB6A';
    const icon = category.icon || 'folder';

    const [layouts, setLayouts] = useState<Layouts>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const checklistItemsRef = useRef<HTMLDivElement>(null);
    const checklistAddBarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const saved = loadNoteLayouts(category.id!);
        if (saved && Object.keys(saved).length > 0) {
            const reconciled = { ...saved };
            Object.keys(BREAKPOINTS).forEach(bp => {
                if (reconciled[bp]) {
                    const minW = getNoteMinWForBreakpoint(bp);
                    reconciled[bp] = reconciled[bp].map(item => ({ ...item, minW, minH: 2, w: Math.max(minW, item.w!) }));
                }
            });
            setLayouts(reconciled);
        } else {
            const initial = buildDefaultNoteLayouts(notes, {});
            setLayouts(initial);
        }
    }, [category.id, notes.length]);

    // Mirror containerWidth in a ref so handleLayoutChange can read it without a stale closure
    const containerWidthRef = useRef<number>(0);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        setContainerWidth(el.offsetWidth);
        setContainerHeight(el.offsetHeight);
        containerWidthRef.current = el.offsetWidth;
        const ro = new ResizeObserver(entries => {
            const w = entries[0].contentRect.width;
            const h = entries[0].contentRect.height;
            containerWidthRef.current = w;
            setContainerWidth(w);
            setContainerHeight(h);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Grid constants — must match CategoryGrid.tsx
    const INNER_COLS = 12;
    const INNER_MARGIN = 8;
    const CONTAINER_PAD = 12;

    const colWidthAt = (cw: number) =>
        (cw - 2 * CONTAINER_PAD - (INNER_COLS - 1) * INNER_MARGIN) / INNER_COLS;

    const handleLayoutChange = useCallback((_currentLayout: readonly GridItem[], allLayouts: any) => {
        const cw = containerWidthRef.current;
        const colW = colWidthAt(cw);

        setLayouts(prev => {
            const merged = { ...prev };
            Object.keys(allLayouts).forEach(bp => {
                const currentArr = allLayouts[bp] as GridItem[];
                const unseen = (merged[bp] || []).filter(oldItem => !currentArr.find(a => a.i === oldItem.i));

                // Convert column w/x to pixels and store alongside column values.
                // CategoryGrid will use pxW/pxX to compute stable column counts at current size.
                const withPixels = currentArr.map((item: any) => ({
                    ...item,
                    pxW: colW > 0 ? item.w * colW + (item.w - 1) * INNER_MARGIN : item.pxW,
                    pxX: colW > 0 ? item.x * colW + item.x * INNER_MARGIN : item.pxX,
                    pxH: item.h,
                }));
                merged[bp] = [...withPixels, ...unseen];
            });
            saveNoteLayouts(category.id!, merged);
            return merged;
        });
    }, [category.id]);


    useEffect(() => {
        if (!onAutoResize || isFullscreenView) return;
        
        const timeout = setTimeout(() => {
            const el = containerRef.current;
            if (!el) return;
            
            const root = el.closest('.category-panel-root') as HTMLElement;
            const gridItem = root?.closest('.react-grid-item') as HTMLElement;
            if (!gridItem || !root) return;

            const handleDoubleClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                const isBottomHandle = target.classList.contains('react-resizable-handle-s');
                const isCornerHandle = target.classList.contains('react-resizable-handle-se');
                const isRightHandle = target.classList.contains('react-resizable-handle-e');
                const isLeftHandle = target.classList.contains('react-resizable-handle-w');
                
                if (!isBottomHandle && !isCornerHandle && !isRightHandle && !isLeftHandle) return;
                e.stopPropagation();

                let requiredPixelHeight: number | undefined = undefined;
                let requiredPixelWidth: number | undefined = undefined;

                if (isBottomHandle || isCornerHandle) {
                    requiredPixelHeight = 0;
                    if (category.type === 'timer') {
                        // Timer: measure the timer content element directly
                        const timerEl = root.querySelector('.timer-snap-root') as HTMLElement;
                        const headerOff = (root.querySelector('.panel-header') as HTMLElement)?.offsetHeight ?? 60;
                        requiredPixelHeight = headerOff + (timerEl?.scrollHeight ?? 200) + 24;

                    } else if (category.type === 'checklist') {
                        const itemsEl = checklistItemsRef.current;
                        const addBar = checklistAddBarRef.current;

                        const headerOff = (root.querySelector('.panel-header') as HTMLElement)?.offsetHeight ?? 60;
                        const itemsH = itemsEl ? itemsEl.scrollHeight : (root.querySelector('.empty-checklist-state') as HTMLElement)?.offsetHeight ?? 0;
                        const addBarH = addBar ? addBar.offsetHeight : 40;
                        const pb3 = 12;
                        requiredPixelHeight = headerOff + pb3 + itemsH + addBarH + 2;

                    } else {
                        const innerGrid = root.querySelector('.notes-grid-container') as HTMLElement;
                        const header = root.querySelector('.panel-header') as HTMLElement;
                        requiredPixelHeight += header ? header.offsetHeight : 0;
                        requiredPixelHeight += 2;
                        if (innerGrid) {
                            requiredPixelHeight += innerGrid.offsetHeight;
                        }
                        requiredPixelHeight += 24;
                    }
                }

                if ((isCornerHandle || isRightHandle || isLeftHandle) && !!root) {
                    const textSpans = Array.from(
                        root.querySelectorAll('[class*="cursor-text"], .note-title, .panel-header [class*="truncate"], .panel-header > div > span')
                    ) as HTMLElement[];
                    
                    let maxTextWidth = 0;
                    textSpans.forEach(s => {
                        const prevWidth = s.style.width;
                        const prevWS = s.style.whiteSpace;
                        s.style.width = 'fit-content';
                        s.style.whiteSpace = 'nowrap';
                        maxTextWidth = Math.max(maxTextWidth, s.scrollWidth);
                        s.style.width = prevWidth;
                        s.style.whiteSpace = prevWS;
                    });
                    
                    requiredPixelWidth = maxTextWidth + 118;
                }

                onAutoResize(requiredPixelHeight, requiredPixelWidth);
            };

            gridItem.addEventListener('dblclick', handleDoubleClick);
            (root as any)._resizeDblClickCleanup = () => gridItem.removeEventListener('dblclick', handleDoubleClick);
        }, 100);

        return () => {
            clearTimeout(timeout);
            const root = containerRef.current?.closest('.category-panel-root') as any;
            if (root?._resizeDblClickCleanup) root._resizeDblClickCleanup();
        };
    }, [onAutoResize, isFullscreenView]);

    const isCompact = containerWidth > 0 && containerWidth < 280;
    const isVeryCompact = containerWidth > 0 && containerWidth < 200;

    return (
        <div
            className={`category-panel-root group/panel h-full flex flex-col rounded-2xl overflow-hidden select-none relative ${isFullscreenView ? '' : 'cursor-pointer'}`}
            onClick={(e) => {
                if (isFullscreenView) return;
                if (isDragging || isResizing) return;
                if ((e.target as HTMLElement).closest('.react-resizable-handle, .note-drag-handle')) return;
                onHeaderClick?.();
            }}
            style={{
                containerType: 'size',
                background: `linear-gradient(160deg, ${color}30 0%, rgba(26,32,27,0.6) 60%), #1e261f`,
                border: `1px solid ${color}40`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 ${color}30`,
            }}
        >
            <CategoryHeader
                category={category}
                notesCount={notes.length}
                color={color}
                icon={icon}
                isCompact={isCompact}
                isVeryCompact={isVeryCompact}
                isFullscreenView={isFullscreenView}
                onUpdateCategory={onUpdateCategory}
                onDelete={onDelete}
                onHeaderClick={onHeaderClick}
            />

            <div
                className="category-drag-cancel non-draggable flex-1 overflow-hidden p-0 relative"
                ref={containerRef}
            >
                {category.type === 'timer' ? (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        onClick={e => e.stopPropagation()}
                        style={{ padding: '12px' }}
                    >
                        <TimerNote
                            note={{
                                id: category.id,
                                title: category.name,
                                content: { timeRemaining: 300, isRunning: false, lastUpdated: Date.now(), totalTime: 300 },
                                contentType: 'timer' as const,
                                categoryId: category.id!,
                                isCompleted: false,
                                attachments: [],
                                color: color,
                            } as any}
                            color={color}
                            onUpdate={() => {}}
                        />
                    </div>
                ) : (
                    <div className={`w-full h-full overflow-x-hidden ${category.type === 'checklist' ? 'pt-0 px-3 pb-3' : ''} overflow-y-hidden`}>
                        {category.type === 'checklist' ? (
                            <ChecklistList
                                category={category}
                                color={color}
                                notes={notes}
                                onRefreshNotes={onRefreshNotes}
                                checklistItemsRef={checklistItemsRef as any}
                                checklistAddBarRef={checklistAddBarRef as any}
                            />
                        ) : notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 py-10 opacity-80 animate-in fade-in">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-card-dark/50 shadow-inner border border-white/5">
                                    <span className="material-icons-round text-2xl opacity-70">inbox</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <span className="text-sm font-semibold tracking-wide text-slate-400">Empty Category</span>
                                    <span className="text-xs text-slate-500/80">No notes here yet.</span>
                                </div>
                            </div>
                        ) : containerWidth > 0 ? (
                            <CategoryGrid
                                notes={notes}
                                layouts={layouts}
                                containerWidth={containerWidth}
                                containerHeight={containerHeight}
                                isEditing={false}
                                isDragging={isDragging}
                                setIsDragging={setIsDragging}
                                setIsResizing={setIsResizing}
                                handleLayoutChange={handleLayoutChange}
                                onNoteClick={onNoteClick}
                                onUpdateNoteOptimistic={onUpdateNoteOptimistic}
                                onRefreshNotes={onRefreshNotes}
                            />
                        ) : null}
                    </div>
                )}
            </div>

            {onAddNoteClick && category.type !== 'timer' && category.type !== 'checklist' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddNoteClick();
                    }}
                    className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-background-dark shadow-xl bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all outline-none"
                    style={{ backgroundColor: color }}
                    title="Add Note"
                >
                    <span className="material-icons-round text-xl">add</span>
                </button>
            )}
        </div>
    );
};

export default CategoryPanel;
