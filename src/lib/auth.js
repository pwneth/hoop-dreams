import * as api from '../api/api.js';
import { setState } from './store.js';

export async function login(username, password) {
    const user = await api.login(username, password);
    setState({ currentUser: user, authMode: 'login' });
    return user;
}

export async function register(username, password) {
    const user = await api.register(username, password);
    setState({ currentUser: user, authMode: 'login' });
    return user;
}

export function logout() {
    api.logout();
    setState({ currentUser: null, authMode: 'login' });
}

export async function changePassword(oldPassword, newPassword) {
    const success = await api.changePassword(oldPassword, newPassword);
    if (success) {
        // Update local user state as password changed
        const currentUser = api.getCurrentUser();
        setState({ currentUser });
    }
    return success;
}

export const getCurrentUser = api.getCurrentUser;
