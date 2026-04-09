import { getState } from '../../lib/store/store.js';
import { formatCurrency } from '../../lib/utils/utils.js';

export function renderStatsCards() {
  const { overallStats } = getState();

  return `
    <div class="stats-bar">
      <div class="stats-bar__item">
        <span class="stats-bar__value">${overallStats.totalBets || 0}</span>
        <span class="stats-bar__label">Bets</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${overallStats.activeBets || 0}</span>
        <span class="stats-bar__label">Active</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${overallStats.completedBets || 0}</span>
        <span class="stats-bar__label">Done</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${formatCurrency(overallStats.totalVolume || 0)}</span>
        <span class="stats-bar__label">Volume</span>
      </div>
    </div>
  `;
}
