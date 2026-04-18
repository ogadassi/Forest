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
    // Fixed 12-column inner grid.
    // react-grid-layout computes colWidth = (containerWidth - MARGIN*(COLS-1)) / COLS
    // so the grid ALWAYS fills the panel exactly — no leftover pixel gap.
    // w=12 = full width, w=6 = half, w=4 = third. Centering is mathematically exact.
    const INNER_COLS = 12;
    const MARGIN = 8;
    const ROW_HEIGHT = 60;

    const maxRows = Math.max(1, Math.floor((containerHeight + MARGIN) / (ROW_HEIGHT + MARGIN)));

    // No forced centering — the panel is a grid and users own note positions.
    // Layout items with saved positions are rendered as-is.
    const rawLayouts = layouts.lg || [];

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
                layouts={{ lg: rawLayouts.map((item: any) => ({ ...item, maxW: INNER_COLS, maxH: maxRows })) }}
                breakpoints={{ lg: 0 }}
                cols={{ lg: INNER_COLS }}
                rowHeight={ROW_HEIGHT}
                onLayoutChange={handleLayoutChange}
                isDraggable={!isEditing}
                isResizable={!isEditing}
                dragConfig={{ handle: '.note-drag-handle', cancel: '.non-draggable' }}
                resizeConfig={{ handles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'] }}
                margin={[MARGIN, MARGIN]}
                containerPadding={[12, 8]}
                width={containerWidth}
                useCSSTransforms={true}
                measureBeforeMount={false}
                onDragStart={() => setIsDragging(true)}
                onDragStop={() => setTimeout(() => setIsDragging(false), 50)}
                onResizeStart={() => setIsResizing(true)}
                onResizeStop={() => setTimeout(() => setIsResizing(false), 50)}
            >
                {notes.map(note => {
                    const lgLayout = rawLayouts.find((l: any) => l.i === String(note.id));
                    // New notes default to full panel width (w=12, x=0).
                    // Users can resize/reposition freely — saved positions are always respected.
                    const dataGrid = lgLayout
                        ? { ...lgLayout, maxW: INNER_COLS, maxH: maxRows }
                        : { x: 0, y: 0, w: INNER_COLS, h: 8, maxW: INNER_COLS, maxH: maxRows };
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
