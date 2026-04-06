import { getState } from '../../lib/store/store.js';
import { formatCurrency } from '../../lib/utils/utils.js';

export function renderStatsCards() {
  const { overallStats } = getState();

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-card__label">Total Bets</span>
        <span class="stat-card__value">${overallStats.totalBets || 0}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Active Bets</span>
        <span class="stat-card__value">${overallStats.activeBets || 0}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Completed</span>
        <span class="stat-card__value">${overallStats.completedBets || 0}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Total Volume</span>
        <span class="stat-card__value">${formatCurrency(overallStats.totalVolume || 0)}</span>
      </div>
    </div>
  `;
}
