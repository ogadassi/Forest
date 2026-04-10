import React, { useState, useEffect, useRef } from 'react';
import type { NoteModel } from '../../models/NoteModel';

interface DemoNoteContentProps {
    note: NoteModel;
    onChange: (content: string) => void;
    onAddAttachment: (attachment: any) => void;
}

export const DemoNoteContent: React.FC<DemoNoteContentProps> = ({ note, onChange, onAddAttachment }) => {
    const [lyrics, setLyrics] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof note.content === 'string') {
            setLyrics(note.content.replace(/<[^>]+>/g, '\n').trim());
        }
    }, [note.content]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLyrics(e.target.value);
        onChange(e.target.value);
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            // Optimistically add as base64 attachment just to get it working immediately.
            // Normally this would be a proper file upload to the server.
            onAddAttachment({
                id: Date.now().toString(),
                type: 'audio',
                url: dataUrl,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <div className="flex flex-col gap-6 mb-12 relative h-full">
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#c44ff7]">Ideas & Takes</div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#c44ff7]/10 text-[#c44ff7] rounded-xl text-xs font-bold hover:bg-[#c44ff7]/20 transition-colors shadow-[0_0_15px_rgba(196,79,247,0.15)] focus:outline-none"
                    title="Upload an audio sketch"
                >
                    <span className="material-icons-round text-[16px]">mic</span>
                    ADD AUDIO PIN
                </button>
                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 flex-1 min-h-[400px]">
                {/* Text Area for lyrics/composition */}
                <textarea
                    value={lyrics}
                    onChange={handleTextChange}
                    placeholder="Write your compositional ideas here..."
                    className="w-full h-full bg-black/10 border border-white/5 rounded-2xl p-6 outline-none resize-none text-[17px] leading-[1.8] font-medium text-slate-200 focus:border-[#c44ff7]/50 focus:bg-black/20 transition-colors shadow-inner"
                    style={{ whiteSpace: 'pre-wrap' }}
                />

                {/* Audio Pins Rail */}
                <div className="flex flex-col gap-4">
                    {note.attachments && note.attachments.map((att: any, idx: number) => {
                        if (att.type === 'audio') {
                            return (
                                <div key={att.id || idx} className="bg-card-dark rounded-2xl border border-[#c44ff7]/30 p-4 shadow-lg flex flex-col gap-3 group relative overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="absolute inset-0 pointer-events-none z-0 mix-blend-screen opacity-10" style={{ background: 'linear-gradient(135deg, #c44ff7 0%, transparent 100%)' }} />
                                    
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className="w-8 h-8 rounded-full bg-[#c44ff7]/20 flex items-center justify-center text-[#c44ff7]">
                                            <span className="material-icons-round text-[16px]">play_arrow</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-300 truncate flex-1">{att.name || 'Audio Clip'}</div>
                                    </div>
                                    <audio controls src={att.url} className="w-full h-8 outline-none relative z-10" style={{ borderRadius: '8px' }} />
                                </div>
                            );
                        }
                        return null;
                    })}
                    {(!note.attachments || note.attachments.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-white/10 rounded-2xl p-6">
                            <span className="material-icons-round text-3xl mb-2">mic_none</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">No Audio Pins</span>
                            <span className="text-[10px] text-slate-600 mt-1">Upload an audio note or riff</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
