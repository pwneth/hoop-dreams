import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderBetCard } from './BetCard.js';
import * as store from '../lib/store.js';

vi.mock('../lib/store.js', () => ({
    getState: vi.fn()
}));

vi.mock('../lib/utils.js', () => ({
    formatCurrency: (val) => `$${val}`,
    formatDate: (val) => 'Date',
    getOtherBetter: (bet, user) => ({ name: 'Other' })
}));

describe('BetCard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render bet details correctly', () => {
        const mockBet = {
            id: 1,
            better1: 'User1',
            better2: 'User2',
            better1Bet: 'Team A',
            better2Bet: 'Team B',
            better1Reward: 10,
            better2Reward: 10,
            status: 'pending',
            date: new Date(),
        };

        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'User1' },
            resolveIsSubmitting: false
        });

        const html = renderBetCard(mockBet);

        expect(html).toContain('User1');
        expect(html).toContain('User2');
        expect(html).toContain('Team A');
        expect(html).toContain('Team B');
        expect(html).toContain('$10');
    });

    it('should show actions for participant', () => {
        const mockBet = {
            id: 1,
            better1: 'User1',
            better2: 'User2',
            status: 'confirming',
            confirmingBetId: 1
        };

        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'User2' }, // Needs to confirm
            confirmingBetId: 1
        });

        const html = renderBetCard(mockBet);
        expect(html).toContain('Accept this bet?');
    });
});
