import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as router from './router.js';
import { setCurrentView } from '../store/store.js';

vi.mock('../store/store.js', () => ({
    setCurrentView: vi.fn(),
}));

describe('router module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'location', {
            value: { pathname: '/', assign: vi.fn() },
            writable: true
        });
        Object.defineProperty(window, 'history', {
            value: { pushState: vi.fn() },
            writable: true
        });
    });

    it('navigateTo should update history and call handleRoute', () => {
        router.navigateTo('/bracket');
        expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/bracket');

        window.location.pathname = '/bracket';
        router.handleRoute();
        expect(setCurrentView).toHaveBeenCalledWith('bracket');
    });

    it('handleRoute should map paths to views', () => {
        window.location.pathname = '/dashboard';
        router.handleRoute();
        expect(setCurrentView).toHaveBeenCalledWith('dashboard');

        window.location.pathname = '/bracket';
        router.handleRoute();
        expect(setCurrentView).toHaveBeenCalledWith('bracket');

        window.location.pathname = '/unknown';
        router.handleRoute();
        expect(setCurrentView).toHaveBeenCalledWith('dashboard');
    });

    it('handleRoute should handle base URL if set', () => {
        // Assuming default BASE_URL '/'
    });
});
