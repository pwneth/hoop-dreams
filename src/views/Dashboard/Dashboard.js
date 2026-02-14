import { renderActionToast } from '../../components/ActionToast/ActionToast.js';
import { renderStatsCards } from '../../components/StatsCards/StatsCards.js';
import { renderLeaderboard } from '../../components/Leaderboard/Leaderboard.js';
import { renderBetsList } from '../../components/BetList/BetList.js';
import { getState } from '../../lib/store/store.js';

export function renderDashboardView() {
  return `
    ${renderActionToast()}
    <div class="mobile-only-action">
      <button class="btn btn--primary btn--full" id="dashNewBetBtn">Place New Bet</button>
    </div>
    ${renderStatsCards()}
    ${renderLeaderboard()}

    <section class="section">
      <div class="section__header">
        <h2 class="section__title">Recent Activity</h2>
      </div>
      ${renderBetsList(getState().bets.slice(0, 5))}
      <div style="margin-top: var(--space-lg); text-align: center;">
        <button class="nav-btn nav-btn--outline" data-path="/bets" style="width: 100%; justify-content: center;">View All Bets</button>
      </div>
    </section>
  `;
}
