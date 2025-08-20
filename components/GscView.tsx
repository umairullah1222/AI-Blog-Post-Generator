import React from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { GscIcon, PenIcon } from './icons.tsx';
import Spinner from './Spinner.tsx';
import AuthPrompt from './AuthPrompt.tsx';

function GscView(): React.ReactNode {
    const { 
        currentUser,
        isGscConnected,
        isGscLoading,
        gscKeywords,
        gscError,
        handleGscConnectAndFetch,
        handleGenerateFromKeyword,
        handleAddKeywordsToAutomation,
        setActiveView
    } = useAppContext();

    if (!currentUser) {
        return (
            <AuthPrompt
                icon={<GscIcon className="h-10 w-10 text-slate-500" />}
                title="Connect Google Search Console"
                message="Log in to connect your GSC account, view top search queries, and turn them into optimized blog posts."
            />
        );
    }

    const handleAddToAutomation = () => {
        handleAddKeywordsToAutomation();
        setActiveView('automation');
    };

    if (!isGscConnected) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-lg">
                <div className="w-20 h-20 bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
                    <GscIcon className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200">Connect to Google Search Console</h3>
                <p className="mt-2 max-w-sm text-slate-400">Unlock powerful SEO insights by connecting your GSC account to generate content based on what your audience is searching for.</p>
                <button
                    onClick={handleGscConnectAndFetch}
                    disabled={isGscLoading}
                    className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-transform transform hover:scale-105 disabled:opacity-50"
                >
                    {isGscLoading ? <><Spinner /> Connecting...</> : 'Connect (Mock)'}
                </button>
                {gscError && <p className="mt-4 text-red-400">{gscError}</p>}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-lg">
            <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
                 <div className="flex items-center gap-3">
                    <GscIcon className="h-6 w-6 text-indigo-400" />
                    <h2 className="text-xl font-bold text-slate-100">Top Search Queries</h2>
                </div>
                <button 
                    onClick={handleAddToAutomation}
                    className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    title="Generate posts for the top 10 keywords via the automation queue"
                >
                    <PenIcon className="h-4 w-4" />
                    Add Top 10 to Automation
                </button>
            </header>
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-slate-800/50 backdrop-blur-sm z-10">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-300">Keyword / Query</th>
                            <th className="p-4 text-sm font-semibold text-slate-300 text-right">Clicks</th>
                            <th className="p-4 text-sm font-semibold text-slate-300 text-right">Impressions</th>
                            <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {gscKeywords.map(keyword => (
                            <tr key={keyword.query} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-medium text-slate-200" title={keyword.query}>{keyword.query}</td>
                                <td className="p-4 text-slate-300 font-mono text-right">{keyword.clicks.toLocaleString()}</td>
                                <td className="p-4 text-slate-300 font-mono text-right">{keyword.impressions.toLocaleString()}</td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleGenerateFromKeyword(keyword.query)}
                                        className="py-1 px-3 rounded-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                    >
                                        Generate Post
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default GscView;
