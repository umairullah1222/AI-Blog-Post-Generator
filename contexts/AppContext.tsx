

import React, { createContext, useState, useCallback, useEffect, useRef, useContext, ReactNode } from 'react';
import { generateBlogPostStream, generateBlogPostGrounded, generatePostImage, analyzeContent, analyzeSeo, repurposeContent as geminiRepurposeContent } from '../services/geminiService.ts';
import { publishPost, getExistingPosts } from '../services/wordpressService.ts';
import * as gscService from '../services/gscService.ts';
import { getHistory, addToHistory, deleteFromHistory, clearHistory, saveHistory } from '../services/historyService.ts';
import { getPreferences, savePreferences } from '../services/preferenceService.ts';
import {
    getLoggedInUser,
    logout,
    updateProfilePicture as authUpdateProfilePicture
} from '../services/authService.ts';
import { Tone, Length } from '../types.ts';
import type { GenerateOptions, WordPressCredentials, HistoryItem, AutomationJob, AutomationSettings, ResearchResult, GroundingSource, User, UserPreferences, SeoAnalysisResult, View, PublicUser, RepurposeFormat, GscKeyword } from '../types.ts';

interface AppContextType {
    // Auth & User
    currentUser: PublicUser | null;
    isAuthLoading: boolean;
    handleLogout: () => Promise<void>;
    handleAuthSuccess: (user: PublicUser) => void;
    handleUpdateProfilePicture: (imageBase64: string) => Promise<{ success: boolean; message: string; }>;
    isAuthModalOpen: boolean;
    setIsAuthModalOpen: (isOpen: boolean) => void;

    // View
    activeView: View;
    setActiveView: (view: View) => void;

    // Generator
    topic: string;
    setTopic: (topic: string) => void;
    generatedPost: string;
    isLoading: boolean;
    error: string | null;
    generatedImage: string | null;
    imageError: string | null;
    groundingSources: GroundingSource[] | null;
    publishError: string | null;
    publishSuccess: string | null;
    clearPublishStatus: () => void;
    handleGenerate: (options: GenerateOptions & { useGoogleSearch?: boolean }) => void;
    handlePublish: (markdown: string, scheduleDate?: Date) => void;
    isPublishing: boolean;

    // Linking
    linkingStatus: string | null;
    
    // Repurposing
    isRepurposeModalOpen: boolean;
    setIsRepurposeModalOpen: (isOpen: boolean) => void;
    isRepurposing: boolean;
    repurposedContent: string;
    repurposeError: string | null;
    handleRepurpose: (format: RepurposeFormat) => Promise<void>;
    clearRepurposedContent: () => void;

    // History
    history: HistoryItem[];
    handleLoadFromHistory: (item: HistoryItem) => void;
    handleDeleteHistoryItem: (id: string) => void;
    handleClearHistory: () => void;

    // Automation
    automationQueue: AutomationJob[];
    isAutomating: boolean;
    handleStartAutomation: (topics: string[], settings: AutomationSettings) => void;
    handleStopAutomation: () => void;

    // Research
    isAnalyzing: boolean;
    researchResult: ResearchResult | null;
    analysisError: string | null;
    handleAnalyze: (query: string) => void;
    handleUseTopic: (topic: string) => void;
    
    // GSC
    isGscConnected: boolean;
    isGscLoading: boolean;
    gscKeywords: GscKeyword[];
    gscError: string | null;
    handleGscConnectAndFetch: () => void;
    handleGenerateFromKeyword: (keyword: string) => void;
    handleAddKeywordsToAutomation: () => void;

    // SEO
    isAnalyzingSeo: boolean;
    seoResult: SeoAnalysisResult | null;
    seoAnalysisError: string | null;
    handleAnalyzeSeo: () => void;

    // Settings
    wordPressCredentials: WordPressCredentials;
    setWordPressCredentials: (creds: WordPressCredentials) => void;
    userPreferences: UserPreferences | null;
    handleSavePreferences: (prefs: UserPreferences) => Promise<{success: boolean, message: string}>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Auth State
    const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // View State
    const [activeView, setActiveView] = useState<View>('home');
    
    // Generator State
    const [topic, setTopic] = useState('');
    const [generatedPost, setGeneratedPost] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [groundingSources, setGroundingSources] = useState<GroundingSource[] | null>(null);
    
    // Publishing State
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
    
    // Linking State
    const [linkingStatus, setLinkingStatus] = useState<string | null>(null);
    
    // History State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    // Automation State
    const [automationQueue, setAutomationQueue] = useState<AutomationJob[]>([]);
    const [isAutomating, setIsAutomating] = useState(false);
    const automationStopFlag = useRef(false);

    // Research State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // GSC State
    const [isGscConnected, setIsGscConnected] = useState(false);
    const [isGscLoading, setIsGscLoading] = useState(false);
    const [gscKeywords, setGscKeywords] = useState<GscKeyword[]>([]);
    const [gscError, setGscError] = useState<string | null>(null);
    
    // SEO State
    const [isAnalyzingSeo, setIsAnalyzingSeo] = useState(false);
    const [seoResult, setSeoResult] = useState<SeoAnalysisResult | null>(null);
    const [seoAnalysisError, setSeoAnalysisError] = useState<string | null>(null);
    
    // Repurposing State
    const [isRepurposeModalOpen, setIsRepurposeModalOpen] = useState(false);
    const [isRepurposing, setIsRepurposing] = useState(false);
    const [repurposedContent, setRepurposedContent] = useState('');
    const [repurposeError, setRepurposeError] = useState<string | null>(null);

    // Settings State
    const [wordPressCredentials, setWpCredentialsState] = useState<WordPressCredentials>({ url: '', username: '', password: '' });
    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
    
    // --- Effects for initial loading ---
    useEffect(() => {
        async function loadInitialData() {
            try {
                // Check session status first
                const user = await getLoggedInUser();
                setCurrentUser(user);
            } catch (error) {
                console.error("Session check failed:", error);
                setCurrentUser(null);
            } finally {
                setIsAuthLoading(false);
            }

            // Load other data from localStorage
            const storedCreds = localStorage.getItem('wpCredentials');
            if (storedCreds) {
                try {
                    setWpCredentialsState(JSON.parse(storedCreds));
                } catch (e) {
                    console.error("Failed to parse WP credentials from localStorage", e);
                }
            }

            setHistory(getHistory());
            setUserPreferences(getPreferences());
        }
        
        loadInitialData();
    }, []);

    const setWordPressCredentials = (creds: WordPressCredentials) => {
        localStorage.setItem('wpCredentials', JSON.stringify(creds));
        setWpCredentialsState(creds);
    };

    const handleAuthSuccess = useCallback((user: PublicUser) => {
        setCurrentUser(user);
        setIsAuthModalOpen(false);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (e) {
            console.error("Logout failed on server:", e);
        } finally {
            // Always log out on client side
            setCurrentUser(null);
            setActiveView('home');
        }
    }, []);
    
    const handleUpdateProfilePicture = useCallback(async (imageBase64: string): Promise<{ success: boolean; message: string; }> => {
        if (!currentUser) return { success: false, message: 'No user is logged in.' };
        try {
            const result = await authUpdateProfilePicture(imageBase64);
            if (result.success && result.user) {
                setCurrentUser(result.user);
                return { success: true, message: 'Profile picture updated!' };
            }
            return { success: false, message: 'Failed to update profile picture.' };
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            return { success: false, message };
        }
    }, [currentUser]);

    const handleGenerate = useCallback(async (options: GenerateOptions & { useGoogleSearch?: boolean }) => {
        setIsLoading(true);
        setError(null);
        setGeneratedPost('');
        setGeneratedImage(null);
        setImageError(null);
        setGroundingSources(null);
        setSeoResult(null);
        setSeoAnalysisError(null);

        try {
            if (options.useGoogleSearch) {
                const result = await generateBlogPostGrounded(options);
                setGeneratedPost(result.content);
                setGroundingSources(result.groundingSources);
            } else {
                setLinkingStatus('Fetching existing posts for internal linking...');
                const existingPosts = await getExistingPosts(wordPressCredentials).catch(() => {
                    setLinkingStatus('Could not fetch posts. Skipping internal linking.');
                    return [];
                });
                setLinkingStatus(null);
                
                let postContent = '';
                const stream = generateBlogPostStream(options, existingPosts);
                for await (const chunk of stream) {
                    postContent += chunk;
                    setGeneratedPost(prev => prev + chunk);
                }
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during generation.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setLinkingStatus(null);
        }
    }, [wordPressCredentials]);
    
    useEffect(() => {
        if (isLoading || !generatedPost) return;

        let isCancelled = false;
        
        const fetchImage = async () => {
            try {
                const image = await generatePostImage(topic);
                if (!isCancelled) {
                    setGeneratedImage(image);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
                 if (!isCancelled) {
                    setImageError(`Header image generation failed: ${errorMessage}`);
                }
            }
        };

        fetchImage();
        
        const newHistoryItem = addToHistory({ topic, content: generatedPost, image: null });
        setHistory(prev => [newHistoryItem, ...prev.filter(h => h.id !== newHistoryItem.id)].slice(0,50));

        return () => { isCancelled = true; };
    }, [isLoading, generatedPost, topic]);

    useEffect(() => {
        if (generatedImage && history.length > 0 && history[0].content === generatedPost && history[0].image === null) {
            const updatedHistoryItem = { ...history[0], image: generatedImage };
            const updatedHistory = [updatedHistoryItem, ...history.slice(1)];
            setHistory(updatedHistory);
            saveHistory(updatedHistory);
        }
    }, [generatedImage, generatedPost, history]);


    const clearPublishStatus = useCallback(() => {
        setPublishError(null);
        setPublishSuccess(null);
    }, []);

    const handlePublish = useCallback(async (markdown: string, scheduleDate?: Date) => {
        setIsPublishing(true);
        clearPublishStatus();
        try {
            const result = await publishPost(wordPressCredentials, markdown, generatedImage, scheduleDate);
            setPublishSuccess(`Post successfully published! <a href="${result.link}" target="_blank" rel="noopener noreferrer" class="font-bold underline">View Post</a>`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during publishing.';
            setPublishError(`Publishing failed: ${errorMessage}`);
        } finally {
            setIsPublishing(false);
        }
    }, [wordPressCredentials, generatedImage, clearPublishStatus]);

    const handleLoadFromHistory = useCallback((item: HistoryItem) => {
        setTopic(item.topic);
        setGeneratedPost(item.content);
        setGeneratedImage(item.image);
        setError(null);
        setImageError(null);
        setGroundingSources(null);
        clearPublishStatus();
        setSeoResult(null);
        setSeoAnalysisError(null);
        setActiveView('posts');
    }, [clearPublishStatus]);

    const handleDeleteHistoryItem = useCallback((id: string) => {
        deleteFromHistory(id);
        setHistory(prev => prev.filter(item => item.id !== id));
    }, []);

    const handleClearHistory = useCallback(() => {
        clearHistory();
        setHistory([]);
    }, []);
    
    const handleStartAutomation = useCallback(async (topics: string[], settings: AutomationSettings) => {
        automationStopFlag.current = false;
        setIsAutomating(true);
        
        const jobs: AutomationJob[] = topics.map(t => ({ id: Math.random().toString(36), topic: t, status: 'pending' }));
        setAutomationQueue(jobs);
        
        for (let i = 0; i < jobs.length; i++) {
            if (automationStopFlag.current) {
                setAutomationQueue(prev => prev.map(job => (job.status === 'pending' || job.status === 'generating' || job.status === 'publishing') ? {...job, status: 'pending', resultMessage: 'Automation stopped by user.'} : job));
                break;
            }
            
            const currentJob = jobs[i];
            
            // 1. Generating
            setAutomationQueue(prev => prev.map(job => job.id === currentJob.id ? { ...job, status: 'generating' } : job));
            let content = '';
            let image: string | null = null;
            try {
                const stream = generateBlogPostStream({ topic: currentJob.topic, tone: settings.tone, length: settings.length });
                for await (const chunk of stream) { content += chunk; }
                image = await generatePostImage(currentJob.topic);
            } catch (e) {
                 const message = e instanceof Error ? e.message : 'Unknown generation error';
                 setAutomationQueue(prev => prev.map(job => job.id === currentJob.id ? { ...job, status: 'error', resultMessage: `Generation failed: ${message}` } : job));
                 continue;
            }

            if (automationStopFlag.current) continue;
            
            // 2. Publishing
            if (settings.autoPublish) {
                setAutomationQueue(prev => prev.map(job => job.id === currentJob.id ? { ...job, status: 'publishing' } : job));
                try {
                    const result = await publishPost(wordPressCredentials, content, image);
                    setAutomationQueue(prev => prev.map(job => job.id === currentJob.id ? { ...job, status: 'completed', resultMessage: `Published: <a href="${result.link}" class="underline" target="_blank">View Post</a>` } : job));
                } catch(e) {
                    const message = e instanceof Error ? e.message : 'Unknown publishing error';
                    setAutomationQueue(prev => prev.map(job => job.id === currentJob.id ? { ...job, status: 'error', resultMessage: `Publishing failed: ${message}` } : job));
                }
            } else {
                 const newHistoryItem = addToHistory({ topic: currentJob.topic, content, image });
                 setHistory(prev => [newHistoryItem, ...prev.filter(h => h.id !== newHistoryItem.id)].slice(0, 50));
                 setAutomationQueue(prev => prev.map(job => job.id === currentJob.id ? { ...job, status: 'completed', resultMessage: 'Generated successfully and saved to history.' } : job));
            }
        }
        setIsAutomating(false);
    }, [wordPressCredentials]);

    const handleStopAutomation = useCallback(() => {
        automationStopFlag.current = true;
        setIsAutomating(false);
    }, []);

    const handleAnalyze = useCallback(async (query: string) => {
        setIsAnalyzing(true);
        setAnalysisError(null);
        setResearchResult(null);
        try {
            const result = await analyzeContent(query);
            setResearchResult(result);
        } catch (e) {
             const message = e instanceof Error ? e.message : 'Unknown analysis error';
             setAnalysisError(message);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);
    
    const handleUseTopic = useCallback((topicToUse: string) => {
        setTopic(topicToUse);
        setActiveView('posts');
    }, []);

    const handleAnalyzeSeo = useCallback(async () => {
        if (!generatedPost) return;
        setIsAnalyzingSeo(true);
        setSeoResult(null);
        setSeoAnalysisError(null);
        try {
            const result = await analyzeSeo(generatedPost);
            setSeoResult(result);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown SEO analysis error';
            setSeoAnalysisError(message);
        } finally {
            setIsAnalyzingSeo(false);
        }
    }, [generatedPost]);

    const handleSavePreferences = useCallback(async (prefs: UserPreferences): Promise<{success: boolean, message: string}> => {
        try {
            savePreferences(prefs);
            setUserPreferences(prefs);
            return { success: true, message: 'Preferences saved successfully!' };
        } catch (e) {
            return { success: false, message: 'Failed to save preferences.' };
        }
    }, []);
    
    const handleRepurpose = useCallback(async (format: RepurposeFormat) => {
        if (!generatedPost) return;
        
        setIsRepurposing(true);
        setRepurposeError(null);
        setRepurposedContent('');

        try {
            const { content } = await geminiRepurposeContent(generatedPost, format);
            setRepurposedContent(content);
        } catch(e) {
            const message = e instanceof Error ? e.message : 'Unknown repurposing error';
            setRepurposeError(message);
        } finally {
            setIsRepurposing(false);
        }
    }, [generatedPost]);
    
    const clearRepurposedContent = useCallback(() => {
        setRepurposedContent('');
        setRepurposeError(null);
    }, []);

    // GSC Handlers
    const handleGscConnectAndFetch = useCallback(async () => {
        setIsGscLoading(true);
        setGscError(null);
        try {
            await gscService.connectGsc(); // Mock connect
            const keywords = await gscService.getTopKeywords();
            setGscKeywords(keywords);
            setIsGscConnected(true);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to connect to GSC.';
            setGscError(message);
        } finally {
            setIsGscLoading(false);
        }
    }, []);

    const handleGenerateFromKeyword = useCallback((keyword: string) => {
        setTopic(keyword);
        setActiveView('posts');
    }, []);

    const handleAddKeywordsToAutomation = useCallback(() => {
        if (gscKeywords.length === 0) return;
        
        const topics = gscKeywords.slice(0, 10).map(k => k.query);
        const settings: AutomationSettings = {
            tone: userPreferences?.defaultTone || Tone.INFORMATIVE,
            length: userPreferences?.defaultLength || Length.MEDIUM,
            autoPublish: false,
            schedulePosts: false,
            publishTimes: "09:00,14:00"
        };
        handleStartAutomation(topics, settings);
        setActiveView('automation');
    }, [gscKeywords, userPreferences, handleStartAutomation]);


    const contextValue: AppContextType = {
        currentUser, isAuthLoading, handleLogout, handleAuthSuccess, handleUpdateProfilePicture, isAuthModalOpen, setIsAuthModalOpen,
        activeView, setActiveView,
        topic, setTopic, generatedPost, isLoading, error, generatedImage, imageError, groundingSources, publishError, publishSuccess, clearPublishStatus, handleGenerate, handlePublish, isPublishing,
        linkingStatus,
        isRepurposeModalOpen, setIsRepurposeModalOpen, isRepurposing, repurposedContent, repurposeError, handleRepurpose, clearRepurposedContent,
        history, handleLoadFromHistory, handleDeleteHistoryItem, handleClearHistory,
        automationQueue, isAutomating, handleStartAutomation, handleStopAutomation,
        isAnalyzing, researchResult, analysisError, handleAnalyze, handleUseTopic,
        isGscConnected, isGscLoading, gscKeywords, gscError, handleGscConnectAndFetch, handleGenerateFromKeyword, handleAddKeywordsToAutomation,
        isAnalyzingSeo, seoResult, seoAnalysisError, handleAnalyzeSeo,
        wordPressCredentials, setWordPressCredentials, userPreferences, handleSavePreferences,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};