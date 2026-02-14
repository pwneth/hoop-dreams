import { describe, it, expect } from 'vitest';
import { calculateMemberStats, calculateOverallStats, parseCurrency, parseDate } from './api.js';

describe('parseCurrency', () => {
    it('should parse currency strings', () => {
        expect(parseCurrency('€100')).toBe(100);
        expect(parseCurrency('1,000')).toBe(1000); // Wait, helper logic might remove comma but float parsing?
        // "1,000".replace(/[€$,]/g, '') -> "1000". parseFloat("1000") -> 1000. Correct.
        expect(parseCurrency('$50.50')).toBe(50.5);
        expect(parseCurrency('')).toBe(0);
        expect(parseCurrency(undefined)).toBe(0);
    });
});

describe('parseDate', () => {
    it('should parse ISO strings', () => {
        const d = parseDate('2023-01-01T00:00:00.000Z');
        expect(d).toBeInstanceOf(Date);
        expect(d.getFullYear()).toBe(2023);
    });

    it('should parse simple date strings', () => {
        const d = parseDate('15-Jan-2025');
        expect(d).toBeInstanceOf(Date);
        expect(d.getFullYear()).toBe(2025);
        expect(d.getMonth()).toBe(0); // Jan is 0
        expect(d.getDate()).toBe(15);
    });

    it('should return null for invalid dates', () => {
        expect(parseDate('')).toBeNull();
    });
});

describe('calculateMemberStats', () => {
    it('should calculate stats correctly for a simple bet', () => {
        const bets = [
            {
                better1: 'Alice', better2: 'Bob',
                better1Reward: 10, better2Reward: 10,
                status: 'paid',
                winnerName: 'Alice', loserName: 'Bob',
                amountWon: 10, amountLost: 10
            }
        ];

        const stats = calculateMemberStats(bets);

        // Alice
        const alice = stats.find(s => s.name === 'Alice');
        expect(alice).toBeDefined();
        expect(alice.wins).toBe(1);
        expect(alice.totalWon).toBe(10);
        expect(alice.netProfit).toBe(10);

        // Bob
        const bob = stats.find(s => s.name === 'Bob');
        expect(bob).toBeDefined();
        expect(bob.losses).toBe(1);
        expect(bob.totalLost).toBe(10);
        expect(bob.netProfit).toBe(-10);
    });
});

describe('calculateOverallStats', () => {
    it('should calculate overall stats', () => {
        const bets = [
            { status: 'active', better1Reward: 10, better2Reward: 10 },
            { status: 'paid', better1Reward: 20, better2Reward: 20 },
            { status: 'pending' } // Pending is pending result or payment
        ];

        const stats = calculateOverallStats(bets);

        // officialBets excludes 'confirming'. Assuming none are confirming.
        expect(stats.totalBets).toBe(3);
        expect(stats.activeBets).toBe(1);
        expect(stats.completedBets).toBe(1);
        expect(stats.pendingBets).toBe(1);
    });
});
