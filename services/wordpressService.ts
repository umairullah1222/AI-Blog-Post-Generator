
import type { WordPressCredentials } from '../types.ts';
import { markdownToHtml, parseGeneratedPost } from '../utils/markdown.ts';

export interface ExistingPost {
    title: string;
    link: string;
}

// Helper to convert base64 to Blob for media upload
function base64ToBlob(base64: string, contentType: string = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
}

export async function testWordPressConnection(credentials: WordPressCredentials) {
    const { url, username, password } = credentials;
    if (!url || !username || !password) {
        throw new Error('URL, Username, and Application Password are required.');
    }
    const baseUrl = url.replace(/\/$/, '');
    const endpoint = `${baseUrl}/wp-json/wp/v2/users/me`;
    const basicAuth = 'Basic ' + btoa(`${username}:${password}`);
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': basicAuth },
    });

    if (!response.ok) {
        let errorMessage = 'Connection failed. Please check URL, Username, and Application Password.';
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch(e) { /* Ignore parsing error */ }
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function getExistingPosts(credentials: WordPressCredentials): Promise<ExistingPost[]> {
    const { url, username, password } = credentials;
    const baseUrl = url.replace(/\/$/, '');
    const endpoint = `${baseUrl}/wp-json/wp/v2/posts?per_page=20&_fields=title,link`;
    const basicAuth = 'Basic ' + btoa(`${username}:${password}`);

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': basicAuth },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch existing posts from WordPress.');
    }

    const data = await response.json();
    return data.map((post: any) => ({
        title: post.title.rendered,
        link: post.link,
    }));
}


export async function publishPost(
    credentials: WordPressCredentials,
    markdownContent: string,
    imageBase64: string | null, // The generated image data
    scheduleDate?: Date
) {
    const { url, username, password } = credentials;
    if (!url || !username || !password) {
        throw new Error('WordPress URL, Username, and Application Password are required.');
    }

    const { title, content, altText } = parseGeneratedPost(markdownContent);
    const htmlContent = markdownToHtml(content);

    if (!title) {
        throw new Error("Could not parse a title (expected '## Title') from the generated content. Cannot publish.");
    }

    const baseUrl = url.replace(/\/$/, '');
    const basicAuth = 'Basic ' + btoa(`${username}:${password}`);

    let featuredMediaId: number | null = null;

    // Step 1: Upload the image to WordPress Media Library if it exists
    if (imageBase64) {
        try {
            const mediaEndpoint = `${baseUrl}/wp-json/wp/v2/media`;
            const imageBlob = base64ToBlob(imageBase64);
            const fileName = `${title.replace(/[\s\W]+/g, '-').toLowerCase() || 'generated-post-image'}.jpg`;

            const formData = new FormData();
            formData.append('file', imageBlob, fileName);
            formData.append('title', title);
            formData.append('alt_text', altText || `Header image for blog post titled: ${title}`);
            formData.append('caption', `Header image for blog post titled: ${title}`);
            
            const mediaResponse = await fetch(mediaEndpoint, {
                method: 'POST',
                headers: { 'Authorization': basicAuth },
                body: formData,
            });
            
            if (!mediaResponse.ok) {
                const errorData = await mediaResponse.json();
                throw new Error(errorData.message || 'Failed to upload image to WordPress.');
            }

            const mediaData = await mediaResponse.json();
            featuredMediaId = mediaData.id;

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during image upload.';
            // Re-throw the error to be caught by the calling function in App.tsx
            throw new Error(`Image upload failed: ${errorMessage}`);
        }
    }

    // Step 2: Create the post, with the featured image ID if available
    const postEndpoint = `${baseUrl}/wp-json/wp/v2/posts`;

    const body: {
        title: string;
        content: string;
        status: 'publish' | 'future';
        date?: string;
        featured_media?: number;
    } = {
        title,
        content: htmlContent,
        status: scheduleDate ? 'future' : 'publish',
    };

    if (scheduleDate) {
        body.date = scheduleDate.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
    }
    
    if (featuredMediaId) {
        body.featured_media = featuredMediaId;
    }

    const response = await fetch(postEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': basicAuth,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        let errorMessage = 'Failed to publish. Check credentials and URL.';
        try {
             const errorData = await response.json();
             if (errorData.message) {
                errorMessage = errorData.message;
             }
        } catch (e) {
            // The response was not JSON, stick with the more generic error.
        }
        throw new Error(errorMessage);
    }

    return response.json();
}