import confetti from 'canvas-confetti';

export function triggerConfetti(type = 'happy') {
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 2000
    };

    if (type === 'happy') {
        confetti({
            ...defaults,
            particleCount: 100,
            spread: 70,
            colors: ['#6001D2', '#00D9A5', '#FFD700'],
            shapes: ['circle', 'square'],
            scalar: 1.2
        });
    } else if (type === 'sad') {
        const scalar = 4;
        const shapes = [
            confetti.shapeFromText({ text: '😭', scalar }),
            confetti.shapeFromText({ text: '😞', scalar }),
            confetti.shapeFromText({ text: '💔', scalar }),
            confetti.shapeFromText({ text: '📉', scalar })
        ];

        confetti({
            ...defaults,
            shapes,
            particleCount: 40,
            spread: 60,
            scalar,
            gravity: 1.2,
            ticks: 150
        });
    } else if (type === 'dice') {
        const scalar = 3;
        const dice = confetti.shapeFromText({ text: '🎲', scalar });
        const sparkle = confetti.shapeFromText({ text: '✨', scalar });

        confetti({
            ...defaults,
            shapes: [dice, sparkle],
            particleCount: 30,
            spread: 80,
            scalar
        });
    }
}
