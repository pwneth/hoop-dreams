import { describe, it, expect, vi } from 'vitest';
import { renderDashboardView } from './Dashboard.js';

// Mock dependencies
vi.mock('../components/ActionToast.js', () => ({ renderActionToast: () => '<div>Toast</div>' }));
vi.mock('../components/StatsCards.js', () => ({ renderStatsCards: () => '<div>StatsCards</div>' }));
vi.mock('../components/Leaderboard.js', () => ({ renderLeaderboard: () => '<div>Leaderboard</div>' }));

describe('Dashboard View', () => {
    it('should render all components', () => {
        const html = renderDashboardView();
        expect(html).toContain('Toast');
        expect(html).toContain('StatsCards');
        expect(html).toContain('Leaderboard');
        expect(html).toContain('Place New Bet');
    });
});
