import { describe, it, expect, vi } from 'vitest';
import { renderAllBetsView } from './AllBets.js';

vi.mock('../../components/BetList/BetList.js', () => ({
    renderFilters: () => '<div>Filters</div>',
}));
vi.mock('../../components/BetTable/BetTable.js', () => ({
    renderBetTable: () => '<div>BetTable</div>',
}));

describe('AllBets View', () => {
    it('should render filters and table', () => {
        const html = renderAllBetsView();
        expect(html).toContain('Filters');
        expect(html).toContain('BetTable');
        expect(html).toContain('Bets');
    });
});
