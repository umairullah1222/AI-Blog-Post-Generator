
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import type { RepurposeFormat } from '../types.ts';
import Spinner from './Spinner.tsx';
import { RefreshCwIcon, XCircleIcon, CopyIcon, CheckCircleIcon } from './icons.tsx';

const FORMATS: RepurposeFormat[] = ['Twitter Thread', 'LinkedIn Post', 'Email Newsletter'];

interface RepurposeModalProps {
    onClose: () => void;
}

const RepurposeModal: React.FC<RepurposeModalProps> = ({ onClose }) => {
    const { 
        isRepurposing,
        repurposedContent,
        repurposeError,
        handleRepurpose,
        clearRepurposedContent
    } = useAppContext();
    
    const [selectedFormat, setSelectedFormat] = useState<RepurposeFormat>('Twitter Thread');
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        // Automatically trigger generation when a new format is selected or on initial load
        if (selectedFormat) {
            handleRepurpose(selectedFormat);
        }
        
        // Clear content when component unmounts
        return () => {
            clearRepurposedContent();
        };
    }, [selectedFormat]);
    
    const handleCopy = () => {
        if(!repurposedContent) return;
        navigator.clipboard.writeText(repurposedContent);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <RefreshCwIcon className="h-5 w-5 text-cyan-400" />
                        Repurpose Content
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </header>

                <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
                    <div className="bg-slate-900/50 p-1 rounded-lg flex gap-1">
                         {FORMATS.map(format => (
                            <button
                                key={format}
                                onClick={() => setSelectedFormat(format)}
                                disabled={isRepurposing}
                                className={`w-full py-2 text-sm font-semibold rounded-md transition-all duration-300 capitalize disabled:opacity-50 ${
                                    selectedFormat === format ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                {format}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar relative">
                    {isRepurposing && (
                        <div className="absolute inset-0 bg-slate-800/50 flex flex-col items-center justify-center text-center text-slate-400">
                            <Spinner />
                            <p className="mt-2">Repurposing for {selectedFormat}...</p>
                        </div>
                    )}
                    {repurposeError && (
                         <div className="flex flex-col items-center justify-center h-full text-center text-red-300 bg-red-500/10 p-4 rounded-lg">
                            <XCircleIcon className="h-8 w-8 mb-2" />
                            <h4 className="font-semibold text-red-200">Error</h4>
                            <p className="text-sm">{repurposeError}</p>
                        </div>
                    )}
                    {repurposedContent && !isRepurposing && (
                        <div className="relative">
                            <button
                                onClick={handleCopy}
                                className="absolute top-0 right-0 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                            >
                                {hasCopied ? <><CheckCircleIcon className="h-4 w-4 text-green-400"/> Copied!</> : <><CopyIcon className="h-4 w-4"/> Copy</>}
                            </button>
                             <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg font-sans">{repurposedContent}</pre>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-slate-700/50 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="py-2 px-4 rounded-lg text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">Close</button>
                    <button onClick={() => handleRepurpose(selectedFormat)} disabled={isRepurposing} className="py-2 px-4 rounded-lg text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {isRepurposing ? <Spinner className="h-4 w-4" /> : <RefreshCwIcon className="h-4 w-4" />}
                        Regenerate
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default RepurposeModal;
