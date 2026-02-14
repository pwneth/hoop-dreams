import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderActionNeededSection } from './ActionNeeded.js';
import * as store from '../../lib/store/store.js';
import * as betCard from '../BetCard/BetCard.js';

vi.mock('../../lib/store/store.js', () => ({
    getPendingBets: vi.fn()
}));

vi.mock('../BetCard/BetCard.js', () => ({
    renderBetCard: vi.fn()
}));

describe('ActionNeeded Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return empty string if no pending bets', () => {
        vi.mocked(store.getPendingBets).mockReturnValue([]);
        const html = renderActionNeededSection();
        expect(html).toBe('');
    });

    it('should render section with bets if pending bets exist', () => {
        const mockBets = [{ id: 1 }, { id: 2 }];
        vi.mocked(store.getPendingBets).mockReturnValue(mockBets);
        vi.mocked(betCard.renderBetCard).mockReturnValue('<div class="bet-card"></div>');

        const html = renderActionNeededSection();
        expect(html).toContain('Action Needed');
        expect(html).toContain('bet-card');
        expect(betCard.renderBetCard).toHaveBeenCalledTimes(2);
    });
});
