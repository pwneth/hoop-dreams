import { describe, it, expect, vi } from 'vitest';
import { renderDashboardView } from './Dashboard.js';

vi.mock('../../components/Leaderboard/Leaderboard.js', () => ({ renderLeaderboard: () => '<div>Leaderboard</div>' }));
vi.mock('../../components/BetTable/BetTable.js', () => ({ renderBetTable: () => '<div>BetTable</div>' }));
vi.mock('../../components/BetList/BetList.js', () => ({ renderFilters: () => '<div>Filters</div>' }));
vi.mock('../../components/ActionToast/ActionToast.js', () => ({ renderActionToast: () => '' }));
vi.mock('../../lib/store/store.js', () => ({
    getState: () => ({ bets: [] }),
    getPendingBets: () => [],
}));

describe('Dashboard View', () => {
    it('should render leaderboard, filters, and bet table', () => {
        const html = renderDashboardView();
        expect(html).toContain('Leaderboard');
        expect(html).toContain('Filters');
        expect(html).toContain('BetTable');
    });
});
