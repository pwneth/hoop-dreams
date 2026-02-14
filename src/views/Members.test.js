import { describe, it, expect, vi } from 'vitest';
import { renderMembersView } from './Members.js';
import * as store from '../lib/store.js';

vi.mock('../lib/store.js', () => ({ getState: vi.fn() }));
vi.mock('../components/MemberCard.js', () => ({ renderMemberCard: (m) => `<div>${m.name}</div>` }));

describe('Members View', () => {
    it('should render member list', () => {
        vi.mocked(store.getState).mockReturnValue({
            memberStats: [{ name: 'Alice' }, { name: 'Bob' }]
        });
        const html = renderMembersView();
        expect(html).toContain('Alice');
        expect(html).toContain('Bob');
    });

    it('should render empty state', () => {
        vi.mocked(store.getState).mockReturnValue({ memberStats: [] });
        const html = renderMembersView();
        expect(html).toContain('No members found');
    });
});
