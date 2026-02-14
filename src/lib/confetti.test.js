import { describe, it, expect, vi } from 'vitest';
import { triggerConfetti } from './confetti.js';
import confetti from 'canvas-confetti';

vi.mock('canvas-confetti', () => {
    const fn = vi.fn();
    fn.shapeFromText = vi.fn();
    return { default: fn };
});

describe('confetti module', () => {
    it('should call confetti with specific options for happy', () => {
        triggerConfetti('happy');
        expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
            particleCount: 100
        }));
    });

    it('should call confetti for sad', () => {
        triggerConfetti('sad');
        expect(confetti).toHaveBeenCalled();
        expect(confetti.shapeFromText).toHaveBeenCalled();
    });

    it('should call confetti for dice', () => {
        triggerConfetti('dice');
        expect(confetti.shapeFromText).toHaveBeenCalledWith(expect.objectContaining({ text: '🎲' }));
    });
});
