import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CategoryModel } from '../../models/CategoryModel';
import type { NoteModel } from '../../models/NoteModel';

interface SearchResult {
    notes: (NoteModel & { category?: { id: number; name: string; color: string; icon: string } })[];
    categories: CategoryModel[];
}

interface SmartSearchBarProps {
    categories: CategoryModel[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectCategory: (id: number) => void;
    onOpenNote: (note: NoteModel) => void;
}

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-primary/30 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({ categories, isOpen, onOpenChange, onSelectCategory, onOpenNote }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult>({ notes: [], categories: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Esc to close (Ctrl+/ lives in MainLayout so it always works)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onOpenChange]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults({ notes: [], categories: [] });
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) { setResults({ notes: [], categories: [] }); return; }
        setIsLoading(true);
        try {
            // Fast DB Search
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            });
            const dbData: SearchResult = await res.json();
            setResults(dbData);
            setSelectedIndex(0);
        } catch {
            // Server unavailable — do local client-side search
            const lq = q.toLowerCase();
            const localCats = categories.filter(c => c.name.toLowerCase().includes(lq));
            setResults({ notes: [], categories: localCats });
            setSelectedIndex(0);
        } finally {
            setIsLoading(false);
        }
    }, [categories]);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // Fast DB search means we can use a snappier debounce
        debounceRef.current = setTimeout(() => doSearch(val), 300);
    };

    const allResults = [
        ...results.categories.map(c => ({ type: 'category' as const, item: c })),
        ...results.notes.map(n => ({ type: 'note' as const, item: n })),
    ];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allResults.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && allResults[selectedIndex]) {
            const r = allResults[selectedIndex];
            if (r.type === 'category') { onSelectCategory(r.item.id!); onOpenChange(false); }
            else { onOpenNote(r.item as NoteModel); onOpenChange(false); }
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => onOpenChange(true)}
                className="group flex items-center gap-2.5 bg-card-dark border border-border-dark rounded-xl pl-3.5 pr-4 py-2 text-xs text-slate-500 hover:text-slate-300 hover:border-primary/40 hover:bg-card-dark/80 transition-all duration-200 w-[280px] cursor-text"
            >
                <span className="material-icons-round text-sm text-slate-500 group-hover:text-primary transition-colors">search</span>
                <span className="flex-1 text-left">Search notes, categories…</span>
                <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono bg-background-dark border border-border-dark rounded text-slate-600">
                    Ctrl F
                </kbd>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop — no animation class so it doesn't re-trigger on result updates */}
            <div
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
                <div
                    className="w-full max-w-[85vw] md:max-w-4xl rounded-2xl overflow-hidden pointer-events-auto"
                    style={{
                        background: 'linear-gradient(145deg, #1e2a20, #181e19)',
                        border: '1px solid rgba(93,187,106,0.25)',
                        boxShadow: '0 0 0 1px rgba(93,187,106,0.08), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(93,187,106,0.06)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Input row — search icon is always stable, no icon swap to avoid blink */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 relative">
                        <span className="material-icons-round text-slate-400 text-lg shrink-0">search</span>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={handleQueryChange}
                            onKeyDown={handleKeyDown}
                            dir="auto"
                            placeholder="Ask anything about your notes…"
                            className="flex-1 bg-transparent text-slate-100 text-sm placeholder:text-slate-600 outline-none"
                        />
                        <kbd
                            onClick={() => onOpenChange(false)}
                            className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-slate-600 cursor-pointer hover:text-slate-300 transition-colors"
                        >
                            Esc
                        </kbd>
                    </div>
                    {/* Slim loading bar — stable position, doesn't affect layout */}
                    <div className={`h-[2px] transition-opacity duration-200 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(93,187,106,0.8), transparent)', backgroundSize: '200% 100%', animation: isLoading ? 'shimmer 1.2s infinite' : 'none' }}
                    />

                    {/* Results */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {query.trim() && allResults.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-600">
                                <span className="material-icons-round text-3xl">search_off</span>
                                <p className="text-sm">No results for <em className="text-slate-400">"{query}"</em></p>
                            </div>
                        )}

                        {!query.trim() && (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-600">
                                <span className="material-icons-round text-2xl">keyboard</span>
                                <p className="text-xs">Start typing to search across all notes and categories</p>
                            </div>
                        )}

                        {results.categories.length > 0 && (
                            <div>
                                <div className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-600">Categories</div>
                                {results.categories.map((cat, globalIdx) => {
                                    const isSelected = selectedIndex === globalIdx;
                                    return (
                                        <button
                                            key={cat.id}
                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                            onClick={() => { onSelectCategory(cat.id!); onOpenChange(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isSelected ? 'bg-primary/10' : 'hover:bg-white/4'}`}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${cat.color}22`, border: `1px solid ${cat.color}44` }}
                                            >
                                                <span className="material-icons-round text-sm" style={{ color: cat.color }}>{cat.icon || 'folder'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p dir="auto" className="text-sm font-semibold text-slate-100">{highlightMatch(cat.name, query)}</p>
                                                <p className="text-xs text-slate-500">Category</p>
                                            </div>
                                            {isSelected && <span className="material-icons-round text-xs text-primary">arrow_forward</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {results.notes.length > 0 && (
                            <div>
                                <div className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-600">Notes</div>
                                {results.notes.map((note, idx) => {
                                    const globalIdx = results.categories.length + idx;
                                    const isSelected = selectedIndex === globalIdx;
                                    const cat = (note as any).category;
                                    const preview = typeof note.content === 'string'
                                        ? note.content.slice(0, 100)
                                        : JSON.stringify(note.content).slice(0, 100);

                                    return (
                                        <button
                                            key={note.id}
                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                            onClick={() => { onOpenNote(note); onOpenChange(false); }}
                                            className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${isSelected ? 'bg-primary/10' : 'hover:bg-white/4'}`}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                                style={{ backgroundColor: `${cat?.color || '#5DBB6A'}22`, border: `1px solid ${cat?.color || '#5DBB6A'}44` }}
                                            >
                                                <span className="material-icons-round text-sm" style={{ color: cat?.color || '#5DBB6A' }}>
                                                    {note.contentType === 'checklist' ? 'checklist' : 'description'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p dir="auto" className="text-sm font-semibold text-slate-100 truncate">{highlightMatch(note.title, query)}</p>
                                                <p dir="auto" className="text-xs text-slate-500 truncate">{highlightMatch(preview, query)}</p>
                                                {cat && (
                                                    <p className="text-[10px] font-bold mt-0.5" style={{ color: cat.color }}>{cat.name}</p>
                                                )}
                                            </div>
                                            {isSelected && <span className="material-icons-round text-xs text-primary mt-1">arrow_forward</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {allResults.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-4 text-[10px] text-slate-600">
                            <span><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↑↓</kbd> Navigate</span>
                            <span><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↵</kbd> Open</span>
                            <span><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono">Esc</kbd> Close</span>
                            <span className="ml-auto">{allResults.length} result{allResults.length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
