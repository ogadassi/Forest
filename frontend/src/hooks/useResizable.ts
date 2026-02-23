import { useCallback, useRef } from 'react';

type Side = 'left' | 'right';

interface UseResizableOptions {
    side: Side;
    minWidth: number;
    maxWidth: number;
    onResize: (newWidth: number) => void;
}

export function useResizable({ side, minWidth, maxWidth, onResize }: UseResizableOptions) {
    const isDragging = useRef(false);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const startX = e.clientX;
            const startWidth = (e.currentTarget.parentElement as HTMLElement).offsetWidth;

            const onMouseMove = (mv: MouseEvent) => {
                if (!isDragging.current) return;
                const delta = side === 'left' ? mv.clientX - startX : startX - mv.clientX;
                const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
                onResize(newWidth);
            };

            const onMouseUp = () => {
                isDragging.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        },
        [side, minWidth, maxWidth, onResize]
    );

    return { onMouseDown };
}
