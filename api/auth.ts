// IMPORTANT: THIS IS A SERVER-SIDE ONLY FILE
// IT SHOULD BE PLACED IN THE /api DIRECTORY

/**
 * =================================================================================
 * [!!] SECURITY AND PRODUCTION WARNING [!!]
 * =================================================================================
 * This is a MOCK authentication service for demonstration purposes.
 *
 * 1.  **IN-MEMORY DATABASE**: It uses simple in-memory arrays to store user data
 *     and pending verifications. THIS IS NOT PERSISTENT. All data will be **LOST**
 *     every time the serverless function instance restarts. For a real-world
 *     application, you **MUST** replace this with a proper, persistent database.
 *
 * 2.  **PLAINTEXT PASSWORDS**: Passwords are currently stored and checked in plaintext.
 *     This is highly insecure. In a production environment, you **MUST** hash
 *     passwords using a strong, salted hashing algorithm like bcrypt or Argon2.
 * =================================================================================
 */

import type { User, PublicUser } from '../types.ts';
import { sign, verify } from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

// --- Configuration ---
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-insecure-default-secret-key-for-dev';
const COOKIE_NAME = 'auth_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 1 week in seconds
const VERIFICATION_CODE_EXPIRY_MINUTES = 10;

// --- In-Memory Stores (REPLACE WITH A REAL DATABASE) ---
let users: User[] = [];
interface PendingVerification {
    email: string;
    code: string;
    expires: number;
    userData?: User; // Present for signups
}
let pendingVerifications: PendingVerification[] = [];


// --- Utility Functions ---
function omitPassword(user: User): PublicUser {
    const { password, ...publicUser } = user;
    return publicUser;
}

async function createSession(user: User): Promise<string> {
    const publicUser = omitPassword(user);
    const token = sign({ user: publicUser }, JWT_SECRET, {
        expiresIn: MAX_AGE,
    });
    return token;
}

function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanupExpiredVerifications() {
    const now = Date.now();
    pendingVerifications = pendingVerifications.filter(v => v.expires > now);
}

async function handleGetRequest(req: Request): Promise<Response> {
    const jsonHeaders = { 'Content-Type': 'application/json' };
    const url = new URL(req.url, `http://${req.headers.get('host')}`);
    const action = url.searchParams.get('action');

    if (action === 'getSession') {
        const cookies = parse(req.headers.get('Cookie') || '');
        const token = cookies[COOKIE_NAME];
        if (!token) {
            return new Response(JSON.stringify({ user: null }), { status: 200, headers: jsonHeaders });
        }
        try {
            const decoded = verify(token, JWT_SECRET) as { user: PublicUser };
            return new Response(JSON.stringify({ user: decoded.user }), { status: 200, headers: jsonHeaders });
        } catch (e) {
            // Invalid token
            return new Response(JSON.stringify({ user: null }), { status: 200, headers: jsonHeaders });
        }
    }

    return new Response(JSON.stringify({ error: 'Invalid GET action' }), { status: 400, headers: jsonHeaders });
}

async function handlePostRequest(req: Request): Promise<Response> {
    const jsonHeaders = { 'Content-Type': 'application/json' };
    const { action, data } = await req.json();

    switch (action) {
        case 'signup': {
            const { username, email, password } = data as Pick<User, 'username' | 'email' | 'password'>;
            if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
                return new Response(JSON.stringify({ success: false, message: 'Username already exists.' }), { status: 409, headers: jsonHeaders });
            }
            if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                return new Response(JSON.stringify({ success: false, message: 'Email is already in use.' }), { status: 409, headers: jsonHeaders });
            }
            
            const verificationCode = generateVerificationCode();
            const newUser: User = { username, email, password, profilePicture: null };
            
            // Remove any stale verification requests for this email
            pendingVerifications = pendingVerifications.filter(v => v.email.toLowerCase() !== email.toLowerCase());
            
            pendingVerifications.push({
                email: email.toLowerCase(),
                code: verificationCode,
                expires: Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000,
                userData: newUser
            });
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: `A verification code has been "sent" to ${email}.`,
                verificationCode
            }), { status: 200, headers: jsonHeaders });
        }

        case 'login': {
            const { email, password } = data as Pick<User, 'email' | 'password'>;
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (!user) {
                return new Response(JSON.stringify({ success: false, message: 'Invalid email or password.' }), { status: 401, headers: jsonHeaders });
            }

            const verificationCode = generateVerificationCode();
            
            // Remove any stale verification requests for this email
            pendingVerifications = pendingVerifications.filter(v => v.email.toLowerCase() !== email.toLowerCase());

            pendingVerifications.push({
                email: email.toLowerCase(),
                code: verificationCode,
                expires: Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000,
            });
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: `A verification code has been "sent" to ${email}.`,
                verificationCode
            }), { status: 200, headers: jsonHeaders });
        }

        case 'verify': {
            const { email, code } = data as { email: string; code: string };
            const verification = pendingVerifications.find(v => v.email.toLowerCase() === email.toLowerCase());

            if (!verification || verification.code !== code || verification.expires < Date.now()) {
                return new Response(JSON.stringify({ success: false, message: 'Invalid or expired verification code.' }), { status: 400, headers: jsonHeaders });
            }

            let userToLogin: User | undefined;
            
            if (verification.userData) {
                userToLogin = verification.userData;
                users.push(userToLogin);
            } else {
                userToLogin = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            }

            if (!userToLogin) {
                return new Response(JSON.stringify({ success: false, message: 'Could not find user to complete action.' }), { status: 500, headers: jsonHeaders });
            }

            pendingVerifications = pendingVerifications.filter(v => v.email.toLowerCase() !== email.toLowerCase());

            const token = await createSession(userToLogin);
            const cookie = serialize(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', maxAge: MAX_AGE, path: '/' });

            return new Response(JSON.stringify({ success: true, user: omitPassword(userToLogin) }), {
                status: 200,
                headers: { 'Set-Cookie': cookie, ...jsonHeaders },
            });
        }

        case 'logout': {
            const cookie = serialize(COOKIE_NAME, '', { httpOnly: true, maxAge: -1, path: '/' });
            return new Response(JSON.stringify({ success: true, message: 'Logged out successfully.' }), {
                status: 200,
                headers: { 'Set-Cookie': cookie, ...jsonHeaders },
            });
        }

        case 'updateProfilePicture': {
            const cookies = parse(req.headers.get('Cookie') || '');
            const token = cookies[COOKIE_NAME];
            if (!token) {
                return new Response(JSON.stringify({ success: false, message: 'Not authenticated.' }), { status: 401, headers: jsonHeaders });
            }
            const { imageBase64 } = data as { imageBase64: string };
            
            const decoded = verify(token, JWT_SECRET) as { user: PublicUser };
            const userIndex = users.findIndex(u => u.username.toLowerCase() === decoded.user.username.toLowerCase());

            if (userIndex === -1) {
                return new Response(JSON.stringify({ success: false, message: 'User not found.' }), { status: 404, headers: jsonHeaders });
            }
            
            users[userIndex].profilePicture = imageBase64;
            const updatedUser = users[userIndex];
            const newToken = await createSession(updatedUser);
            const newCookie = serialize(COOKIE_NAME, newToken, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', maxAge: MAX_AGE, path: '/' });
            
            return new Response(JSON.stringify({ success: true, user: omitPassword(updatedUser) }), {
                status: 200,
                headers: { 'Set-Cookie': newCookie, ...jsonHeaders },
            });
        }

        default:
            return new Response(JSON.stringify({ error: 'Invalid POST action' }), { status: 400, headers: jsonHeaders });
    }
}

// --- API Route Handler ---
export default async function handler(req: Request): Promise<Response> {
    try {
        cleanupExpiredVerifications();

        if (req.method === 'GET') {
            return await handleGetRequest(req);
        }

        if (req.method === 'POST') {
            return await handlePostRequest(req);
        }

        return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'GET, POST' } });

    } catch (error) {
        console.error('Auth API Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown internal server error occurred.';
        return new Response(JSON.stringify({ success: false, message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}