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
    notes, layouts, containerWidth, isEditing, isDragging, setIsDragging, setIsResizing, handleLayoutChange, onNoteClick, onUpdateNoteOptimistic, onRefreshNotes
}) => {
    const COL_WIDTH = 60;
    const MARGIN = 16;
    const UNIT = COL_WIDTH + MARGIN;
    
    // Compute the maximum number of full columns that fit in the current container width
    const currentCols = Math.max(4, Math.floor((containerWidth + MARGIN) / UNIT));
    
    // Compute the exact grid pixel width needed for these columns
    // This perfectly restricts `react-grid-layout` from altering the unit width
    const exactGridWidth = currentCols * UNIT - MARGIN;

    return (
        <div 
            className="h-full" 
            onClickCapture={e => {
                if ((e.target as HTMLElement).closest('.react-resizable-handle')) {
                    e.stopPropagation();
                }
            }}
        >
            <ResponsiveGridLayout
                className="layout min-h-full pb-20 animate-fade-in notes-grid-container"
                layouts={{ lg: layouts.lg || [] }}
                breakpoints={{ lg: 0 }}
                cols={{ lg: currentCols }}
                rowHeight={60}
                onLayoutChange={handleLayoutChange}
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
                    const lgLayout = layouts.lg?.find((l: any) => l.i === String(note.id));
                    const dataGrid = lgLayout ? { ...lgLayout } : { x: 0, y: 0, w: 4, h: 8 };
                    return (
                        <div key={note.id} data-grid={dataGrid} className="relative group">
                            <div
                                className="note-drag-handle absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center"
                                title="Drag to move"
                                onClick={e => e.stopPropagation()}
                                onPointerDown={e => e.stopPropagation()}
                            >
                                <span className="material-icons-round text-sm text-slate-400">drag_indicator</span>
                            </div>
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
