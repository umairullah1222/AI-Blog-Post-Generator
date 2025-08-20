import type { GscKeyword } from '../types.ts';

// Mock function to simulate connecting to GSC API
export async function connectGsc(): Promise<{ success: boolean }> {
    // In a real app, this would handle the OAuth flow
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ success: true });
        }, 500);
    });
}

// Mock function to simulate fetching top keywords from GSC
export async function getTopKeywords(): Promise<GscKeyword[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                { query: "how to improve content marketing roi", clicks: 1520, impressions: 45000 },
                { query: "best ai content generation tools 2024", clicks: 1250, impressions: 38000 },
                { query: "seo strategies for B2B tech companies", clicks: 980, impressions: 29000 },
                { query: "what is programmatic seo", clicks: 850, impressions: 25000 },
                { query: "content repurposing workflow", clicks: 760, impressions: 22000 },
                { query: "automating blog post publishing", clicks: 640, impressions: 19500 },
                { query: "using google search console for content ideas", clicks: 590, impressions: 18000 },
                { query: "creating a content calendar with AI", clicks: 510, impressions: 16000 },
                { query: "wordpress application password setup", clicks: 450, impressions: 14000 },
                { query: "how to write a good meta description", clicks: 420, impressions: 13500 },
                { query: "ai in digital marketing trends", clicks: 380, impressions: 12000 },
                { query: "long-form vs short-form content seo", clicks: 350, impressions: 11000 },
            ]);
        }, 1000);
    });
}
