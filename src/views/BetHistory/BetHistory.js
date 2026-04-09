import { getState } from '../../lib/store/store.js';
import { renderFilters } from '../../components/BetList/BetList.js';
import { renderBetTable } from '../../components/BetTable/BetTable.js';

export function renderBetHistoryView() {
  const { bets } = getState();

  // Summary stats for the filtered view
  const totalBets = bets.filter(b => b.status !== 'confirming').length;
  const totalVolume = bets.reduce((sum, b) => sum + Math.max(b.better1Reward, b.better2Reward), 0);
  const paidBets = bets.filter(b => b.status === 'paid').length;
  const activeBets = bets.filter(b => b.status === 'active').length;

  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">Bet History</h2>
      </div>
      <div class="history-summary">
        <div class="history-summary__item">
          <span class="history-summary__value">${totalBets}</span>
          <span class="history-summary__label">Total</span>
        </div>
        <div class="history-summary__item">
          <span class="history-summary__value">${activeBets}</span>
          <span class="history-summary__label">Active</span>
        </div>
        <div class="history-summary__item">
          <span class="history-summary__value">${paidBets}</span>
          <span class="history-summary__label">Settled</span>
        </div>
        <div class="history-summary__item">
          <span class="history-summary__value">&euro;${totalVolume.toFixed(0)}</span>
          <span class="history-summary__label">Volume</span>
        </div>
      </div>
      ${renderFilters()}
      ${renderBetTable()}
    </section>
  `;
}
