import { formatCurrency, renderUserTag } from '../../lib/utils/utils.js';
import { getState } from '../../lib/store/store.js';

export function renderLeaderboard(compact = false) {
  const state = getState();
  const { memberStats } = state;

  if (!memberStats || memberStats.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">📊</div>No data available</div>';
  }

  const items = memberStats.map((member, index) => {
    const rank = index + 1;
    const rankEmojis = ['&#129351;', '&#129352;', '&#129353;', '4&#65039;&#8419;', '5&#65039;&#8419;', '6&#65039;&#8419;', '7&#65039;&#8419;', '8&#65039;&#8419;', '9&#65039;&#8419;'];
    const rankIcon = rank <= rankEmojis.length ? rankEmojis[rank - 1] : rank;
    const rankClass = rank <= 9 ? 'leaderboard__rank--medal' : 'leaderboard__rank--other';
    const profitClass = member.netProfit > 0 ? 'leaderboard__profit--positive' :
      member.netProfit < 0 ? 'leaderboard__profit--negative' :
        'leaderboard__profit--neutral';
    const profitSign = member.netProfit > 0 ? '+' : '';

    return `
      <div class="leaderboard__item" data-bettor="${member.name}" role="button" tabindex="0">
        <div class="leaderboard__rank ${rankClass}">${rankIcon}</div>
        <div class="leaderboard__name">${renderUserTag(member.name, state)}</div>
        <div class="leaderboard__stats">${member.wins}W - ${member.losses}L (${member.winRate}%)</div>
        <div class="leaderboard__potential">${member.potentialGain > 0 ? formatCurrency(member.potentialGain) : '-'}</div>
        <div class="leaderboard__profit ${profitClass}">${profitSign}${formatCurrency(member.netProfit)}</div>
      </div>
    `;
  }).join('');

  if (compact) {
    return `
      <div class="leaderboard">
        ${items}
      </div>
    `;
  }

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
