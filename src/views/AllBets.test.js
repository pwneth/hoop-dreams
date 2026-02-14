import { describe, it, expect, vi } from 'vitest';
import { renderAllBetsView } from './AllBets.js';
import * as store from '../lib/store.js';
// Mock dependencies that are imported
vi.mock('../components/StatsCards.js', () => ({ renderStatsCards: () => '<div>StatsCards</div>' }));
vi.mock('../components/Stats.js', () => ({ renderIndividualStats: () => '<div>IndivStats</div>' }));
vi.mock('../components/BetList.js', () => ({
    renderFilters: () => '<div>Filters</div>',
    renderBetsList: () => '<div>BetsList</div>'
}));
vi.mock('../lib/store.js', () => ({
    getState: vi.fn()
}));

describe('AllBets View', () => {
    it('should render global stats if filter is all', () => {
        vi.mocked(store.getState).mockReturnValue({ bettorFilter: 'all' });
        const html = renderAllBetsView();
        expect(html).toContain('StatsCards');
        expect(html).not.toContain('IndivStats');
        expect(html).toContain('Filters');
        expect(html).toContain('BetsList');
    });

    it('should render individual stats if filter is specific', () => {
        vi.mocked(store.getState).mockReturnValue({ bettorFilter: 'Alice' });
        const html = renderAllBetsView();
        expect(html).toContain('IndivStats');
        expect(html).not.toContain('StatsCards');
    });
});
