import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as auth from './auth.js';
import * as api from '../../api/api.js';
import { setState } from '../store/store.js';

// Mock dependencies
vi.mock('../../api/api.js', () => ({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    getCurrentUser: vi.fn()
}));

vi.mock('../store/store.js', () => ({
    setState: vi.fn()
}));

describe('auth module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should call api.login and update state', async () => {
            const mockUser = { username: 'testuser' };
            vi.mocked(api.login).mockResolvedValue(mockUser);

            const result = await auth.login('testuser', 'password');

            expect(api.login).toHaveBeenCalledWith('testuser', 'password');
            expect(setState).toHaveBeenCalledWith({ currentUser: mockUser, authMode: 'login' });
            expect(result).toBe(mockUser);
        });
    });

    describe('register', () => {
        it('should call api.register and update state', async () => {
            const mockUser = { username: 'newuser' };
            vi.mocked(api.register).mockResolvedValue(mockUser);

            const result = await auth.register('newuser', 'password');

            expect(api.register).toHaveBeenCalledWith('newuser', 'password');
            expect(setState).toHaveBeenCalledWith({ currentUser: mockUser, authMode: 'login' });
            expect(result).toBe(mockUser);
        });
    });

    describe('logout', () => {
        it('should call api.logout and clear state', () => {
            auth.logout();

            expect(api.logout).toHaveBeenCalled();
            expect(setState).toHaveBeenCalledWith({ currentUser: null, authMode: 'login' });
        });
    });

    describe('changePassword', () => {
        it('should call api.changePassword and update state on success', async () => {
            vi.mocked(api.changePassword).mockResolvedValue(true);
            const mockUser = { username: 'testuser' };
            vi.mocked(api.getCurrentUser).mockReturnValue(mockUser);

            const result = await auth.changePassword('old', 'new');

            expect(api.changePassword).toHaveBeenCalledWith('old', 'new');
            expect(api.getCurrentUser).toHaveBeenCalled();
            expect(setState).toHaveBeenCalledWith({ currentUser: mockUser });
            expect(result).toBe(true);
        });

        it('should return false and not update state on failure', async () => {
            vi.mocked(api.changePassword).mockResolvedValue(false);

            const result = await auth.changePassword('old', 'new');

            expect(api.changePassword).toHaveBeenCalledWith('old', 'new');
            expect(setState).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });
});
