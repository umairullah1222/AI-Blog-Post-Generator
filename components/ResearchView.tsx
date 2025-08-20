
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { LightbulbIcon, ResearchIcon, XCircleIcon } from './icons.tsx';
import Spinner from './Spinner.tsx';
import AuthPrompt from './AuthPrompt.tsx';

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-2">
        {children}
    </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder:text-slate-400" />
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="mt-6 flex flex-col items-center justify-center text-center text-red-300 bg-red-500/10 p-6 rounded-lg">
        <XCircleIcon className="h-10 w-10 mb-4" />
        <h3 className="text-lg font-semibold text-red-200">Analysis Failed</h3>
        <p className="mt-2 text-sm max-w-md">{message}</p>
    </div>
);

const ResultCard: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
        <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 mb-3">
            {icon}
            {title}
        </h3>
        {children}
    </div>
);

function ResearchView(): React.ReactNode {
    const { handleAnalyze, isAnalyzing, researchResult, analysisError, handleUseTopic, currentUser } = useAppContext();
    const [query, setQuery] = useState('');

    if (!currentUser) {
        return (
            <AuthPrompt
                icon={<LightbulbIcon className="h-10 w-10 text-slate-500" />}
                title="Research Topics & URLs"
                message="Please log in to use the AI research assistant for content ideas and outlines."
            />
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            handleAnalyze(query);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <header className="bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 mb-6 flex-shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    <LightbulbIcon className="h-7 w-7 text-indigo-400" />
                    <h2 className="text-2xl font-bold text-slate-100">Research & Inspiration</h2>
                </div>
                <p className="text-slate-400 mb-4">Enter a topic or URL to analyze and get content ideas, keywords, and a structured outline.</p>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Input 
                        id="research-query" 
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter a topic like 'benefits of remote work' or a URL..."
                        disabled={isAnalyzing}
                    />
                    <button
                        type="submit"
                        disabled={isAnalyzing || !query.trim()}
                        className="flex-shrink-0 flex justify-center items-center py-2 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {isAnalyzing ? <><Spinner /> Analyzing...</> : 'Analyze'}
                    </button>
                </form>
            </header>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar -mr-4 pr-4">
                {isAnalyzing && (
                     <div className="flex flex-col items-center justify-center text-center text-slate-400 p-8">
                        <Spinner />
                        <h3 className="text-xl font-semibold text-slate-200 mt-4">Analyzing Content...</h3>
                        <p className="mt-2 max-w-sm">The AI is working its magic. This may take a moment.</p>
                    </div>
                )}

                {analysisError && <ErrorDisplay message={analysisError} />}

                {researchResult && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        {/* Column 1 */}
                        <div className="space-y-6">
                             <ResultCard title="Key Takeaways" icon={<span className="text-xl">📝</span>}>
                                 <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                                    {researchResult.keyTakeaways.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </ResultCard>
                             <ResultCard title="SEO Keywords" icon={<span className="text-xl">🔑</span>}>
                                <div>
                                    <h4 className="font-semibold text-slate-300 text-sm mb-1">Primary</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {researchResult.keywords.primary.map((kw, i) => <span key={i} className="text-xs font-medium bg-indigo-500/20 text-indigo-300 py-1 px-2 rounded-full">{kw}</span>)}
                                    </div>
                                </div>
                                 <div className="mt-3">
                                    <h4 className="font-semibold text-slate-300 text-sm mb-1">Secondary</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {researchResult.keywords.secondary.map((kw, i) => <span key={i} className="text-xs font-medium bg-slate-700 text-slate-300 py-1 px-2 rounded-md">{kw}</span>)}
                                    </div>
                                </div>
                            </ResultCard>
                        </div>
                        {/* Column 2 */}
                        <div className="space-y-6">
                            <ResultCard title="Suggested Titles" icon={<span className="text-xl">💡</span>}>
                                <ul className="space-y-2">
                                    {researchResult.suggestedTitles.map((title, i) => (
                                        <li key={i} className="text-sm text-slate-300 bg-slate-900/50 p-2 rounded-md flex items-center justify-between gap-2">
                                            <span className="flex-grow">{title}</span>
                                            <button 
                                                onClick={() => handleUseTopic(title)}
                                                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full px-3 py-1 flex-shrink-0 transition-colors"
                                                title="Use this topic in the generator"
                                            >
                                                Use
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </ResultCard>
                            <ResultCard title="Proposed Outline" icon={<span className="text-xl">📑</span>}>
                                <div className="space-y-4 text-sm text-slate-300">
                                    <h4 className="font-bold text-slate-200 text-base">## {researchResult.outline.title}</h4>
                                    {researchResult.outline.sections.map((section, i) => (
                                        <div key={i} className="pl-2 border-l-2 border-slate-700">
                                            <h5 className="font-semibold text-slate-300">### {section.heading}</h5>
                                            <ul className="list-disc list-inside pl-3 mt-1 space-y-1 text-slate-400">
                                                {section.points.map((point, j) => <li key={j}>{point}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </ResultCard>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResearchView;