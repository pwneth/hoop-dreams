import { getState } from '../lib/store.js';
import { formatCurrency } from '../lib/utils.js';
import { renderStatsCards } from './StatsCards.js';

export function renderIndividualStats(name) {
    const { memberStats, overallStats } = getState();
    const member = memberStats.find(m => m.name === name);
    if (!member) return '';
    const totalBets = (member.wins || 0) + (member.losses || 0) + (member.activeBets || 0);
    const profitSign = member.netProfit > 0 ? '+' : '';
    const netColor = member.netProfit >= 0 ? 'var(--status-active)' : '#ff4757';

    return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__label">Total Bets</div>
        <div class="stat-card__value">${totalBets}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Won</div>
        <div class="stat-card__value" style="color: var(--status-active);">${member.wins}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Lost</div>
        <div class="stat-card__value" style="color: #ff4757;">${member.losses}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Potential</div>
        <div class="stat-card__value" style="color: var(--text-secondary);">${formatCurrency(member.potentialGain || 0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Net</div>
        <div class="stat-card__value" style="color: ${netColor};">${profitSign}${formatCurrency(member.netProfit)}</div>
      </div>
    </div>
  `;
}
