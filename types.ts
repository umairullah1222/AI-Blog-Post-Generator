


export type View = 'home' | 'posts' | 'settings' | 'history' | 'automation' | 'research' | 'profile' | 'gsc';

export enum Tone {
    PROFESSIONAL = 'Professional',
    CASUAL = 'Casual',
    HUMOROUS = 'Humorous',
    FORMAL = 'Formal',
    INFORMATIVE = 'Informative',
}

export enum Length {
    SHORT = 'Short (approx. 300 words)',
    MEDIUM = 'Medium (approx. 600 words)',
    LONG = 'Long (approx. 1000 words)',
    VERY_LONG = 'Very Long (approx. 3000 words)',
}

export type RepurposeFormat = 'Twitter Thread' | 'LinkedIn Post' | 'Email Newsletter';

export interface GenerateOptions {
    topic: string;
    tone: Tone;
    length: Length;
}

export interface WordPressCredentials {
    url: string;
    username: string;
    password: string; // This will be an Application Password
}

export interface HistoryItem {
  id: string;
  topic: string;
  content: string;
  image: string | null;
  createdAt: string;
}

export interface AutomationJob {
    id:string;
    topic: string;
    status: 'pending' | 'generating' | 'publishing' | 'completed' | 'error';
    resultMessage?: string;
}

export interface AutomationSettings {
    tone: Tone;
    length: Length;
    autoPublish: boolean;
    schedulePosts: boolean;
    publishTimes: string; // e.g., "09:00, 14:30, 18:00"
}

export interface ResearchResult {
    keyTakeaways: string[];
    suggestedTitles: string[];
    keywords: {
        primary: string[];
        secondary: string[];
    };
    outline: {
        title: string;
        sections: {
            heading: string;
            points: string[];
        }[];
    };
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface User {
    username: string;
    password: string;
    email: string;
    profilePicture?: string | null;
}

export type PublicUser = Omit<User, 'password'>;


export interface UserPreferences {
    defaultTone: Tone;
    defaultLength: Length;
}

export interface SeoAnalysisResult {
    seoScore: number; // A score from 0-100
    keywordAnalysis: {
        primaryKeyword: string;
        density: string;
        feedback: string;
    };
    readability: {
        score: string; // e.g., "Good", "Needs Improvement"
        feedback: string;
    };
    titleAnalysis: {
        length: number;
        feedback: string;
    };
    metaDescriptionAnalysis: {
        length: number;
        feedback: string;
    };
    headingStructure: {
        feedback: string;
    };
    linkAnalysis: {
        internalLinks: number;
        externalLinks: number;
        feedback: string;
    };
    overallSuggestions: string[];
}

export interface GscKeyword {
  query: string;
  clicks: number;
  impressions: number;
}