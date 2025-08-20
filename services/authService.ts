import type { User, PublicUser } from '../types.ts';

async function handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
}

export async function signup(newUser: Pick<User, 'username' | 'email' | 'password'>): Promise<{ success: boolean; message: string; verificationCode: string }> {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', data: newUser }),
    });
    return handleResponse(response);
}

export async function login(credentials: Pick<User, 'email' | 'password'>): Promise<{ success: boolean; message: string; verificationCode: string }> {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', data: credentials }),
    });
    return handleResponse(response);
}

export async function verify(email: string, code: string): Promise<{ success: boolean; user: PublicUser }> {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', data: { email, code } }),
    });
    return handleResponse(response);
}

export async function logout(): Promise<{ success: boolean }> {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
    });
    return handleResponse(response);
}

export async function getLoggedInUser(): Promise<PublicUser | null> {
    const response = await fetch('/api/auth?action=getSession', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    const data = await handleResponse(response);
    return data.user;
}

export async function updateProfilePicture(imageBase64: string): Promise<{ success: boolean, user: PublicUser }> {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProfilePicture', data: { imageBase64 } }),
    });
    return handleResponse(response);
}
