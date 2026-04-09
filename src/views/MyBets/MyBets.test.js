import { describe, it, expect, vi } from 'vitest';
import { renderMyBetsView } from './MyBets.js';
import * as store from '../../lib/store/store.js';

vi.mock('../../lib/store/store.js', () => ({
    getState: vi.fn(),
    getPendingBets: vi.fn(() => []),
}));
vi.mock('../../components/BetTable/BetTable.js', () => ({ renderBetTable: () => '<div>BetTable</div>' }));
vi.mock('../../components/ActionNeeded/ActionNeeded.js', () => ({ renderActionNeededSection: () => '<div>ActionNeeded</div>' }));

describe('MyBets View', () => {
    it('should render nothing if not logged in', () => {
        vi.mocked(store.getState).mockReturnValue({ currentUser: null });
        const html = renderMyBetsView();
        expect(html).toBe('');
    });

    it('should render table and action needed for user', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'Me' },
            bets: [{ better1: 'Me', status: 'active' }],
            statusFilter: 'all'
        });
        const html = renderMyBetsView();
        expect(html).toContain('BetTable');
        expect(html).toContain('ActionNeeded');
        expect(html).toContain('My Bets');
    });

    it('should render table even with no bets', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'Me' },
            bets: [],
            statusFilter: 'all'
        });
        const html = renderMyBetsView();
        expect(html).toContain('BetTable');
        expect(html).toContain('My Bets');
    });
});
