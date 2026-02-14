import { getPendingBets } from '../lib/store.js';
import { renderBetCard } from './BetCard.js';

export function renderActionNeededSection() {
    const pendingBets = getPendingBets();
    if (pendingBets.length === 0) return '';

    return `
      <section class="section" style="margin-bottom: var(--space-xl); background: rgba(255, 71, 87, 0.05); border: 1px solid rgba(255, 71, 87, 0.2); border-radius: var(--radius-lg); padding: var(--space-md);">
        <div class="section__header" style="margin-bottom: var(--space-md);">
           <h2 class="section__title" style="color: #ff4757; font-size: 1.25rem;"><span>⚠️</span> Action Needed</h2>
        </div>
        <div class="bets-grid">
           ${pendingBets.map(bet => renderBetCard(bet)).join('')}
        </div>
      </section>
    `;
}
