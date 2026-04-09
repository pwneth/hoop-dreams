import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHeader, renderMobileNav } from './Header.js';
import * as store from '../../lib/store/store.js';

vi.mock('../../lib/store/store.js', () => ({
    getState: vi.fn(),
    getPendingActionCount: vi.fn(),
    getPendingBets: vi.fn(() => []),
    toggleTheme: vi.fn()
}));

vi.mock('../../lib/utils/utils.js', () => ({
    getInitials: (name) => name[0],
    formatCurrency: (v) => `€${v}`,
    getAvatarColor: () => ({ bg: '#000', text: '#fff' }),
}));

describe('Header Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render user info', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'TestUser' },
            currentView: 'dashboard',
            overallStats: { totalBets: 10, activeBets: 5, completedBets: 5, totalVolume: 100 },
            memberStats: [],
            bettorFilter: 'all',
        });
        vi.mocked(store.getPendingActionCount).mockReturnValue(0);

        const html = renderHeader();
        expect(html).toContain('TestUser');
        expect(html).toContain('HD Bets!');
    });

    it('should show badge for pending actions', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'TestUser' },
            currentView: 'dashboard',
            overallStats: { totalBets: 10 },
            memberStats: [],
            bettorFilter: 'all',
        });
        vi.mocked(store.getPendingActionCount).mockReturnValue(5);

        const html = renderHeader();
        expect(html).toContain('nav-badge');
        expect(html).toContain('5');
    });

    it('mobile nav should render correctly', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'TestUser' },
            currentView: 'dashboard',
            overallStats: {},
            memberStats: [],
            bettorFilter: 'all',
        });
        vi.mocked(store.getPendingActionCount).mockReturnValue(2);

        const html = renderMobileNav();
        expect(html).toContain('Bets');
        expect(html).toContain('nav-badge');
    });
});
