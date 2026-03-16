import React, { useEffect, useState } from 'react';

export const LoaderScreen: React.FC = () => {
    // Small delay to prevent flashing if the connection is instant
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 150);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background-dark text-slate-100 font-display">
            {/* Dark gradient radial overlay to smooth edges */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#181e19_0%,_#0a0d0a_100%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo / Animation Container */}
                <div className="relative flex items-center justify-center w-28 h-28 mb-8">
                    {/* Outer slow spinning dashed ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-[spin_8s_linear_infinite]" />
                    
                    {/* Middle faster spinning ring */}
                    <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-primary/60 animate-[spin_3s_linear_infinite]" />
                    
                    {/* Inner glowing core */}
                    <div className="absolute inset-6 rounded-full bg-primary/10 animate-pulse shadow-[0_0_20px_rgba(93,187,106,0.4)]" />

                    {/* Center icon */}
                    <span 
                        className="material-icons-round text-5xl text-primary relative z-10" 
                        style={{ filter: 'drop-shadow(0 0 12px rgba(93,187,106,0.8))' }}
                    >
                        forest
                    </span>
                </div>

                {/* Brand title */}
                <h1 className="text-4xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-primary to-[#3a4a3d]">
                    Forest
                </h1>

                {/* Connecting text */}
                <div className="flex items-center gap-3 text-slate-400 font-medium tracking-wide">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-[0_0_6px_rgba(93,187,106,0.8)]"></span>
                    </span>
                    Connecting to workspace...
                </div>

                {/* Progress Bar */}
                <div className="w-56 h-1 mt-8 bg-border-dark rounded-full overflow-hidden relative">
                    <div 
                        className="absolute h-full bg-primary rounded-full left-0 top-0 w-1/3 animate-[shimmer_1.5s_infinite_linear]" 
                        style={{ 
                            backgroundSize: '200% 100%', 
                            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            backgroundColor: '#5dbb6a'
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
