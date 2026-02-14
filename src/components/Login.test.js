import { describe, it, expect, vi } from 'vitest';
import { renderLoginScreen } from './Login.js';
import * as store from '../lib/store.js';

vi.mock('../lib/store.js', () => ({
    getState: vi.fn(),
    setAuthMode: vi.fn()
}));

describe('Login Component', () => {
    it('should render login form', () => {
        vi.mocked(store.getState).mockReturnValue({ authMode: 'login' });
        const html = renderLoginScreen();
        expect(html).toContain('Login');
        expect(html).not.toContain('Create Account');
    });

    it('should render register form', () => {
        vi.mocked(store.getState).mockReturnValue({ authMode: 'register' });
        const html = renderLoginScreen();
        expect(html).toContain('Create Account');
    });

    it('should set global setAuthMode', () => {
        renderLoginScreen(); // Executing module code
        expect(window.setAuthMode).toBeDefined();
    });
});
