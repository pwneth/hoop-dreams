import { describe, it, expect, vi } from 'vitest';
import { renderIndividualStats } from './Stats.js';
import * as store from '../lib/store.js';
import * as utils from '../lib/utils.js';

vi.mock('../lib/store.js', () => ({ getState: vi.fn() }));
vi.mock('../lib/utils.js', () => ({ formatCurrency: val => `$${val}` }));

describe('Stats Component', () => {
    it('should render individual stats', () => {
        const member = {
            name: 'Alice',
            wins: 5,
            losses: 2,
            activeBets: 1,
            netProfit: 50,
            potentialGain: 10
        };
        vi.mocked(store.getState).mockReturnValue({
            memberStats: [member]
        });

        const html = renderIndividualStats('Alice');
        expect(html).toContain('Total Bets');
        expect(html).toContain('8'); // 5+2+1
        expect(html).toContain('$50');
    });

    it('should return empty string if member not found', () => {
        vi.mocked(store.getState).mockReturnValue({ memberStats: [] });
        expect(renderIndividualStats('Bob')).toBe('');
    });
});
