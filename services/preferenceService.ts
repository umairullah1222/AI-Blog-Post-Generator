
import type { UserPreferences } from '../types.ts';

const PREFS_KEY = 'ai-content-generator-prefs';

export function getPreferences(): UserPreferences | null {
    try {
        const prefsJson = localStorage.getItem(PREFS_KEY);
        return prefsJson ? JSON.parse(prefsJson) : null;
    } catch (error) {
        console.error("Failed to parse preferences from localStorage", error);
        return null;
    }
}

export function savePreferences(prefs: UserPreferences): void {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch(error) {
        console.error("Failed to save preferences to localStorage", error);
    }
}