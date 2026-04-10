import { useState, useEffect } from 'react';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { NoteModel } from '../../models/NoteModel';
import { noteService } from '../../services/NoteService';

export function useCategoryDrag(initialNotes: NoteModel[]) {
    const [sortedNotes, setSortedNotes] = useState<NoteModel[]>(initialNotes);

    useEffect(() => {
        setSortedNotes([...initialNotes].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }, [initialNotes]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over?.id) {
            const oldIndex = sortedNotes.findIndex(n => n.id === active.id);
            const newIndex = sortedNotes.findIndex(n => n.id === over.id);
            const newArray = arrayMove(sortedNotes, oldIndex, newIndex);
            
            setSortedNotes(newArray);
            
            const updates = newArray.map((note, index) => ({ id: note.id!, order: index }));
            try {
                await noteService.reorderNotes(updates);
            } catch (err) {
                console.error("Failed to save reorder", err);
                setSortedNotes([...initialNotes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            }
        }
    };

    return { sortedNotes, sensors, handleDragEnd };
}
