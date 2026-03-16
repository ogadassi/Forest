import React, { useState, useEffect, useRef } from 'react';
import type { NoteModel } from '../../models/NoteModel';

interface TimerState {
    timeRemaining: number;
    isRunning: boolean;
    lastUpdated: number;
    totalTime: number;
}

interface TimerNoteProps {
    note: NoteModel;
    onUpdate: (updates: Partial<NoteModel>) => void;
    color: string;
}

export const TimerNote: React.FC<TimerNoteProps> = ({ note, onUpdate, color }) => {
    const getInitialState = (): TimerState => {
        try {
            const c = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
            if (c && typeof c === 'object' && 'timeRemaining' in c) return c as TimerState;
        } catch { /* ignore */ }
        return { timeRemaining: 300, isRunning: false, lastUpdated: Date.now(), totalTime: 300 };
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const [timerState, setTimerState] = useState<TimerState>(getInitialState());
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editString, setEditString] = useState('');
    const [parsePreview, setParsePreview] = useState<string>('');
    const stateRef = useRef(timerState);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Track real pixel dimensions of the container
    useEffect(() => {
        if (!containerRef.current) return;
        
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        
        // Initial set
        updateDimensions();
        
        const ro = new ResizeObserver(() => {
            // Using requestAnimationFrame prevents "Rendered more hooks than during previous render" or ResizeObserver loop limit exceeded errors
            window.requestAnimationFrame(updateDimensions);
        });
        
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    useEffect(() => { stateRef.current = timerState; }, [timerState]);

    // Countdown interval
    useEffect(() => {
        if (!timerState.isRunning) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const delta = Math.floor((now - stateRef.current.lastUpdated) / 1000);
            if (delta > 0) {
                const newTime = Math.max(0, stateRef.current.timeRemaining - delta);
                const newState: TimerState = {
                    ...stateRef.current,
                    timeRemaining: newTime,
                    lastUpdated: stateRef.current.lastUpdated + delta * 1000,
                    isRunning: newTime > 0,
                };
                setTimerState(newState);
                if (newTime % 5 === 0 || newTime === 0) onUpdate({ content: newState });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [timerState.isRunning, onUpdate]);

    const debouncedSave = (s: TimerState) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => onUpdate({ content: s }), 500);
    };

    const toggleTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isEditingTime) return;
        const newState: TimerState = timerState.timeRemaining === 0
            ? { ...timerState, timeRemaining: timerState.totalTime, isRunning: true, lastUpdated: Date.now() }
            : { ...timerState, isRunning: !timerState.isRunning, lastUpdated: Date.now() };
        setTimerState(newState);
        debouncedSave(newState);
    };

    const resetTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState: TimerState = { ...timerState, timeRemaining: timerState.totalTime, isRunning: false, lastUpdated: Date.now() };
        setTimerState(newState);
        debouncedSave(newState);
    };

    const openTimeEditor = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (timerState.isRunning) return; 
        setEditString('');
        setParsePreview(formatTime(timerState.totalTime));
        setIsEditingTime(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const applyCustomTime = (totalSeconds: number) => {
        const clamped = Math.max(5, Math.min(3600 * 24, totalSeconds));
        const newState: TimerState = { timeRemaining: clamped, isRunning: false, lastUpdated: Date.now(), totalTime: clamped };
        setTimerState(newState);
        debouncedSave(newState);
        setIsEditingTime(false);
    };

    const parseNaturalTime = (str: string): number => {
        str = str.trim().toLowerCase();
        if (!str) return timerState.totalTime;
        
        if (str.includes(':')) {
            const parts = str.split(':');
            const m = parseInt(parts[0] || '0', 10);
            const s = parseInt(parts[1] || '0', 10);
            return m * 60 + s;
        } 
        
        let total = 0;
        const hMatch = str.match(/(\d+)\s*h/);
        const mMatch = str.match(/(\d+)\s*m/);
        const sMatch = str.match(/(\d+)\s*s/);
        
        if (hMatch || mMatch || sMatch) {
            if (hMatch) total += parseInt(hMatch[1], 10) * 3600;
            if (mMatch) total += parseInt(mMatch[1], 10) * 60;
            if (sMatch) total += parseInt(sMatch[1], 10);
            return total;
        }

        // If just a number, assume minutes
        return (parseInt(str, 10) || 0) * 60;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEditString(val);
        const parsed = parseNaturalTime(val);
        setParsePreview(formatTime(parsed));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        applyCustomTime(parseNaturalTime(editString));
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = timerState.totalTime > 0 ? (timerState.timeRemaining / timerState.totalTime) * 100 : 0;
    const isFinished = timerState.timeRemaining === 0 && !timerState.isRunning;
    
    // --- SMART LAYOUT CALCULATIONS ---
    const { width, height } = dimensions;

    // Minimum visual padding to ensure nothing touches walls
    const MIN_PADDING = 24; 
    
    // Available space
    const availWidth = Math.max(10, width - MIN_PADDING * 2);
    const availHeight = Math.max(10, height - MIN_PADDING * 2);

    const isHorizontalLayout = width >= height * 1.25;

    // Gap between the ring and the buttons
    const GAP = Math.min(availWidth, availHeight) * 0.15; 

    let ringSize = 100;
    let buttonSize = 32;

    if (isHorizontalLayout) {
        // Buttons take up roughly 1/4th of the ring size
        // Total width needed = ring + (gap * 2) + (button * 2)
        // button = ring * 0.25 -> Total Width = ring + 2*gap + 0.5*ring
        
        // 1. Max Ring restricted by available Height
        const maxRingByHeight = availHeight;
        
        // 2. Max Ring restricted by available Width
        const maxRingByWidth = (availWidth - (GAP * 2)) / 1.5; 
        
        ringSize = Math.min(maxRingByHeight, maxRingByWidth);
        buttonSize = ringSize * 0.35; // Button is 35% of ring
    } else {
        // Vertical layout
        // Total height needed = ring + (gap * 2) + (button * 2)
        
        // 1. Max ring restricted by available width
        const maxRingByWidth = availWidth;

        // 2. Max ring restricted by available height
        const maxRingByHeight = (availHeight - (GAP * 2)) / 1.5;

        ringSize = Math.min(maxRingByWidth, maxRingByHeight);
        buttonSize = ringSize * 0.35; // Button is 35% of ring
    }

    // SVG parameters
    const strokeWidth = Math.max(2, ringSize * 0.05); // Stroke thickness exactly 5% of its bounds
    const radius = (ringSize / 2) - strokeWidth; 
    const circumference = 2 * Math.PI * radius;

    // Sizing limits to prevent extremes
    ringSize = Math.max(64, Math.min(ringSize, 400));
    buttonSize = Math.max(28, Math.min(buttonSize, 120));
    const fontSize = ringSize * 0.23; // Moderated text proportion
    const iconSize = buttonSize * 0.6; // Icons stay proportionally sharp
    
    return (
        <div 
            ref={containerRef}
            className="w-full h-full select-none" 
            onClick={e => {
                e.stopPropagation();
                if (isEditingTime) handleSubmit();
            }}
        >
            <div 
                className="w-full h-full flex items-center justify-center relative"
                style={{ 
                    flexDirection: isHorizontalLayout ? 'row' : 'column',
                    gap: `${GAP}px`,
                    // We only apply dynamic styles when we have a real measurement
                    opacity: dimensions.width ? 1 : 0, 
                    transition: 'opacity 0.2s ease-in'
                }}
            >
                {/* Reset Control */}
                <button
                    onClick={resetTimer}
                    className="rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 shadow-sm border border-transparent hover:border-white/5 flex-shrink-0"
                    title="Reset"
                    style={{ 
                        width: `${buttonSize}px`,
                        height: `${buttonSize}px`,
                        opacity: isEditingTime ? 0 : 0.8, 
                        pointerEvents: isEditingTime ? 'none' : 'auto',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        color: '#94a3b8'
                    }}
                >
                    <span className="material-icons-round" style={{ fontSize: `${iconSize}px` }}>replay</span>
                </button>

                {/* Ring + time display (Center) */}
                <div 
                    className="relative flex-shrink-0"
                    style={{
                        width: `${ringSize}px`,
                        height: `${ringSize}px`,
                    }}
                >
                    {/* Track ring */}
                    <svg width="100%" height="100%" viewBox={`0 0 ${ringSize} ${ringSize}`} className="absolute pointer-events-none" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                        <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeOpacity="0.15" />
                        <circle
                            cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (circumference * progress) / 100}
                            strokeLinecap="round"
                            style={{ 
                                transition: 'stroke-dashoffset 1s linear', 
                                filter: `drop-shadow(0 0 8px ${color}80)` 
                            }}
                        />
                    </svg>

                    {/* Time display — click to edit */}
                    {isEditingTime ? (
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col items-center justify-center z-10 w-full h-full absolute inset-0 rounded-full"
                            style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }}
                            onClick={e => e.stopPropagation()}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={editString}
                                onChange={handleInputChange}
                                onKeyDown={e => { if (e.key === 'Escape') setIsEditingTime(false); }}
                                className="w-[85%] text-center font-black bg-transparent outline-none text-white tracking-tight leading-none z-20 placeholder:text-white/20"
                                style={{ fontSize: `${fontSize}px` }}
                                placeholder={parsePreview}
                            />
                            {editString && (
                                <span className="absolute bottom-[15%] tracking-widest uppercase font-bold text-white/50" style={{ fontSize: `${fontSize * 0.3}px` }}>
                                    {parsePreview}
                                </span>
                            )}
                        </form>
                    ) : (
                        <button
                            className="z-10 font-black tracking-tighter transition-all duration-300 rounded-full w-full h-full flex items-center justify-center hover:scale-105 active:scale-95"
                            style={{
                                fontSize: `${fontSize}px`,
                                color: isFinished ? '#ef4444' : '#ffffff',
                                textShadow: isFinished ? '0 0 20px rgba(239,68,68,0.5)' : `0 0 20px ${color}40`,
                                cursor: timerState.isRunning ? 'default' : 'pointer',
                            }}
                            onClick={openTimeEditor}
                            title={timerState.isRunning ? '' : 'Click to edit time'}
                        >
                            <span className={isFinished ? 'animate-pulse' : ''}>
                                {formatTime(timerState.timeRemaining)}
                            </span>
                        </button>
                    )}
                </div>

                {/* Play/Pause Control */}
                <button
                    onClick={toggleTimer}
                    className="rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg group relative overflow-hidden flex-shrink-0"
                    style={{
                        width: `${buttonSize}px`,
                        height: `${buttonSize}px`,
                        backgroundColor: color,
                        color: '#1a231d',
                        boxShadow: `0 8px 24px -6px ${color}80`,
                        opacity: isEditingTime ? 0 : 1,
                        pointerEvents: isEditingTime ? 'none' : 'auto'
                    }}
                    title={timerState.isRunning ? 'Pause' : 'Start'}
                >
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-tr from-transparent to-white pointer-events-none" />
                    
                    <span className="material-icons-round relative z-10 transition-transform group-active:scale-90" style={{ fontSize: `${iconSize}px` }}>
                        {timerState.isRunning ? 'pause' : 'play_arrow'}
                    </span>
                </button>
            </div>
        </div>
    );
};
