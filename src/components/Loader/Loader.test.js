import { describe, it, expect } from 'vitest';
import { renderLoading } from './Loader.js';

describe('Loader Component', () => {
    it('should render skeleton structure', () => {
        const html = renderLoading();
        expect(html).toContain('skeleton-leaderboard');
        expect(html).toContain('skeleton-bet-card');
    });
});
