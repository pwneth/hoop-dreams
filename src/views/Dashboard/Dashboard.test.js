import { describe, it, expect, vi } from 'vitest';
import { renderDashboardView } from './Dashboard.js';

// Mock dependencies
vi.mock('../../components/ActionToast/ActionToast.js', () => ({ renderActionToast: () => '<div>Toast</div>' }));
vi.mock('../../components/StatsCards/StatsCards.js', () => ({ renderStatsCards: () => '<div>StatsCards</div>' }));
vi.mock('../../components/Leaderboard/Leaderboard.js', () => ({ renderLeaderboard: () => '<div>Leaderboard</div>' }));
vi.mock('../../components/BetList/BetList.js', () => ({ renderBetsList: () => '<div>RecentBets</div>' }));
vi.mock('../../lib/store/store.js', () => ({ getState: () => ({ bets: [] }) }));

describe('Dashboard View', () => {
    it('should render all components', () => {
        const html = renderDashboardView();
        expect(html).toContain('Toast');
        expect(html).toContain('StatsCards');
        expect(html).toContain('Leaderboard');
        expect(html).toContain('RecentBets');
        expect(html).toContain('View All Bets');
        expect(html).toContain('Place New Bet');
    });
});
