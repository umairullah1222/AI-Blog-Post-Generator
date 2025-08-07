
import React from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import type { HistoryItem } from '../types.ts';
import { HistoryIcon, TrashIcon, UploadCloudIcon } from './icons.tsx';
import AuthPrompt from './AuthPrompt.tsx';

const HistoryPlaceholder: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
        <div className="w-20 h-20 bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
            <HistoryIcon className="h-10 w-10 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200">No History Yet</h3>
        <p className="mt-2 max-w-sm">Your generated articles will appear here after you create them.</p>
    </div>
);

function HistoryView(): React.ReactNode {
    const { history, handleLoadFromHistory, handleDeleteHistoryItem, handleClearHistory, currentUser } = useAppContext();

    if (!currentUser) {
        return (
            <AuthPrompt
                icon={<HistoryIcon className="h-10 w-10 text-slate-500" />}
                title="View Your Content History"
                message="Please log in or create an account to view, save, and manage your generated articles."
            />
        );
    }
    
    if (history.length === 0) {
        return <HistoryPlaceholder />;
    }

    return (
        <div className="h-full flex flex-col bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-lg">
            <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
                 <div className="flex items-center gap-3">
                    <HistoryIcon className="h-6 w-6 text-indigo-400" />
                    <h2 className="text-xl font-bold text-slate-100">Content History</h2>
                </div>
                <button 
                    onClick={handleClearHistory}
                    className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                    <TrashIcon className="h-4 w-4" />
                    Clear All
                </button>
            </header>
            <div className="flex-grow overflow-y-auto p-4 md:p-6 custom-scrollbar">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {history.map(item => (
                        <div key={item.id} className="bg-slate-800/50 rounded-lg shadow-lg flex flex-col overflow-hidden border border-slate-700/50 group transition-all hover:border-indigo-500/50">
                            {item.image ? (
                                <img src={`data:image/jpeg;base64,${item.image}`} alt="Generated header" className="w-full h-32 object-cover" />
                            ) : (
                                <div className="w-full h-32 bg-slate-700/50 flex items-center justify-center">
                                    <HistoryIcon className="h-10 w-10 text-slate-600" />
                                </div>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-bold text-slate-200 truncate" title={item.topic}>{item.topic}</h3>
                                <p className="text-xs text-slate-400 mt-1 mb-4">
                                    {new Date(item.createdAt).toLocaleString()}
                                </p>
                                <div className="mt-auto flex items-center gap-2">
                                    <button 
                                        onClick={() => handleLoadFromHistory(item)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                    >
                                        <UploadCloudIcon className="h-4 w-4" />
                                        Load
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteHistoryItem(item.id)}
                                        className="p-2 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                        aria-label="Delete item"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
}

export default HistoryView;