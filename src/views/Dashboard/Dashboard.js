import { renderActionToast } from '../../components/ActionToast/ActionToast.js';
import { renderLeaderboard } from '../../components/Leaderboard/Leaderboard.js';
import { renderBetsList } from '../../components/BetList/BetList.js';
import { getState } from '../../lib/store/store.js';

export function renderDashboardView() {
  return `
    ${renderActionToast()}
    <div class="mobile-only-action">
      <button class="btn btn--primary btn--full" id="dashNewBetBtn">Place New Bet</button>
    </div>
    ${renderLeaderboard()}

    <section class="section">
      <div class="section__header">
        <h2 class="section__title">Open Bets</h2>
      </div>
      ${renderBetsList(getState().bets.filter(b => b.status === 'active' || b.status === 'confirming' || b.status === 'pending'))}
    </section>
  `;
}
