import { describe, it, expect, vi } from 'vitest';
import { renderActionToast } from './ActionToast.js';
import * as store from '../lib/store.js';

vi.mock('../lib/store.js', () => ({
    getPendingActionCount: vi.fn()
}));

describe('ActionToast Component', () => {
    it('should return empty string if count is 0', () => {
        vi.mocked(store.getPendingActionCount).mockReturnValue(0);
        expect(renderActionToast()).toBe('');
    });

    it('should render toast if count > 0', () => {
        vi.mocked(store.getPendingActionCount).mockReturnValue(3);
        const html = renderActionToast();
        expect(html).toContain('You have <strong>3</strong> action');
    });
});
