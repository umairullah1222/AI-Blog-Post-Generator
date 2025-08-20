// This file is the new serverless function endpoint.
// It combines the proxy logic and the Gemini API handlers into a single file
// to align with Vercel's preferred structure for Next.js-like deployments.

import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateOptions, ResearchResult, GroundingSource, SeoAnalysisResult, RepurposeFormat } from '../types.ts';
import type { ExistingPost } from "../services/wordpressService.ts";

// --- Start of functions moved from backend/geminiHandlers.ts ---

const basePrompt = `
Act as an expert SEO Content Strategist and a meticulous Editor-in-Chief. Your goal is to generate a blog post that is not only well-researched and structured for SEO but is also perfectly edited for clarity, flow, and human engagement.

**Core Directives (Apply all rigorously):**

1.  **Pre-computation & Research:**
    *   Before writing, thoroughly research the topic to ensure depth and authority. Present fact-based information.
    *   Identify a primary keyword from the topic.

2.  **SEO & Metadata (Top of the Document):**
    *   **Meta Title:** (approx. 60 chars) Must be compelling and contain the primary keyword.
    *   **Meta Description:** (approx. 155 chars) An enticing summary that includes the keyword.
    *   **Header Image Alt Text:** A concise, descriptive, SEO-friendly alt text for the main header image.

3.  **Article Structure (The "Flow"):**
    *   **Main Title (H2):** An attention-grabbing '## H2' tag that includes the keyword.
    *   **Introduction:** Start with a powerful hook. Clearly state the article's purpose and what the reader will learn.
    *   **Body:**
        *   Create a logical flow using H3 ('###') and H4 ('####') subheadings.
        *   Use **bold** for key terms and *italics* for emphasis.
        *   Use bulleted or numbered lists to break up text and improve skimmability.
    *   **Conclusion:** A strong summary of the main points.
    *   **Call to Action (CTA):** End with a clear, direct CTA. (e.g., 'What are your thoughts? Comment below!' or 'Share this article...').

4.  **Editing Principles (The "Polish"):**
    *   **Clarity & Simplicity:** Use simple language and an active voice. Avoid jargon unless explained. The goal is easy reading.
    *   **Conciseness:** Write short, impactful paragraphs (3-4 lines max). Aggressively cut unnecessary filler words ('actually', 'really', 'just', etc.). Every word must serve a purpose.
    *   **No Repetition:** Avoid repeating words, phrases, or ideas. Use synonyms and vary sentence structure.
    *   **Grammar & Punctuation:** The final output must be grammatically perfect.

5.  **Engagement & Authority Building:**
    *   **Visuals:** Insert placeholders for visuals where relevant using the format: '[Image: A descriptive alt text for an image about...]'.
    *   **Emojis:** Generously use a wide variety of relevant emojis (like 🧠, 📝, 🔍, ✨, 👍, 🚀) throughout the article to add personality, improve readability, and make the content more engaging. Add them to headings, list items, and key points.

**Final Output Format:**
The entire response must be a single block of Markdown text. Do not add any introductory or concluding remarks outside of the article structure itself. Begin directly with "Meta Title:".
`;

async function generateBlogPostStream(
    ai: GoogleGenAI,
    options: GenerateOptions,
    existingPosts?: ExistingPost[]
): Promise<ReadableStream<Uint8Array>> {
    const { topic, tone, length } = options;

    let internalLinkingInstruction = `
    *   **Links:** Include 1-2 internal link placeholders '[Internal Link: anchor text to a relevant post]' and 1-2 external links to authoritative sources '[External Link: anchor text to a high-authority source]'.`;

    if (existingPosts && existingPosts.length > 0) {
        const postList = existingPosts.map(p => `- "${p.title}"`).join('\n');
        internalLinkingInstruction = `
    *   **Internal Linking:** Based on the context, naturally weave in 1-2 relevant internal links to the following existing blog posts on the site. Use the provided titles as anchor text and create plausible-looking slugs (e.g., /blog/post-title). **DO NOT** just list them at the end.
        **Existing Posts:**
${postList}
    *   **External Links:** Include 1-2 external links to authoritative sources '[External Link: anchor text to a high-authority source]'.`
    }
    
    const userPrompt = `
**Topic:** "${topic}"
**Tone:** "${tone}"
**Length:** "${length}"

**Additional Directives:**
${internalLinkingInstruction}
`;

    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction: basePrompt,
        }
    });
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
        controller.close();
      }
    });
    return stream;
}

async function generateBlogPostGrounded(ai: GoogleGenAI, options: GenerateOptions): Promise<{ content: string; groundingSources: GroundingSource[] }> {
    const { topic, tone, length } = options;
    const userPrompt = `
**Factuality & Recency:** This article must be factually accurate and up-to-date. Prioritize information from your search results. All claims, statistics, and factual statements must be current and verifiable from the sources you find.

**Topic:** "${topic}"
**Tone:** "${tone}"
**Length:** "${length}"
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { 
            systemInstruction: basePrompt,
            tools: [{ googleSearch: {} }] 
        },
    });
    
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
        throw new Error(`Request was blocked by the safety filter. Reason: ${blockReason}.`);
    }

    const content = response.text ?? '';
    
    if (!content.trim()) {
        throw new Error("Generation resulted in an empty response. Please try a different topic.");
    }
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const groundingSources: GroundingSource[] = groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title ?? 'Untitled Source',
        uri: chunk.web?.uri ?? '#',
    })).filter((source: GroundingSource) => source.uri !== '#');

    return { content, groundingSources };
}

async function generatePostImage(ai: GoogleGenAI, topic: string): Promise<string> {
    const imagePrompt = `A high-quality, professional blog header image for an article about "${topic}". The style should be modern digital art, vibrant, and visually appealing, suitable for a tech or business blog.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: imagePrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0]?.image?.imageBytes) {
        return response.generatedImages[0].image.imageBytes;
    }
    throw new Error('Image generation failed or returned no images.');
}

async function analyzeContent(ai: GoogleGenAI, urlOrTopic: string): Promise<ResearchResult> {
     const researchPrompt = `You are a world-class SEO strategist and content analyst. Analyze the provided input, which is either a URL to an article or a general topic. Your goal is to deconstruct it and provide actionable insights for creating a new, superior piece of content. Provide your output in the exact JSON format specified. Do not include any introductory text or markdown formatting.

Input: "${urlOrTopic}"`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: researchPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: {
                        type: Type.ARRAY,
                        description: "A bulleted list of the main points and key takeaways from the source content or topic.",
                        items: { type: Type.STRING }
                    },
                    suggestedTitles: {
                        type: Type.ARRAY,
                        description: "A list of 5-7 engaging, SEO-friendly blog post title ideas based on the analysis.",
                        items: { type: Type.STRING }
                    },
                    keywords: {
                        type: Type.OBJECT,
                        description: "A list of relevant keywords for SEO.",
                        properties: {
                            primary: { type: Type.ARRAY, description: "1-3 primary keywords.", items: { type: Type.STRING }},
                            secondary: { type: Type.ARRAY, description: "5-10 secondary or long-tail keywords.", items: { type: Type.STRING }},
                        }
                    },
                    outline: {
                        type: Type.OBJECT,
                        description: "A proposed, well-structured outline for a new blog post on this topic.",
                        properties: {
                            title: { type: Type.STRING, description: "The main H2 title for the article." },
                            sections: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        heading: { type: Type.STRING, description: "An H3 subheading for a section." },
                                        points: { type: Type.ARRAY, description: "Bulleted list of key points or subtopics to cover in this section.", items: { type: Type.STRING }}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
    });

    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
        throw new Error(`Content analysis failed because the request was blocked. Reason: ${blockReason}. Please try a different query.`);
    }

    const jsonText = (response.text ?? '').trim();
    if (!jsonText) {
        throw new Error("Content analysis returned an empty response. The topic may be too broad or restricted.");
    }
    return JSON.parse(jsonText) as ResearchResult;
}

async function analyzeSeo(ai: GoogleGenAI, markdownContent: string): Promise<SeoAnalysisResult> {
    const seoAnalysisPrompt = `You are an expert SEO analyzer. Analyze the following blog post content written in Markdown. Your task is to provide a comprehensive SEO audit based on modern best practices.
    
1.  **Overall Score**: Assign a holistic SEO score from 0 to 100, where 100 is a perfectly optimized article.
2.  **Keyword Analysis**: Identify the primary keyword. Calculate its density (e.g., "approx 1.5%"). Provide feedback on its placement and natural usage.
3.  **Readability**: Assess the content's readability. Rate it (e.g., "Good", "Okay", "Needs Improvement") and give feedback on sentence length, paragraph structure, and use of active voice.
4.  **Meta Title Analysis**: Find the "Meta Title:" line. Check its length. Provide feedback on its effectiveness and keyword inclusion.
5.  **Meta Description Analysis**: Find the "Meta Description:" line. Check its length. Provide feedback on its quality as a search snippet.
6.  **Heading Structure**: Analyze the use of H2, H3, and H4 headings. Comment on their logical structure and keyword usage.
7.  **Link Analysis**: Count the number of internal ('[Internal Link:...]') and external ('[External Link:...]') link placeholders. Provide feedback on whether the count is appropriate.
8.  **Overall Suggestions**: Provide a short list of the most critical, actionable suggestions for improvement.

Return your analysis in the exact JSON format specified in the schema. Do not include any introductory text or markdown formatting.

**Content to Analyze:**
---
${markdownContent}
---
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: seoAnalysisPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    seoScore: { type: Type.INTEGER, description: "Overall SEO score (0-100)." },
                    keywordAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            primaryKeyword: { type: Type.STRING, description: "The main keyword identified." },
                            density: { type: Type.STRING, description: "Keyword density, e.g., '1.2%'." },
                            feedback: { type: Type.STRING, description: "Feedback on keyword usage." }
                        }
                    },
                    readability: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.STRING, description: "e.g., 'Good', 'Needs Improvement'." },
                            feedback: { type: Type.STRING, description: "Feedback on readability." }
                        }
                    },
                    titleAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            length: { type: Type.INTEGER, description: "Character count of the title." },
                            feedback: { type: Type.STRING, description: "Feedback on the title's SEO effectiveness." }
                        }
                    },
                    metaDescriptionAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            length: { type: Type.INTEGER, description: "Character count of the meta description." },
                            feedback: { type: Type.STRING, description: "Feedback on the meta description's effectiveness." }
                        }
                    },
                    headingStructure: {
                        type: Type.OBJECT,
                        properties: {
                            feedback: { type: Type.STRING, description: "Feedback on heading structure and usage." }
                        }
                    },
                    linkAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            internalLinks: { type: Type.INTEGER, description: "Count of internal link placeholders." },
                            externalLinks: { type: Type.INTEGER, description: "Count of external link placeholders." },
                            feedback: { type: Type.STRING, description: "Feedback on link quantity and strategy." }
                        }
                    },
                    overallSuggestions: {
                        type: Type.ARRAY,
                        description: "A bulleted list of the most important suggestions.",
                        items: { type: Type.STRING }
                    }
                }
            }
        },
    });

    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
        throw new Error(`SEO analysis failed because the request was blocked. Reason: ${blockReason}.`);
    }

    const jsonText = (response.text ?? '').trim();
    if (!jsonText) {
        throw new Error("SEO analysis returned an empty response.");
    }
    return JSON.parse(jsonText) as SeoAnalysisResult;
}

async function repurposeContent(ai: GoogleGenAI, markdownContent: string, format: RepurposeFormat): Promise<string> {
    const systemInstruction = `You are a social media marketing expert and a skilled copywriter. Your task is to repurpose a blog post into a different format for a specific platform. Adapt the tone, length, and structure to be optimal for the target platform while retaining the core message of the original article.`;

    const userPrompt = `
**Original Blog Post (Markdown):**
---
${markdownContent}
---

**Target Format:** ${format}

**Instructions:**
- **If Target is "Twitter Thread":**
    - Create a compelling, numbered thread (e.g., 1/n).
    - The first tweet must be a strong hook to grab attention.
    - Each tweet must be under 280 characters.
    - Use relevant hashtags and emojis.
    - The final tweet should include a call-to-action (CTA) and a link back to the original blog post (use a placeholder like "[Link to Blog Post]").
- **If Target is "LinkedIn Post":**
    - Write a professional and engaging post.
    - Start with a strong opening line to stop the scroll.
    - Use clear, concise paragraphs with ample white space.
    - Incorporate 3-5 relevant business-oriented hashtags.
    - Encourage discussion with a question or a CTA.
- **If Target is "Email Newsletter":**
    - Write a friendly and engaging email.
    - Start with a personalized greeting (use "[Subscriber Name]").
    - Create a compelling subject line.
    - Summarize the key points of the article in a skimmable format (use bullet points or short paragraphs).
    - End with a clear CTA button or link to read the full article on the blog.
    - Format it like an email, including Subject Line.

Provide ONLY the repurposed content in plain text, without any extra commentary or markdown formatting like '##'.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { systemInstruction },
    });
    
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
        throw new Error(`Repurposing failed because the request was blocked. Reason: ${blockReason}.`);
    }

    const text = response.text ?? '';
    if (!text.trim()) {
        throw new Error("Repurposing returned an empty response.");
    }
    return text;
}

// --- End of functions moved from backend/geminiHandlers.ts ---


// This function simulates the entry point of a serverless function.
// This default export is essential for serverless function handlers in many platforms.
export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // --- SECURITY: Get API Key from environment variables on the SERVER ---
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "API_KEY environment variable not set on the server." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const body = await req.json();
        const { action, ...payload } = body;

        switch (action) {
            case 'generateStream': {
                const { options, existingPosts } = payload as { options: GenerateOptions; existingPosts?: ExistingPost[] };
                const stream = await generateBlogPostStream(ai, options, existingPosts);
                return new Response(stream, {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                });
            }
            
            case 'generateGrounded': {
                 const { options } = payload as { options: GenerateOptions };
                 const result = await generateBlogPostGrounded(ai, options);
                 return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
            }

            case 'generateImage': {
                const { topic } = payload as { topic: string };
                const base64Image = await generatePostImage(ai, topic);
                return new Response(JSON.stringify({ image: base64Image }), { headers: { 'Content-Type': 'application/json' } });
            }
            
            case 'analyzeContent': {
                 const { query } = payload as { query: string };
                 const result = await analyzeContent(ai, query);
                 return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
            }
            
            case 'analyzeSeo': {
                 const { markdownContent } = payload as { markdownContent: string };
                 const result = await analyzeSeo(ai, markdownContent);
                 return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
            }

            case 'repurposeContent': {
                const { markdownContent, format } = payload as { markdownContent: string; format: RepurposeFormat };
                const result = await repurposeContent(ai, markdownContent, format);
                return new Response(JSON.stringify({ content: result }), { headers: { 'Content-Type': 'application/json' } });
            }

            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unknown internal error occurred.';
        console.error("Proxy Error:", e);
        return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}