import React, { useState, useRef, useEffect } from 'react';
import type { CategoryModel } from '../../models/CategoryModel';
import { searchIcons } from '../../data/materialIcons';

const PRESET_COLORS = [
    '#5dbb6a', '#4f8ef7', '#f7874f', '#f7cf4f',
    '#c44ff7', '#f74f7a', '#4ff7e8', '#f7f74f',
    '#a0aec0', '#fc8181',
];

interface CategoryHeaderProps {
    category: CategoryModel;
    notesCount: number;
    color: string;
    icon: string;
    isCompact: boolean;
    isVeryCompact: boolean;
    isFullscreenView?: boolean;
    onUpdateCategory: (updates: Partial<CategoryModel>) => void;
    onDelete: () => void;
    onHeaderClick?: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
    category, notesCount, color, icon, isCompact, isVeryCompact, isFullscreenView, onUpdateCategory, onDelete, onHeaderClick
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(category.name);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [iconResults, setIconResults] = useState<string[]>([]);
    const iconSearchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIconResults(searchIcons(iconSearch));
    }, [iconSearch]);

    const handleSubmitRename = (e?: React.FormEvent | MouseEvent) => {
        e?.preventDefault();
        if (newName.trim() && newName !== category.name) onUpdateCategory({ name: newName.trim() });
        else setNewName(category.name);
        setIsEditing(false);
    };

    useEffect(() => {
        if (!confirmDelete && !showIconPicker && !showColorPicker && !isEditing) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (confirmDelete) setConfirmDelete(false);
            if (showIconPicker) setShowIconPicker(false);
            if (showColorPicker) setShowColorPicker(false);
            if (isEditing) handleSubmitRename(e);
        };
        document.addEventListener('click', handleOutsideClick);
        return () => { document.removeEventListener('click', handleOutsideClick); };
    }, [confirmDelete, showIconPicker, showColorPicker, isEditing, newName, category.name]);

    return (
        <div
            className={`panel-header flex items-center ${isCompact ? 'px-2 py-2' : 'px-4 py-3'} shrink-0 relative transition-all duration-300`}
            style={{ borderBottom: `1px solid ${color}18` }}
        >
            {!isFullscreenView && !isVeryCompact && (
                <div
                    className="absolute top-0 left-0 w-14 h-full z-20 group/drag peer/drag cursor-grab active:cursor-grabbing flex items-center justify-start px-1.5 lg:px-2"
                    title="Drag to move category"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="category-drag-handle panel-drag-handle opacity-0 group-hover/drag:opacity-60 transition-opacity flex items-center justify-center p-1 rounded hover:bg-white/5 pointer-events-auto" style={{ color }}>
                        <span className="material-icons-round text-[20px] pointer-events-none">drag_indicator</span>
                    </div>
                </div>
            )}
            <div
                className={`non-draggable flex-1 flex items-center gap-1.5 min-w-0 transition-[padding] duration-300 ${!isFullscreenView && !isVeryCompact ? 'peer-hover/drag:pl-[24px]' : ''}`}
                title={isFullscreenView ? '' : 'Click to open fullscreen'}
            >
                <div className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} relative shrink-0 transition-all`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowIconPicker(!showIconPicker); }}
                        className="w-full h-full flex items-center justify-center rounded-xl hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
                        title="Change icon"
                    >
                        <span className="material-icons-round text-sm" style={{ color }}>{icon}</span>
                    </button>
                    {showIconPicker && (
                        <div
                            className="absolute top-10 left-0 bg-card-dark border border-border-dark rounded-xl shadow-2xl z-50 p-3 w-[260px] animate-in fade-in zoom-in-95 duration-200"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative mb-2">
                                <span className="material-icons-round absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">search</span>
                                <input
                                    ref={iconSearchRef}
                                    autoFocus
                                    type="text"
                                    placeholder="Search icons..."
                                    className="w-full bg-background-dark border border-border-dark rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 outline-none focus:border-primary truncate"
                                    value={iconSearch}
                                    onChange={e => setIconSearch(e.target.value)}
                                />
                            </div>
                            <div className="h-32 overflow-y-auto custom-scrollbar bg-background-dark rounded-lg border border-border-dark p-1.5 grid grid-cols-6 gap-1 mt-2">
                                {iconResults.length > 0 ? iconResults.map(resIcon => (
                                    <button
                                        key={resIcon}
                                        type="button"
                                        onClick={() => { onUpdateCategory({ icon: resIcon }); setShowIconPicker(false); }}
                                        className={`aspect-square rounded-md flex items-center justify-center hover:scale-110 ${icon === resIcon ? 'text-background-dark' : 'text-slate-400 hover:text-white'}`}
                                        style={icon === resIcon ? { backgroundColor: color } : {}}
                                        title={resIcon.replace(/_/g, ' ')}
                                    >
                                        <span className="material-icons-round text-sm">{resIcon}</span>
                                    </button>
                                )) : (
                                    <div className="col-span-6 flex items-center justify-center text-xs text-slate-500 py-4">No icons found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0" onClick={e => isEditing ? e.stopPropagation() : undefined}>
                    {isEditing ? (
                        <form onSubmit={handleSubmitRename} className="w-full">
                            <input
                                autoFocus
                                className="w-full bg-transparent text-slate-100 font-bold text-sm outline-none border-b pb-px"
                                style={{ borderColor: color }}
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onBlur={handleSubmitRename}
                                onKeyDown={e => e.stopPropagation()}
                            />
                        </form>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span
                                className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors truncate cursor-text"
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                title="Click to rename category"
                            >
                                {category.name}
                            </span>
                        </div>
                    )}
                </div>
                {!isVeryCompact && (
                    <span
                        className="panel-note-count text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 group-hover:bg-white/10 transition-colors"
                        style={{ color, background: `${color}18` }}
                    >
                        {notesCount}
                    </span>
                )}
            </div>
            {/* Options */}
            <div className={`panel-options category-drag-cancel relative ${isCompact ? 'ml-1 gap-0' : 'ml-2 gap-1'} shrink-0 flex items-center`} onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                {!isVeryCompact && (
                    <div className="relative">
                        <button
                            onClick={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
                            title="Change color"
                        >
                            <span className="material-icons-round text-sm" style={{ color: color || '#94a3b8' }}>palette</span>
                        </button>
                        {showColorPicker && (
                            <div
                                className="absolute top-10 right-0 bg-card-dark border border-border-dark rounded-2xl shadow-2xl z-50 p-4 w-[200px] animate-in fade-in slide-in-from-top-2 duration-200"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Color</div>
                                <div className="grid grid-cols-5 gap-2">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => { onUpdateCategory({ color: c }); setShowColorPicker(false); }}
                                            className="w-8 h-8 rounded-xl transition-all hover:scale-110 relative flex items-center justify-center border border-white/5"
                                            style={{
                                                backgroundColor: c,
                                                boxShadow: color.toLowerCase() === c ? `0 0 0 2px ${c}99, 0 0 10px ${c}aa` : 'none',
                                                transform: color.toLowerCase() === c ? 'scale(1.15)' : 'none'
                                            }}
                                            title={`Set color to ${c}`}
                                        >
                                            {color.toLowerCase() === c && <span className="material-icons-round text-white text-[12px]">check</span>}
                                        </button>
                                    ))}
                                    <label
                                        className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform overflow-hidden border border-white/10"
                                        title="Custom color"
                                        style={{
                                            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                                        }}
                                    >
                                        <input
                                            type="color"
                                            className="opacity-0 absolute w-0 h-0"
                                            value={color}
                                            onChange={e => onUpdateCategory({ color: e.target.value })}
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {confirmDelete ? (
                    <>
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-all ml-1"
                            title="Cancel"
                        >
                            <span className="material-icons-round text-[16px]">close</span>
                        </button>
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); onDelete(); }}
                            className="w-7 h-7 flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 rounded-lg transition-all"
                            title="Confirm Delete"
                        >
                            <span className="material-icons-round text-[16px]">check</span>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                        onPointerDown={e => e.stopPropagation()}
                        className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} rounded-xl flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all active:scale-90`}
                        title="Delete category"
                    >
                        <span className="material-icons-round text-sm">delete</span>
                    </button>
                )}
                {isFullscreenView && (
                    <button
                        onClick={() => { if (onHeaderClick) onHeaderClick(); }}
                        className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} ml-0.5 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90`}
                        title="Minimize category"
                    >
                        <span className="material-icons-round text-sm">remove</span>
                    </button>
                )}
            </div>
        </div>
    );
};
