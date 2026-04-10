import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import type { NoteModel } from '../../models/NoteModel';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy, useSortable,
    arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface SongNoteContentProps {
    note: NoteModel;
    onChange: (content: any) => void;
    containerHeight: number;
    onRegisterAdd: (fn: (type: string) => void) => void;
}

interface SongSection {
    id: string;
    type: string;
    vocalistColor: string;
    lyrics: string;
}

// ── A single section row: [label rail | textarea] ──
const SongSectionRow = React.forwardRef<HTMLDivElement, {
    section: SongSection;
    handleUpdate: (id: string, updates: Partial<SongSection>) => void;
    handleDelete: (id: string) => void;
    colors: string[];
    dragHandleProps?: any;
    isDragging?: boolean;
}>(({ section, handleUpdate, handleDelete, colors, dragHandleProps, isDragging }, ref) => {
    const taRef = useRef<HTMLTextAreaElement>(null);

    const autosize = () => {
        const el = taRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    useLayoutEffect(() => { autosize(); });

    return (
        <div
            ref={ref}
            className={`group flex flex-row mb-10 transition-opacity ${isDragging ? 'opacity-30' : ''}`}
        >
            {/* Left label rail */}
            <div className="w-28 shrink-0 pt-[3px] pr-4">
                <input
                    value={section.type}
                    onChange={(e) => handleUpdate(section.id, { type: e.target.value })}
                    className="bg-transparent font-black tracking-widest uppercase text-[11px] outline-none w-full placeholder-white/20 leading-none"
                    placeholder="SECTION"
                    style={{ color: section.vocalistColor }}
                />
                {/* Color dots — appear on hover */}
                <div className="flex flex-wrap gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {colors.map((c) => (
                        <button
                            key={c}
                            onClick={() => handleUpdate(section.id, { vocalistColor: c })}
                            className="w-3 h-3 rounded-full transition-transform hover:scale-125"
                            style={{
                                backgroundColor: c,
                                opacity: section.vocalistColor === c ? 1 : 0.25,
                                boxShadow: section.vocalistColor === c ? `0 0 6px ${c}` : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Lyrics body */}
            <textarea
                ref={taRef}
                value={section.lyrics}
                onChange={(e) => { handleUpdate(section.id, { lyrics: e.target.value }); autosize(); }}
                placeholder="Write lyrics here…"
                className="flex-1 bg-transparent outline-none resize-none overflow-hidden text-[17px] leading-[1.75] font-medium text-slate-200 placeholder-slate-600"
                style={{ minHeight: '28px' }}
            />

            {/* Hover actions */}
            <div className="flex flex-col gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                <div
                    {...dragHandleProps}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-slate-500 hover:bg-white/10 cursor-grab active:cursor-grabbing touch-none"
                >
                    <span className="material-icons-round text-[14px]">drag_indicator</span>
                </div>
                <button
                    onClick={() => handleDelete(section.id)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-red-400/10 text-red-400 hover:bg-red-400/25 transition-colors"
                >
                    <span className="material-icons-round text-[14px]">close</span>
                </button>
            </div>
        </div>
    );
});

// ── Sortable wrapper ──
const SortableSongSection = (props: {
    section: SongSection;
    handleUpdate: (id: string, updates: Partial<SongSection>) => void;
    handleDelete: (id: string) => void;
    colors: string[];
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: props.section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <SongSectionRow
                section={props.section}
                handleUpdate={props.handleUpdate}
                handleDelete={props.handleDelete}
                colors={props.colors}
                dragHandleProps={{ ...attributes, ...listeners }}
                isDragging={isDragging}
            />
        </div>
    );
};

// ── Main component ──
export const SongNoteContent: React.FC<SongNoteContentProps> = ({ note, onChange, containerHeight, onRegisterAdd }) => {
    const [sections, setSections] = useState<SongSection[]>(() => {
        try {
            if (typeof note.content === 'string' && note.content.trim().startsWith('[')) {
                return JSON.parse(note.content);
            }
            if (Array.isArray(note.content)) return note.content as SongSection[];
        } catch (_) { }
        return [{ id: Date.now().toString(), type: 'Verse', vocalistColor: '#4f8ef7', lyrics: '' }];
    });

    // Refs for measuring each section's rendered height
    const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [pages, setPages] = useState<SongSection[][]>([sections]);

    // Recompute pages whenever sections change or container resizes
    useLayoutEffect(() => {
        if (containerHeight <= 0) return;
        const pageHeight = containerHeight - 80; // leave room for add-buttons row
        const newPages: SongSection[][] = [];
        let currentPage: SongSection[] = [];
        let usedHeight = 0;

        for (const section of sections) {
            const el = sectionRefs.current.get(section.id);
            const h = el ? el.getBoundingClientRect().height + 40 : 120; // 40 = mb-10 estimate
            if (usedHeight + h > pageHeight && currentPage.length > 0) {
                newPages.push(currentPage);
                currentPage = [section];
                usedHeight = h;
            } else {
                currentPage.push(section);
                usedHeight += h;
            }
        }
        if (currentPage.length > 0) newPages.push(currentPage);
        setPages(newPages.length > 0 ? newPages : [[]]);
    }, [sections, containerHeight]);

    useEffect(() => { onChange(sections); }, [sections, onChange]);

    const handleUpdate = (id: string, updates: Partial<SongSection>) =>
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

    const handleDelete = (id: string) =>
        setSections(prev => prev.filter(s => s.id !== id));

    const handleAdd = (type: string) =>
        setSections(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            type,
            vocalistColor: prev.length > 0 ? prev[prev.length - 1].vocalistColor : '#4f8ef7',
            lyrics: '',
        }]);

    // Register handleAdd with parent — use a ref to keep identity stable
    const handleAddRef = useRef(handleAdd);
    useLayoutEffect(() => { handleAddRef.current = handleAdd; });
    useEffect(() => { onRegisterAdd((t) => handleAddRef.current(t)); }, [onRegisterAdd]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over?.id) {
            const oldIndex = sections.findIndex(s => s.id === active.id);
            const newIndex = sections.findIndex(s => s.id === over.id);
            setSections(arrayMove(sections, oldIndex, newIndex));
        }
    };

    const colors = ['#4f8ef7', '#f7874f', '#f74f7a', '#5dbb6a', '#c44ff7', '#f7cf4f'];

    // Hidden measurement layer — renders all sections off-screen to measure heights
    const measurementLayer = (
        <div className="absolute opacity-0 pointer-events-none top-0 left-0 w-[550px]" aria-hidden>
            {sections.map(section => (
                <SongSectionRow
                    key={section.id}
                    ref={(el) => {
                        if (el) sectionRefs.current.set(section.id, el);
                        else sectionRefs.current.delete(section.id);
                    }}
                    section={section}
                    handleUpdate={() => {}}
                    handleDelete={() => {}}
                    colors={colors}
                />
            ))}
        </div>
    );

    return (
        <div className="relative flex-1 flex flex-col min-h-0">
            {measurementLayer}

            {/* ── Page columns — horizontal scroll ── */}
            <div className="flex-1 flex flex-row gap-16 overflow-x-auto overflow-y-hidden min-h-0 pr-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {pages.map((pageSections, pageIdx) => (
                            <div
                                key={pageIdx}
                                className="shrink-0 flex flex-col pt-4"
                                style={{ width: '520px' }}
                            >
                                {pageSections.map(section => (
                                    <SortableSongSection
                                        key={section.id}
                                        section={section}
                                        handleUpdate={handleUpdate}
                                        handleDelete={handleDelete}
                                        colors={colors}
                                    />
                                ))}
                            </div>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

        </div>
    );
};
