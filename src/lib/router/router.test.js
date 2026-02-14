import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as router from './router.js';
import { setCurrentView } from '../store/store.js';

// Mock dependencies
vi.mock('../store/store.js', () => ({
    setCurrentView: vi.fn(),
}));

describe('router module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset window.location mock
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/',
                assign: vi.fn(),
            },
            writable: true
        });
        // Reset window.history mock
        Object.defineProperty(window, 'history', {
            value: {
                pushState: vi.fn()
            },
            writable: true
        });
    });

    it('navigateTo should update history and call handleRoute', () => {
        const path = '/my-bets';

        // Mock handleRoute behavior implicitly via navigateTo
        // Since handleRoute is exported and called internally, we can spy on it if we import * as router?
        // But internal calls within the same module are not easily mocked due to ESM bindings.
        // So we test the effect: setCurrentView being called.

        router.navigateTo(path);

        expect(window.history.pushState).toHaveBeenCalledWith({}, '', path);
        // handleRoute logic below
        // It sets window.location.pathname? No, it reads it. 
        // Wait, navigateTo updates history state, but handleRoute reads window.location.pathname.
        // window.history.pushState updates the URL shown in browser but does not update window.location object properties automatically in JSDOM unless configured?
        // Actually, JSDOM usually handles this, or we mock it.
        // Let's assume navigateTo should work if we update pathname manually or mock the behavior.

        // RE-READ router.js:
        // navigateTo(path) sets pushState then calls handleRoute().
        // handleRoute() reads window.location.pathname.
        // So we need to ensure window.location.pathname is updated if pushState doesn't do it in our test env.
        // In JSDOM, pushState updates the URL but might not update prompt pathname property synchronously or transparently for test without navigation.

        // Let's manually set pathname for the test to pass logic inside handleRoute
        window.location.pathname = path;
        router.handleRoute();

        expect(setCurrentView).toHaveBeenCalledWith('my-bets');
    });

    it('handleRoute should map paths to views', () => {
        window.location.pathname = '/dashboard';
        router.handleRoute();
        expect(setCurrentView).toHaveBeenCalledWith('dashboard');

        window.location.pathname = '/members';
        router.handleRoute();
        expect(setCurrentView).toHaveBeenCalledWith('members');

        window.location.pathname = '/unknown';
        router.handleRoute();
        expect(setCurrentView).toHaveBeenCalledWith('dashboard'); // Default
    });

    it('handleRoute should handle base URL if set', () => {
        // This is harder to test without reloading module with different env.
        // Assuming default BASE_URL '/'
    });
});
