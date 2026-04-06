import { getState } from '../../lib/store/store.js';
import { formatCurrency } from '../../lib/utils/utils.js';
import { renderStatsCards } from '../StatsCards/StatsCards.js';

export function renderIndividualStats(name) {
  const { memberStats } = getState();
  const member = memberStats.find(m => m.name === name);
  if (!member) return '';
  const totalBets = (member.wins || 0) + (member.losses || 0) + (member.activeBets || 0);
  const profitSign = member.netProfit > 0 ? '+' : '';
  const profitClass = member.netProfit > 0 ? 'stat-card__value--positive' : member.netProfit < 0 ? 'stat-card__value--negative' : '';

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-card__label">Total Bets</span>
        <span class="stat-card__value">${totalBets}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Won</span>
        <span class="stat-card__value stat-card__value--positive">${member.wins}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Lost</span>
        <span class="stat-card__value stat-card__value--negative">${member.losses}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Potential</span>
        <span class="stat-card__value">${formatCurrency(member.potentialGain || 0)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Net Profit</span>
        <span class="stat-card__value ${profitClass}">${profitSign}${formatCurrency(member.netProfit)}</span>
      </div>
    </div>
  `;
}
