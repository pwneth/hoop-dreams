import { describe, it, expect } from 'vitest';
import { renderLoading } from './Loader.js';

describe('Loader Component', () => {
    it('should render engaging loader with icon and message', () => {
        const html = renderLoading();
        expect(html).toContain('app-loader');
        expect(html).toContain('app-loader__icon');
        expect(html).toContain('app-loader__spinner');
        expect(html).toContain('app-loader__text');
    });
});
