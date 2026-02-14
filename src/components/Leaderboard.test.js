import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderLeaderboard } from './Leaderboard.js';
import * as store from '../lib/store.js';

vi.mock('../lib/store.js', () => ({
    getState: vi.fn()
}));

vi.mock('../lib/utils.js', () => ({
    formatCurrency: (val) => `$${val}`
}));

describe('Leaderboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render empty state if no stats', () => {
        vi.mocked(store.getState).mockReturnValue({ memberStats: [] });
        const html = renderLeaderboard();
        expect(html).toContain('No data available');
    });

    it('should render leaderboard items', () => {
        const stats = [
            { name: 'User1', wins: 5, losses: 1, winRate: 80, netProfit: 100, potentialGain: 0 },
            { name: 'User2', wins: 1, losses: 5, winRate: 20, netProfit: -50, potentialGain: 20 }
        ];
        vi.mocked(store.getState).mockReturnValue({ memberStats: stats });

        const html = renderLeaderboard();
        expect(html).toContain('User1');
        expect(html).toContain('User2');
        expect(html).toContain('80%');
        expect(html).toContain('$100');
    });
});
