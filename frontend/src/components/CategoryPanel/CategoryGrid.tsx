import React from 'react';
import { Responsive } from 'react-grid-layout';
import type { NoteModel } from '../../models/NoteModel';
import { NoteCard } from '../board/NoteCard';
import { noteService } from '../../services/NoteService';

const ResponsiveGridLayout = Responsive as any;

interface CategoryGridProps {
    notes: NoteModel[];
    layouts: any;
    containerWidth: number;
    containerHeight: number;
    isEditing: boolean;
    isDragging: boolean;
    setIsDragging: (val: boolean) => void;
    setIsResizing: (val: boolean) => void;
    handleLayoutChange: (currentLayout: any, allLayouts: any) => void;
    onNoteClick: (note: NoteModel) => void;
    onUpdateNoteOptimistic?: (updatedNote: NoteModel, apiCall: () => Promise<void>) => void;
    onRefreshNotes?: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
    notes, layouts, containerWidth, containerHeight, isEditing, isDragging, setIsDragging, setIsResizing, handleLayoutChange, onNoteClick, onUpdateNoteOptimistic, onRefreshNotes
}) => {
    const COL_WIDTH = 60;
    const MARGIN = 16;
    const UNIT = COL_WIDTH + MARGIN;
    const ROW_HEIGHT = 60; // must match rowHeight prop below
    
    // Compute the maximum number of full columns that fit in the current container width
    const currentCols = Math.max(4, Math.floor((containerWidth + MARGIN) / UNIT));
    
    // Compute the maximum rows that fit in the available container height
    const maxRows = Math.max(1, Math.floor((containerHeight + MARGIN) / (ROW_HEIGHT + MARGIN)));
    
    // Compute the exact grid pixel width needed for these columns
    // This perfectly restricts `react-grid-layout` from altering the unit width
    const exactGridWidth = currentCols * UNIT - MARGIN;

    // --- Horizontal Centering ---
    // centeredLayouts: what the grid DISPLAYS (centered x positions).
    // normalizeCentering: reverses the offset so we always SAVE 0-based x positions.
    // This prevents cumulative drift where each save shifts notes further right.

    const applyOrRemoveCentering = (items: any[], cols: number, apply: boolean): any[] => {
        if (items.length === 0) return items;
        const rowMap = new Map<number, any[]>();
        items.forEach(item => {
            const row = rowMap.get(item.y) || [];
            row.push(item);
            rowMap.set(item.y, row);
        });
        const result: any[] = [];
        rowMap.forEach(rowItems => {
            const sorted = [...rowItems].sort((a, b) => a.x - b.x);
            const totalW = sorted.reduce((sum: number, item: any) => sum + item.w, 0);
            const leftover = cols - Math.min(totalW, cols);
            const offset = Math.floor(leftover / 2);
            let cursor = apply ? offset : 0;
            sorted.forEach(item => {
                result.push({ ...item, x: cursor });
                cursor += item.w;
            });
        });
        return result;
    };

    const centeredLayouts = applyOrRemoveCentering(
        (layouts.lg || []).map((item: any) => ({ ...item, maxW: currentCols, maxH: maxRows })),
        currentCols,
        true  // apply centering for display
    );

    // Used by handleLayoutChange: undo centering before saving
    const normalizeCentering = (items: any[]) =>
        applyOrRemoveCentering(items, currentCols, false);

    return (
        <div 
            className="h-full flex flex-col"
            onClickCapture={e => {
                if ((e.target as HTMLElement).closest('.react-resizable-handle')) {
                    e.stopPropagation();
                }
            }}
        >
            <ResponsiveGridLayout
                className="layout min-h-full pb-20 animate-fade-in notes-grid-container"
                layouts={{ lg: centeredLayouts }}
                breakpoints={{ lg: 0 }}
                cols={{ lg: currentCols }}
                rowHeight={60}
                onLayoutChange={(currentLayout: any, allLayouts: any) => {
                    // Strip centering offset before persisting — prevents cumulative drift
                    const normalized = { ...allLayouts };
                    Object.keys(normalized).forEach(bp => {
                        normalized[bp] = normalizeCentering(normalized[bp] || []);
                    });
                    handleLayoutChange(currentLayout, normalized);
                }}
                isDraggable={!isEditing}
                isResizable={!isEditing}
                dragConfig={{ handle: '.note-drag-handle', cancel: '.non-draggable' }}
                resizeConfig={{ handles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'] }}
                margin={[MARGIN, MARGIN]}
                containerPadding={[0, 0]}
                width={exactGridWidth}
                useCSSTransforms={true}
                measureBeforeMount={false}
                onDragStart={() => setIsDragging(true)}
                onDragStop={() => setTimeout(() => setIsDragging(false), 50)}
                onResizeStart={() => setIsResizing(true)}
                onResizeStop={() => setTimeout(() => setIsResizing(false), 50)}
            >
                {notes.map(note => {
                    // Use centeredLayouts so the adjusted x position is applied
                    const centeredItem = centeredLayouts.find((l: any) => l.i === String(note.id));
                    const dataGrid = centeredItem
                        ? { ...centeredItem }
                        : { x: 0, y: 0, w: 4, h: 8, maxW: currentCols, maxH: maxRows };
                    return (
                        <div key={note.id} data-grid={dataGrid} className="relative group">
                            <div
                                className="h-full cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDragging && note.contentType !== 'timer') onNoteClick(note);
                                }}
                            >
                                <NoteCard
                                    note={note}
                                    hasLeftHandle
                                    onClick={() => {}}
                                    onDelete={async () => {
                                        try {
                                            await noteService.deleteNote(note.id!);
                                            if (onRefreshNotes) onRefreshNotes();
                                        } catch (err) { console.error('Failed to delete note', err); }
                                    }}
                                    onUpdate={(updates) => {
                                        const updatedNote: NoteModel = { ...note, ...updates };
                                        if (onUpdateNoteOptimistic) {
                                            onUpdateNoteOptimistic(updatedNote, () => noteService.updateNote(updatedNote).then(() => {}));
                                        } else {
                                            noteService.updateNote(updatedNote);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
        </div>
    );
};
