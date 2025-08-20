
import type { GenerateOptions, ResearchResult, GroundingSource, SeoAnalysisResult, RepurposeFormat } from '../types.ts';
import type { ExistingPost } from "./wordpressService.ts";

const PROXY_ENDPOINT = '/api/proxy'; // The backend proxy endpoint

async function handleApiResponse(response: Response) {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // Not a JSON response
            throw new Error(`HTTP error ${response.status}: The server returned an invalid response.`);
        }
        throw new Error(errorData.error || 'An unknown API error occurred. Check the server logs.');
    }
    return response;
}

export async function* generateBlogPostStream(
    options: GenerateOptions,
    existingPosts?: ExistingPost[]
): AsyncGenerator<string, void, undefined> {
    const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'generateStream',
            options,
            existingPosts
        }),
    });

    await handleApiResponse(response);

    if (!response.body) {
        throw new Error("Response body is empty.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        yield decoder.decode(value);
    }
}

export async function generateBlogPostGrounded(
    options: GenerateOptions
): Promise<{ content: string; groundingSources: GroundingSource[] }> {
    const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'generateGrounded',
            options
        }),
    });
    
    await handleApiResponse(response);
    return response.json();
}

export async function generatePostImage(topic: string): Promise<string> {
    const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'generateImage',
            topic
        }),
    });
    
    await handleApiResponse(response);
    const data = await response.json();
    if (!data.image) {
        throw new Error("Proxy did not return an image.");
    }
    return data.image;
}

export async function analyzeContent(urlOrTopic: string): Promise<ResearchResult> {
     const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'analyzeContent',
            query: urlOrTopic
        }),
    });
    
    await handleApiResponse(response);
    return response.json();
}

export async function analyzeSeo(markdownContent: string): Promise<SeoAnalysisResult> {
     const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'analyzeSeo',
            markdownContent
        }),
    });
    
    await handleApiResponse(response);
    return response.json();
}

export async function repurposeContent(markdownContent: string, format: RepurposeFormat): Promise<{ content: string }> {
     const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'repurposeContent',
            markdownContent,
            format,
        }),
    });
    
    await handleApiResponse(response);
    return response.json();
}
