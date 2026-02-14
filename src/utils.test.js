import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, getInitials, getOtherBetter } from './lib/utils.js';

describe('formatCurrency', () => {
    it('should format currency correctly', () => {
        expect(formatCurrency(10)).toBe('€10.00');
        expect(formatCurrency(0)).toBe('€0.00');
        expect(formatCurrency(1234.56)).toBe('€1234.56');
    });
});

describe('getInitials', () => {
    it('should return initials correctly', () => {
        expect(getInitials('John Doe')).toBe('JD');
        expect(getInitials('Alice')).toBe('A');
        expect(getInitials('Michael Jordan')).toBe('MJ');
    });
});

describe('formatDate', () => {
    it('should format date correctly', () => {
        const date = new Date(2023, 0, 1); // Jan 1 2023
        const formatted = formatDate(date);
        expect(formatted).toContain('2023');
        expect(formatted).not.toBe('N/A');
    });

    it('should handle null/undefined', () => {
        expect(formatDate(null)).toBe('N/A');
        expect(formatDate(undefined)).toBe('N/A');
    });
});

describe('getOtherBetter', () => {
    it('should return the opponent name', () => {
        const bet = { better1: 'Alice', better2: 'Bob' };
        expect(getOtherBetter(bet, { username: 'Alice' })).toEqual({ name: 'Bob' });
        expect(getOtherBetter(bet, { username: 'Bob' })).toEqual({ name: 'Alice' });
    });

    it('should return Opponent if user is null', () => {
        const bet = { better1: 'Alice', better2: 'Bob' };
        expect(getOtherBetter(bet, null)).toEqual({ name: 'Opponent' });
    });
});
