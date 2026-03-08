import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ImageOverlay {
    el: HTMLImageElement;
    rect: DOMRect;
    editorRect: DOMRect;
}

interface Props {
    editorRef: React.RefObject<HTMLDivElement | null>;
    onUpdate: () => void;
}

const HANDLE_SIZE = 10;

type HandlePos = 'nw' | 'ne' | 'sw' | 'se';

const cursors: Record<HandlePos, string> = {
    nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
};

export const ImageResizer: React.FC<Props> = ({ editorRef, onUpdate }) => {
    const [overlay, setOverlay] = useState<ImageOverlay | null>(null);
    const resizingRef = useRef<{ handle: HandlePos; startX: number; startY: number; startW: number; startH: number } | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Recalculate overlay position when window scrolls/resizes
    const refreshRect = useCallback(() => {
        if (overlay && editorRef.current) {
            const rect = overlay.el.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();
            setOverlay(prev => prev ? { ...prev, rect, editorRect } : null);
        }
    }, [overlay, editorRef]);

    // Click on an img inside the editor → show overlay
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
                e.preventDefault();
                const img = target as HTMLImageElement;
                const rect = img.getBoundingClientRect();
                const editorRect = editor.getBoundingClientRect();
                setOverlay({ el: img, rect, editorRect });
            } else {
                setOverlay(null);
            }
        };

        const handleDragStart = (e: DragEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
                setOverlay(null);
            }
        };

        editor.addEventListener('click', handleClick);
        editor.addEventListener('dragstart', handleDragStart);
        window.addEventListener('resize', refreshRect);
        window.addEventListener('scroll', refreshRect, true);
        return () => {
            editor.removeEventListener('click', handleClick);
            editor.removeEventListener('dragstart', handleDragStart);
            window.removeEventListener('resize', refreshRect);
            window.removeEventListener('scroll', refreshRect, true);
        };
    }, [editorRef, refreshRect]);

    // ── RESIZE ──
    const onResizeMouseDown = (e: React.MouseEvent, handle: HandlePos) => {
        e.preventDefault();
        e.stopPropagation();
        if (!overlay) return;
        resizingRef.current = {
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startW: overlay.el.offsetWidth,
            startH: overlay.el.offsetHeight,
        };
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (resizingRef.current && overlay) {
                const { handle, startX, startW } = resizingRef.current;
                const dx = e.clientX - startX;

                let newW = startW;
                if (handle === 'se' || handle === 'ne') newW = Math.max(60, startW + dx);
                if (handle === 'sw' || handle === 'nw') newW = Math.max(60, startW - dx);

                overlay.el.style.width = `${newW}px`;
                overlay.el.style.height = 'auto';  // always maintain aspect ratio
                overlay.el.style.maxWidth = '100%';
                overlay.el.classList.remove('w-full', 'max-w-full');

                if (editorRef.current) {
                    const rect = overlay.el.getBoundingClientRect();
                    const editorRect = editorRef.current.getBoundingClientRect();
                    setOverlay(prev => prev ? { ...prev, rect, editorRect } : null);
                }
            }
        };

        const onMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null;
                onUpdate();
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [overlay, editorRef, onUpdate]);

    if (!overlay) return null;

    const { rect, editorRect } = overlay;

    // Positions relative to the editor container, accounting for scroll
    const scrollParent = editorRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    const scrollTop = scrollParent ? scrollParent.scrollTop : 0;
    const scrollLeft = scrollParent ? scrollParent.scrollLeft : 0;

    const top = rect.top - editorRect.top + scrollTop;
    const left = rect.left - editorRect.left + scrollLeft;
    const width = rect.width;
    const height = rect.height;

    const handles: { pos: HandlePos; style: React.CSSProperties }[] = [
        { pos: 'nw', style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
        { pos: 'ne', style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
        { pos: 'sw', style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 } },
        { pos: 'se', style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 } },
    ];

    return (
        <div
            ref={overlayRef}
            className="absolute pointer-events-none z-50"
            style={{ top, left, width, height }}
        >
            {/* Selection border */}
            <div
                className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                style={{ boxShadow: '0 0 0 1px rgba(93,187,106,0.3)' }}
            />

            {/* Alignment toolbar */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card-dark border border-border-dark rounded-xl shadow-xl px-2 py-1 pointer-events-auto">
                {[
                    { title: 'Float left', icon: 'format_align_left', align: 'left' },
                    { title: 'Center', icon: 'format_align_center', align: 'center' },
                    { title: 'Float right', icon: 'format_align_right', align: 'right' },
                    { title: 'Full width', icon: 'fit_screen', align: 'full' },
                ].map(({ title, icon, align }) => (
                    <button
                        key={align}
                        title={title}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all"
                        onMouseDown={e => {
                            e.preventDefault();
                            const img = overlay.el;
                            img.style.display = '';
                            img.style.margin = '';
                            img.style.float = '';
                            img.classList.remove('w-full', 'max-w-full');

                            if (align === 'left') {
                                img.style.float = 'left';
                                img.style.margin = '0 16px 8px 0';
                            } else if (align === 'right') {
                                img.style.float = 'right';
                                img.style.margin = '0 0 8px 16px';
                            } else if (align === 'center') {
                                img.style.display = 'block';
                                img.style.margin = '16px auto';
                            } else {
                                img.style.width = '100%';
                                img.style.height = '';
                                img.classList.add('w-full', 'max-w-full');
                            }
                            onUpdate();
                            refreshRect();
                        }}
                    >
                        <span className="material-icons-round text-[16px]">{icon}</span>
                    </button>
                ))}
                <div className="w-px h-4 bg-border-dark mx-0.5" />
                <button
                    title="Remove image"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    onMouseDown={e => {
                        e.preventDefault();
                        overlay.el.remove();
                        setOverlay(null);
                        onUpdate();
                    }}
                >
                    <span className="material-icons-round text-[16px]">delete</span>
                </button>
            </div>

            {/* Resize handles */}
            {handles.map(({ pos, style }) => (
                <div
                    key={pos}
                    className="absolute bg-primary border-2 border-background-dark rounded-sm pointer-events-auto"
                    style={{
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        cursor: cursors[pos],
                        ...style,
                    }}
                    onMouseDown={e => onResizeMouseDown(e, pos)}
                />
            ))}
        </div>
    );
};
