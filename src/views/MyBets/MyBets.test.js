import { describe, it, expect, vi } from 'vitest';
import { renderMyBetsView } from './MyBets.js';
import * as store from '../../lib/store/store.js';

vi.mock('../../lib/store/store.js', () => ({ getState: vi.fn() }));
vi.mock('../../components/Stats/Stats.js', () => ({ renderIndividualStats: () => '<div>MyStats</div>' }));
vi.mock('../../components/BetCard/BetCard.js', () => ({ renderBetCard: () => '<div>BetCard</div>' }));
vi.mock('../../components/ActionNeeded/ActionNeeded.js', () => ({ renderActionNeededSection: () => '<div>ActionNeeded</div>' }));

describe('MyBets View', () => {
    it('should render nothing if not logged in', () => {
        vi.mocked(store.getState).mockReturnValue({ currentUser: null });
        const html = renderMyBetsView();
        expect(html).toBe('');
    });

    it('should render bets and stats for user', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'Me' },
            bets: [{ better1: 'Me', status: 'active' }],
            statusFilter: 'all'
        });
        const html = renderMyBetsView();
        expect(html).toContain('MyStats');
        expect(html).toContain('BetCard');
        expect(html).toContain('ActionNeeded');
    });

    it('should render empty state if no bets', () => {
        vi.mocked(store.getState).mockReturnValue({
            currentUser: { username: 'Me' },
            bets: [],
            statusFilter: 'all'
        });
        const html = renderMyBetsView();
        expect(html).toContain('No bets found');
    });
});
