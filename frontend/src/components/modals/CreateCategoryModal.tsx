import React, { useState, useEffect, useRef } from 'react';
import { categoryService } from '../../services/CategoryService';
import { searchIcons } from '../../data/materialIcons';

interface CreateCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCategoryCreated: () => void;
}

const PRESET_COLORS = [
    '#5dbb6a', '#4f8ef7', '#f7874f', '#f7cf4f',
    '#c44ff7', '#f74f7a', '#4ff7e8', '#f7f74f',
    '#a0aec0', '#fc8181',
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
    isOpen, onClose, onCategoryCreated,
}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [type, setType] = useState<'notes' | 'checklist'>('notes');
    const [iconSearch, setIconSearch] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('folder');
    const [iconResults, setIconResults] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    // Populate icon results on search change
    useEffect(() => {
        setIconResults(searchIcons(iconSearch));
    }, [iconSearch]);

    // Focus name input when opened
    useEffect(() => {
        if (isOpen) {
            setName('');
            setColor(PRESET_COLORS[0]);
            setType('notes');
            setIconSearch('');
            setSelectedIcon('folder');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            await categoryService.addCategory({ name: name.trim(), color, icon: selectedIcon, type });
            onCategoryCreated();
            onClose();
        } catch (err) {
            console.error('Failed to create category', err);
            setError('Failed to create category. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-8" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
            <div
                className="bg-[#242c26] w-full max-w-xl rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-2.5 text-[#5dbb6a]" style={{ color }}>
                        <span className="material-icons-round text-lg">folder_open</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] opacity-80">NEW CATEGORY</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5" title="Close">
                            <span className="material-icons-round text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-6">
                    {/* Live preview chip replacing original header preview */}
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-200"
                            style={{ backgroundColor: color + '22', border: `1.5px solid ${color}55` }}
                        >
                            <span className="material-icons-round text-[24px]" style={{ color }}>
                                {selectedIcon}
                            </span>
                        </div>
                        <div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Category title..."
                                className="w-full bg-transparent border-none outline-none text-2xl font-black text-slate-100 placeholder-slate-600 transition-colors"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Format Selector */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            Format
                        </label>
                        <div className="flex gap-3">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${type === 'notes' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background-dark border-border-dark text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}>
                                <input type="radio" name="categoryType" value="notes" checked={type === 'notes'} onChange={() => setType('notes')} className="hidden" />
                                <span className="material-icons-round text-base">dashboard</span>
                                <span className="text-sm font-bold">Notes Board</span>
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${type === 'checklist' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background-dark border-border-dark text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}>
                                <input type="radio" name="categoryType" value="checklist" checked={type === 'checklist'} onChange={() => setType('checklist')} className="hidden" />
                                <span className="material-icons-round text-base">checklist</span>
                                <span className="text-sm font-bold">Checklist</span>
                            </label>
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Color
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className="w-7 h-7 rounded-lg transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: c,
                                        outline: color === c ? `2px solid ${c}` : 'none',
                                        outlineOffset: '2px',
                                        boxShadow: color === c ? `0 0 10px ${c}66` : 'none',
                                    }}
                                />
                            ))}
                            {/* Custom color */}
                            <label
                                className="w-7 h-7 rounded-lg border border-border-dark bg-background-dark flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden"
                                title="Custom colour"
                            >
                                <span className="material-icons-round text-sm text-slate-500">colorize</span>
                                <input
                                    type="color"
                                    className="opacity-0 absolute w-0 h-0"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Icon search */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            Icon
                        </label>
                        <div className="relative mb-2">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search icons by word, e.g. book, code, star…"
                                className="w-full bg-background-dark border border-border-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                                value={iconSearch}
                                onChange={e => setIconSearch(e.target.value)}
                            />
                            {iconSearch && (
                                <button
                                    type="button"
                                    onClick={() => setIconSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-base">close</span>
                                </button>
                            )}
                        </div>

                        {/* Icon grid */}
                        <div className="h-36 overflow-y-auto custom-scrollbar bg-background-dark rounded-xl border border-border-dark p-2">
                            {iconResults.length > 0 ? (
                                <div className="grid grid-cols-8 gap-1">
                                    {iconResults.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            title={icon.replace(/_/g, ' ')}
                                            onClick={() => setSelectedIcon(icon)}
                                            className={`
                                                aspect-square rounded-lg flex items-center justify-center transition-all hover:scale-110
                                                ${selectedIcon === icon
                                                    ? 'text-background-dark shadow-lg'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                                                }
                                            `}
                                            style={selectedIcon === icon ? { backgroundColor: color, boxShadow: `0 0 12px ${color}66` } : {}}
                                        >
                                            <span className="material-icons-round text-xl">{icon}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                    <span className="material-icons-round text-2xl">search_off</span>
                                    <span className="text-xs">No icons found for "{iconSearch}"</span>
                                </div>
                            )}
                        </div>

                        {/* Selected icon chip */}
                        <div className="mt-2 flex items-center gap-2">
                            <span className="material-icons-round text-base" style={{ color }}>{selectedIcon}</span>
                            <span className="text-xs text-slate-500 font-mono">{selectedIcon}</span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <span className="material-icons-round text-sm">error</span>
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="px-6 py-2.5 bg-[#5dbb6a] text-[#1a231d] text-[12px] font-black tracking-wide rounded-lg hover:bg-[#4ea65a] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center gap-2"
                        >
                            {submitting ? (
                                <span className="material-icons-round text-[16px] animate-spin">refresh</span>
                            ) : (
                                <span className="material-icons-round text-[16px]">add</span>
                            )}
                            Create Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
