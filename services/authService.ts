
import type { User } from '../types.ts';

const USERS_KEY = 'ai-content-generator-users';
const SESSION_KEY = 'ai-content-generator-session';

export function getUsers(): User[] {
    try {
        const usersJson = localStorage.getItem(USERS_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
        return [];
    }
}

function saveUsers(users: User[]): void {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch(error) {
        console.error("Failed to save users to localStorage", error);
    }
}

export function signup(newUser: User): { success: boolean; message: string; user: User | null } {
    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
        return { success: false, message: 'Username already exists. Please choose another.', user: null };
    }
    if (users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        return { success: false, message: 'Email address is already in use.', user: null };
    }
    const userToSave: User = { ...newUser, profilePicture: null };
    users.push(userToSave);
    saveUsers(users);
    setCurrentUser(userToSave); // Automatically log in user
    return { success: true, message: 'Signup successful! Welcome.', user: userToSave };
}

export function login(credentials: Pick<User, 'email' | 'password'>): { success: boolean; message: string; user: User | null } {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password);
    if (user) {
        setCurrentUser(user);
        return { success: true, message: 'Login successful.', user: user };
    }
    return { success: false, message: 'Invalid email or password.', user: null };
}

export function changePassword(username: string, oldPass: string, newPass: string): { success: boolean, message: string } {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    if (users[userIndex].password !== oldPass) {
        return { success: false, message: 'Current password is incorrect.' };
    }

    users[userIndex].password = newPass;
    saveUsers(users);
    return { success: true, message: 'Password changed successfully.' };
}

export function deleteAccount(username: string, password: string): { success: boolean, message: string } {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

    if (userIndex === -1) {
        // This case should not happen if called correctly from the app
        return { success: false, message: 'User not found.' };
    }

    if (users[userIndex].password !== password) {
        return { success: false, message: 'Password is incorrect. Account not deleted.' };
    }
    
    const updatedUsers = users.filter((_, index) => index !== userIndex);
    saveUsers(updatedUsers);
    logout(); // Log the user out after deleting account.
    return { success: true, message: 'Account deleted successfully.' };
}

export function updateProfilePicture(username: string, imageBase64: string): User | null {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

    if (userIndex !== -1) {
        users[userIndex].profilePicture = imageBase64;
        saveUsers(users);
        
        const sessionUser = getCurrentUser();
        if (sessionUser && sessionUser.username.toLowerCase() === username.toLowerCase()) {
            const updatedSessionUser = { ...sessionUser, profilePicture: imageBase64 };
            setCurrentUser(updatedSessionUser);
            return updatedSessionUser;
        }
        return users[userIndex];
    }
    return null;
}


export function setCurrentUser(user: User): void {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch(error) {
        console.error("Failed to set current user in sessionStorage", error);
    }
}

export function getCurrentUser(): User | null {
    try {
        const userJson = sessionStorage.getItem(SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        console.error("Failed to get current user from sessionStorage", error);
        return null;
    }
}

export function logout(): void {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error("Failed to log out from sessionStorage", error);
    }
}