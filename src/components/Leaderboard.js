import { formatCurrency } from '../lib/utils.js';
import { getState } from '../lib/store.js';

export function renderLeaderboard() {
    const { memberStats } = getState();

    if (!memberStats || memberStats.length === 0) {
        return '<div class="empty-state"><div class="empty-state__icon">📊</div>No data available</div>';
    }

    const items = memberStats.map((member, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `leaderboard__rank--${rank}` : 'leaderboard__rank--other';
        const profitClass = member.netProfit > 0 ? 'leaderboard__profit--positive' :
            member.netProfit < 0 ? 'leaderboard__profit--negative' :
                'leaderboard__profit--neutral';
        const profitSign = member.netProfit > 0 ? '+' : '';

        return `
      <div class="leaderboard__item" data-bettor="${member.name}" role="button" tabindex="0">
        <div class="leaderboard__rank ${rankClass}">${rank}</div>
        <div class="leaderboard__name">${member.name}</div>
        <div class="leaderboard__stats">${member.wins}W - ${member.losses}L (${member.winRate}%)</div>
        <div class="leaderboard__potential">${member.potentialGain > 0 ? formatCurrency(member.potentialGain) : '-'}</div>
        <div class="leaderboard__profit ${profitClass}">${profitSign}${formatCurrency(member.netProfit)}</div>
      </div>
    `;
    }).join('');

    return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🏆</span> Leaderboard</h2>
      </div>
      <div class="leaderboard">
        ${items}
      </div>
    </section>
  `;
}
