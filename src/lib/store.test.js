import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as store from './store.js';
import * as api from '../api/api.js';

vi.mock('../api/api.js', () => ({
    getCurrentUser: vi.fn(),
    calculateMemberStats: vi.fn(),
    calculateOverallStats: vi.fn(),
}));

describe('store module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state if possible, or just test state transitions
        // Since store is a singleton with let state, we can't easily reset it without an exported reset function
        // or by just setting state to initial values.
        store.setState({
            currentUser: null,
            bets: [],
            showNewBetModal: false
        });
    });

    it('should initialize with default state', () => {
        const state = store.getState();
        expect(state.bets).toEqual([]);
        expect(state.authMode).toBe('login');
    });

    it('setState should update the state', () => {
        store.setState({ authMode: 'register' });
        expect(store.getState().authMode).toBe('register');
    });

    it('subscribe should notify listeners', () => {
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);

        store.setState({ showNewBetModal: true });

        expect(listener).toHaveBeenCalled();
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ showNewBetModal: true }));

        unsubscribe();
        listener.mockClear();
        store.setState({ showNewBetModal: false });
        expect(listener).not.toHaveBeenCalled();
    });

    it('setAuthMode convenience setter', () => {
        store.setAuthMode('register');
        expect(store.getState().authMode).toBe('register');
    });
});
