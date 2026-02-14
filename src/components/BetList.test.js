import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderBetsList, renderFilters } from './BetList.js';
import * as store from '../lib/store.js';
import * as betCard from './BetCard.js';

vi.mock('../lib/store.js', () => ({
    getState: vi.fn()
}));

vi.mock('./BetCard.js', () => ({
    renderBetCard: vi.fn(bet => `<div class="mock-bet">${bet.id}</div>`)
}));

describe('BetList Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('renderFilters', () => {
        it('should render correct filters', () => {
            vi.mocked(store.getState).mockReturnValue({
                bets: [{ better1: 'Alice', better2: 'Bob' }],
                statusFilter: 'all',
                bettorFilter: 'all'
            });

            const html = renderFilters();
            expect(html).toContain('All Bettors');
            expect(html).toContain('Alice');
            expect(html).toContain('Bob');
        });
    });

    describe('renderBetsList', () => {
        it('should render filtered bets', () => {
            const bets = [
                { id: 1, status: 'paid', better1: 'Alice' },
                { id: 2, status: 'pending', better1: 'Bob' }
            ];
            vi.mocked(store.getState).mockReturnValue({
                bets,
                statusFilter: 'paid',
                bettorFilter: 'all'
            });

            const html = renderBetsList();
            expect(html).toContain('mock-bet');
            expect(html).toContain('1'); // Paid bet
            expect(html).not.toContain('2'); // Pending bet filtered out
        });

        it('should render empty state if no bets match', () => {
            vi.mocked(store.getState).mockReturnValue({
                bets: [],
                statusFilter: 'all',
                bettorFilter: 'all'
            });

            const html = renderBetsList();
            expect(html).toContain('No bets found');
        });
    });
});
