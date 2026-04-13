import { describe, it, expect, vi } from 'vitest';
import { renderChangePasswordModal, renderNewBetModal } from './Modals.js';
import * as store from '../../lib/store/store.js';

vi.mock('../../lib/store/store.js', () => ({ getState: vi.fn() }));
vi.mock('../../api/api.js', () => ({ LEAGUE_MEMBERS: ['User1', 'User2'] }));

describe('Modals Component', () => {
    describe('ChangePasswordModal', () => {
        it('should return empty string (merged into settings)', () => {
            expect(renderChangePasswordModal()).toBe('');
        });
    });

    describe('NewBetModal', () => {
        it('should render if showNewBetModal is true', () => {
            vi.mocked(store.getState).mockReturnValue({
                showNewBetModal: true,
                currentUser: { username: 'User1' }
            });
            const html = renderNewBetModal();
            expect(html).toContain('New Bet');
            expect(html).toContain('User1');
        });
    });
});
