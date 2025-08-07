/**
 * A simple markdown to HTML converter.
 * Supports:
 * - Headings (##, ###, ####)
 * - Paragraphs (separated by blank lines)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Inline code (`code`)
 * - Links ([text](url))
 * - Unordered lists (* or -)
 */
export function markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    
    // Process block-level elements first
    return markdown
        .split(/\n\s*\n/) // Split by one or more blank lines
        .map(block => {
            const trimmedBlock = block.trim();
            if (trimmedBlock.length === 0) return '';
            
            // Headings
            if (trimmedBlock.startsWith('#### ')) return `<h4>${applyInlineFormatting(trimmedBlock.substring(5))}</h4>`;
            if (trimmedBlock.startsWith('### ')) return `<h3>${applyInlineFormatting(trimmedBlock.substring(4))}</h3>`;
            if (trimmedBlock.startsWith('## ')) return `<h2>${applyInlineFormatting(trimmedBlock.substring(3))}</h2>`;
            
            // Unordered lists
            if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ')) {
                const listItems = trimmedBlock.split('\n').map(item => `<li>${applyInlineFormatting(item.replace(/^[\*\-]\s/, '').trim())}</li>`).join('');
                return `<ul>${listItems}</ul>`;
            }

            // Paragraphs - apply inline formatting to the whole block
            return `<p>${applyInlineFormatting(trimmedBlock)}</p>`;
        })
        .join('');
}

/**
 * Applies inline markdown formatting to a line of text.
 */
function applyInlineFormatting(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br />'); // Handle line breaks within paragraphs
}


/**
 * Parses the raw markdown output from the AI to extract structured data.
 */
export function parseGeneratedPost(markdown: string): {
    metaTitle: string;
    metaDescription: string;
    altText: string;
    title: string;
    content: string;
} {
    if (!markdown) {
        return { metaTitle: '', metaDescription: '', altText: '', title: '', content: '' };
    }

    const lines = markdown.split('\n');
    const result = {
        metaTitle: '',
        metaDescription: '',
        altText: '',
        title: '',
    };
    const contentLines: string[] = [];
    let titleFound = false;

    for (const line of lines) {
        const metaTitleMatch = !result.metaTitle && line.match(/^Meta Title:\s*(.*)/i);
        if (metaTitleMatch) {
            result.metaTitle = metaTitleMatch[1].trim();
            continue;
        }
        
        const metaDescMatch = !result.metaDescription && line.match(/^Meta Description:\s*(.*)/i);
        if (metaDescMatch) {
            result.metaDescription = metaDescMatch[1].trim();
            continue;
        }

        const altTextMatch = !result.altText && line.match(/^Header Image Alt Text:\s*(.*)/i);
        if (altTextMatch) {
            result.altText = altTextMatch[1].trim();
            continue;
        }

        const titleMatch = !titleFound && line.match(/^##\s+(.*)/);
        if (titleMatch) {
            result.title = titleMatch[1].trim();
            titleFound = true; 
            // Don't add the title line to the content
            continue;
        }
        
        contentLines.push(line);
    }
    
    return {
        ...result,
        content: contentLines.join('\n').trim(),
    };
}