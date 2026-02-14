import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHeader, renderMobileNav } from './Header.js';
import * as store from '../lib/store.js';

vi.mock('../lib/store.js', () => ({
    getState: vi.fn(),
    getPendingActionCount: vi.fn(),
    toggleTheme: vi.fn()
}));

vi.mock('../lib/utils.js', () => ({
    getInitials: (name) => name[0]
}));

describe('Header Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render user info', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'TestUser' },
            currentView: 'dashboard'
        });
        vi.mocked(store.getPendingActionCount).mockReturnValue(0);

        const html = renderHeader();
        expect(html).toContain('TestUser');
        expect(html).toContain('HD Bets!');
    });

    it('should show badge for pending actions', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'TestUser' },
            currentView: 'dashboard'
        });
        vi.mocked(store.getPendingActionCount).mockReturnValue(5);

        const html = renderHeader();
        expect(html).toContain('nav-badge');
        expect(html).toContain('5');
    });

    it('mobile nav should render correctly', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'TestUser' },
            currentView: 'my-bets'
        });
        vi.mocked(store.getPendingActionCount).mockReturnValue(2);

        const html = renderMobileNav();
        expect(html).toContain('My Bets');
        expect(html).toContain('nav-badge');
    });
});
