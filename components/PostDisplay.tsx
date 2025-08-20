
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { PenIcon, UploadCloudIcon, CalendarIcon, XCircleIcon, ImageIcon, LinkIcon, ShieldCheckIcon, RefreshCwIcon } from './icons.tsx';
import Spinner from './Spinner.tsx';
import { markdownToHtml, parseGeneratedPost } from '../utils/markdown.ts';
import type { GroundingSource } from '../types.ts';
import SeoAnalysisDisplay from './SeoAnalysisDisplay.tsx';
import RepurposeModal from './RepurposeModal.tsx';

const Placeholder = (): React.ReactNode => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
        <div className="w-20 h-20 bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
            <PenIcon className="h-10 w-10 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200">Your Content Will Appear Here</h3>
        <p className="mt-2 max-w-sm">Use the controls on the left to generate a new blog post. The result will be displayed in this panel.</p>
    </div>
);

const PostHeader: React.FC = () => {
    const { 
        generatedPost,
        isLoading, 
        isPublishing,
        handlePublish, 
        wordPressCredentials,
        setIsRepurposeModalOpen,
    } = useAppContext();

    const [showPublishModal, setShowPublishModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    
    const canPublish = wordPressCredentials.url && wordPressCredentials.username && wordPressCredentials.password && generatedPost;
    const canRepurpose = !!generatedPost;

    const onPublish = () => {
        let finalDate: Date | undefined;
        if (scheduleDate && scheduleTime) {
            finalDate = new Date(`${scheduleDate}T${scheduleTime}`);
        }
        if (generatedPost) {
            handlePublish(generatedPost, finalDate);
        }
        setShowPublishModal(false);
        setScheduleDate('');
        setScheduleTime('');
    };

    return (
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                <PenIcon className="h-6 w-6 text-indigo-400" />
                Generated Post
            </h2>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsRepurposeModalOpen(true)}
                    disabled={isLoading || isPublishing || !canRepurpose}
                    className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={!canRepurpose ? "Generate a post to enable repurposing" : "Repurpose Content"}
                >
                    <RefreshCwIcon className="h-4 w-4" /> Repurpose
                </button>
                <button
                    onClick={() => setShowPublishModal(true)}
                    disabled={isLoading || isPublishing || !canPublish}
                    className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={!canPublish ? "Please set WordPress credentials in Settings" : "Publish to WordPress"}
                >
                    {isPublishing ? <><Spinner /> Publishing...</> : <><UploadCloudIcon className="h-4 w-4" /> Publish</>}
                </button>
            </div>


            {showPublishModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowPublishModal(false)}>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">Publish Options</h3>
                        
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Schedule (Optional)</label>
                                <div className="flex gap-2">
                                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
                                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" disabled={!scheduleDate} />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Leave blank to publish immediately. Otherwise, set a future date and time.</p>
                             </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowPublishModal(false)} className="py-2 px-4 rounded-lg text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
                            <button onClick={onPublish} className="py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Confirm & Publish</button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}


function PostDisplay(): React.ReactNode {
    const { 
        generatedPost, 
        isLoading, 
        error, 
        generatedImage, 
        imageError,
        groundingSources,
        publishError,
        publishSuccess,
        clearPublishStatus,
        seoResult,
        isAnalyzingSeo,
        seoAnalysisError,
        handleAnalyzeSeo,
        isRepurposeModalOpen,
        setIsRepurposeModalOpen,
    } = useAppContext();

    const [viewMode, setViewMode] = useState<'preview' | 'markdown' | 'seo'>('preview');

    const parsedContent = useMemo(() => {
        if (!generatedPost) return null;
        return parseGeneratedPost(generatedPost);
    }, [generatedPost]);

    const htmlContent = useMemo(() => {
        if (!parsedContent) return '';
        return markdownToHtml(parsedContent.content);
    }, [parsedContent]);

    if (isLoading) {
        return (
            <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 h-full flex flex-col shadow-lg">
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
                    <Spinner />
                    <h3 className="text-xl font-semibold text-slate-200 mt-4">Generating Content...</h3>
                    <p className="mt-2 max-w-sm">The AI is crafting your article. This may take a moment, especially if Google Search is enabled.</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 h-full flex flex-col shadow-lg">
                <div className="flex flex-col items-center justify-center text-center text-red-300 bg-red-500/10 p-8 m-4 rounded-lg h-full">
                    <XCircleIcon className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold text-red-200">Generation Failed</h3>
                    <p className="mt-2 max-w-md">{error}</p>
                </div>
            </div>
        );
    }

    if (!generatedPost) {
        return (
            <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 h-full flex flex-col shadow-lg">
                <Placeholder />
            </div>
        );
    }
    
    const tabs = ['preview', 'markdown', 'seo'];

    return (
        <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 h-full flex flex-col shadow-lg overflow-hidden">
            <PostHeader />
            
            <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
                <div className="bg-slate-900/50 p-1 rounded-lg flex gap-1">
                     {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setViewMode(tab as any)}
                            className={`w-full py-2 text-sm font-semibold rounded-md transition-all duration-300 capitalize ${
                                viewMode === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                {(publishSuccess || publishError) && (
                     <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 text-sm border ${publishSuccess ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                        <p className="flex-grow" dangerouslySetInnerHTML={{ __html: publishSuccess || publishError || '' }}></p>
                        <button onClick={clearPublishStatus} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}
                
                {viewMode !== 'seo' && (
                    <>
                        {imageError && (
                             <div className="mb-4 p-3 rounded-lg flex items-center gap-3 text-sm bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <ImageIcon className="h-5 w-5 flex-shrink-0" />
                                <p>{imageError}</p>
                            </div>
                        )}
                        {generatedImage ? (
                            <img src={`data:image/jpeg;base64,${generatedImage}`} alt={parsedContent?.altText || 'Generated blog post header'} className="w-full h-auto max-h-80 object-cover rounded-lg mb-6 shadow-lg" />
                        ) : !imageError && (
                             <div className="w-full h-60 bg-slate-700/50 rounded-lg mb-6 flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <Spinner />
                                    <p className="mt-2 text-sm">Loading header image...</p>
                                </div>
                            </div>
                        )}
                        
                         {groundingSources && groundingSources.length > 0 && (
                            <div className="mb-6 p-4 bg-cyan-900/30 border border-cyan-500/30 rounded-lg">
                                <h4 className="font-semibold text-cyan-200 flex items-center gap-2 mb-2"><LinkIcon className="h-4 w-4" /> Grounded on {groundingSources.length} Sources:</h4>
                                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                    {groundingSources.map((source, i) => (
                                        <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 underline">{source.title}</a></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}


                {viewMode === 'preview' && (
                    <div className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-indigo-400 prose-strong:text-slate-200 prose-ul:text-slate-300 prose-li:marker:text-indigo-500">
                        {parsedContent?.title && <h2 className="text-3xl font-bold">{parsedContent.title}</h2>}
                        <div dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
                    </div>
                )}
                
                {viewMode === 'markdown' && (
                    <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg font-mono">{generatedPost}</pre>
                )}
                
                {viewMode === 'seo' && (
                    <SeoAnalysisDisplay 
                        result={seoResult}
                        isAnalyzing={isAnalyzingSeo}
                        error={seoAnalysisError}
                        onRetry={handleAnalyzeSeo}
                    />
                )}
            </div>
            {isRepurposeModalOpen && <RepurposeModal onClose={() => setIsRepurposeModalOpen(false)} />}
        </div>
    );
}

export default PostDisplay;