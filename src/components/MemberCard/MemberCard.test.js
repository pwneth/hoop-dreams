import { describe, it, expect, vi } from 'vitest';
import { renderMemberCard } from './MemberCard.js';
import * as utils from '../../lib/utils/utils.js';

// Mock utils
vi.mock('../../lib/utils/utils.js', () => ({
    formatCurrency: val => `$${val}`,
    getInitials: name => name[0]
}));

describe('MemberCard Component', () => {
    it('should render member stats', () => {
        const member = {
            name: 'Alice',
            wins: 10,
            losses: 5,
            winRate: 66,
            netProfit: 100
        };
        const html = renderMemberCard(member);
        expect(html).toContain('Alice');
        expect(html).toContain('10W - 5L');
        expect(html).toContain('66%');
        expect(html).toContain('$100');
    });
});
