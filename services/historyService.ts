import type { HistoryItem } from '../types.ts';

const HISTORY_KEY = 'ai-content-generator-history';

export function getHistory(): HistoryItem[] {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        return [];
    }
}

export function saveHistory(history: HistoryItem[]): void {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch(error) {
        console.error("Failed to save history to localStorage", error);
    }
}

export function addToHistory(item: { topic: string, content: string, image: string | null }): HistoryItem {
    const history = getHistory();
    const newItem: HistoryItem = {
        ...item,
        id: new Date().toISOString() + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
    };
    // Keep history from growing too large to avoid performance issues
    const updatedHistory = [newItem, ...history].slice(0, 50); 
    saveHistory(updatedHistory);
    return newItem;
}

export function deleteFromHistory(id: string): void {
    const history = getHistory().filter(item => item.id !== id);
    saveHistory(history);
}

export function clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
}