import { describe, it, expect, vi } from 'vitest';
import { renderStatsCards } from './StatsCards.js';
import * as store from '../../lib/store/store.js';
import * as utils from '../../lib/utils/utils.js';

vi.mock('../../lib/store/store.js', () => ({ getState: vi.fn() }));
vi.mock('../../lib/utils/utils.js', () => ({ formatCurrency: val => `$${val}` }));

describe('StatsCards Component', () => {
    it('should render overall stats', () => {
        vi.mocked(store.getState).mockReturnValue({
            overallStats: {
                totalBets: 100,
                activeBets: 10,
                completedBets: 90,
                totalVolume: 5000
            }
        });

        const html = renderStatsCards();
        expect(html).toContain('100');
        expect(html).toContain('$5000');
    });
});
