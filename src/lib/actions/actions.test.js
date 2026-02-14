import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './actions.js';
import * as api from '../../api/api.js';
import * as store from '../store/store.js';
import * as confetti from '../confetti/confetti.js';

vi.mock('../../api/api.js', () => ({
    fetchBets: vi.fn(),
    calculateMemberStats: vi.fn(),
    calculateOverallStats: vi.fn(),
    createBet: vi.fn(),
    updateBet: vi.fn(),
    confirmBet: vi.fn(),
    markBetAsPaid: vi.fn(),
    getCurrentUser: vi.fn()
}));

vi.mock('../store/store.js', () => ({
    getState: vi.fn(),
    setState: vi.fn()
}));

vi.mock('../confetti/confetti.js', () => ({
    triggerConfetti: vi.fn()
}));

vi.mock('../utils/utils.js', () => ({
    formatCurrency: (val) => val
}));

describe('actions module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('refreshData', () => {
        it('should fetch data and update state', async () => {
            const bets = [];
            const memberStats = [];
            const overallStats = {};
            vi.mocked(api.fetchBets).mockResolvedValue(bets);
            vi.mocked(api.calculateMemberStats).mockReturnValue(memberStats);
            vi.mocked(api.calculateOverallStats).mockReturnValue(overallStats);

            await actions.refreshData();

            expect(api.fetchBets).toHaveBeenCalled();
            expect(store.setState).toHaveBeenCalledWith({ bets, memberStats, overallStats });
        });
    });

    // We skip complex DOM interaction tests for now and rely on these basic confirmations
    // that the logic glue holds.
});
