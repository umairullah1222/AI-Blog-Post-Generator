
import React from 'react';
import type { SeoAnalysisResult } from '../types.ts';
import Spinner from './Spinner.tsx';
import { ShieldCheckIcon, TargetIcon, BookOpenIcon, XCircleIcon, CheckCircleIcon, LinkIcon, LightbulbIcon, RefreshCwIcon } from './icons.tsx';

interface SeoAnalysisDisplayProps {
    result: SeoAnalysisResult | null;
    isAnalyzing: boolean;
    error: string | null;
    onRetry: () => void;
}

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const getScoreColor = (s: number) => {
        if (s < 50) return '#f87171'; // red-400
        if (s < 80) return '#facc15'; // yellow-400
        return '#4ade80'; // green-400
    };

    const color = getScoreColor(score);
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                    className="text-slate-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                />
                <circle
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.8s ease-out',
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color }}>{score}</span>
                <span className="text-sm font-medium text-slate-400">/ 100</span>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5 flex-grow">
        <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2.5 mb-3">
            {icon}
            {title}
        </h3>
        <div className="text-sm text-slate-300 space-y-2">{children}</div>
    </div>
);

const AnalysisPlaceholder: React.FC<{ onAnalyze: () => void }> = ({ onAnalyze }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
        <ShieldCheckIcon className="h-16 w-16 text-slate-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-200">SEO Analysis</h3>
        <p className="mt-2 max-w-sm mb-6">Click the "Analyze SEO" button below to get an AI-powered audit of your generated content.</p>
        <button
            onClick={onAnalyze}
            className="py-2 px-5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 flex items-center gap-2 transition-colors"
        >
            <ShieldCheckIcon className="h-4 w-4" />
            Analyze Now
        </button>
    </div>
);

const SeoAnalysisDisplay: React.FC<SeoAnalysisDisplayProps> = ({ result, isAnalyzing, error, onRetry }) => {

    if (isAnalyzing) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-slate-400 p-8 min-h-[400px]">
                <Spinner />
                <h3 className="text-xl font-semibold text-slate-200 mt-4">Analyzing SEO...</h3>
                <p className="mt-2 max-w-sm">The AI is reviewing your content for optimization opportunities. This might take a moment.</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col items-center justify-center text-center text-red-300 bg-red-500/10 p-8 rounded-lg min-h-[400px]">
                <XCircleIcon className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold text-red-200">Analysis Failed</h3>
                <p className="mt-2 max-w-md">{error}</p>
                 <button
                    onClick={onRetry}
                    className="mt-6 py-2 px-5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center gap-2 transition-colors"
                >
                    <RefreshCwIcon className="h-4 w-4" />
                    Try Again
                </button>
            </div>
        );
    }

    if (!result) {
        return <AnalysisPlaceholder onAnalyze={onRetry} />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-800/40 p-6 rounded-xl border border-slate-700/50">
                <div className="flex-shrink-0">
                    <ScoreGauge score={result.seoScore} />
                </div>
                <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-slate-100">Overall SEO Score</h2>
                    <p className="text-slate-400 mt-1">This score reflects how well your content is optimized for search engines based on key metrics. Use the suggestions below to improve it.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard title="Keyword Analysis" icon={<TargetIcon className="h-5 w-5 text-cyan-400" />}>
                    <p><strong>Primary Keyword:</strong> <span className="font-mono text-fuchsia-300 bg-white/10 px-1.5 py-0.5 rounded">{result.keywordAnalysis.primaryKeyword}</span></p>
                    <p><strong>Density:</strong> <span className="font-semibold text-white">{result.keywordAnalysis.density}</span></p>
                    <p className="text-slate-400 italic">"{result.keywordAnalysis.feedback}"</p>
                </MetricCard>

                <MetricCard title="Readability" icon={<BookOpenIcon className="h-5 w-5 text-green-400" />}>
                     <p><strong>Assessment:</strong> <span className="font-semibold text-white">{result.readability.score}</span></p>
                     <p className="text-slate-400 italic">"{result.readability.feedback}"</p>
                </MetricCard>
                
                 <MetricCard title="Meta Title" icon={<CheckCircleIcon className="h-5 w-5 text-purple-400" />}>
                     <p><strong>Length:</strong> <span className="font-semibold text-white">{result.titleAnalysis.length} characters</span></p>
                     <p className="text-slate-400 italic">"{result.titleAnalysis.feedback}"</p>
                </MetricCard>

                <MetricCard title="Meta Description" icon={<CheckCircleIcon className="h-5 w-5 text-purple-400" />}>
                     <p><strong>Length:</strong> <span className="font-semibold text-white">{result.metaDescriptionAnalysis.length} characters</span></p>
                     <p className="text-slate-400 italic">"{result.metaDescriptionAnalysis.feedback}"</p>
                </MetricCard>
                
                 <MetricCard title="Link Analysis" icon={<LinkIcon className="h-5 w-5 text-indigo-400" />}>
                     <p><strong>Internal Links:</strong> <span className="font-semibold text-white">{result.linkAnalysis.internalLinks}</span></p>
                     <p><strong>External Links:</strong> <span className="font-semibold text-white">{result.linkAnalysis.externalLinks}</span></p>
                     <p className="text-slate-400 italic">"{result.linkAnalysis.feedback}"</p>
                </MetricCard>
                
                <MetricCard title="Heading Structure" icon={<span className="font-bold text-lg text-indigo-400">H#</span>}>
                     <p className="text-slate-400 italic">"{result.headingStructure.feedback}"</p>
                </MetricCard>
            </div>
             <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
                <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2.5 mb-3">
                    <LightbulbIcon className="h-5 w-5 text-yellow-400" />
                    Top Suggestions for Improvement
                </h3>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                    {result.overallSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SeoAnalysisDisplay;