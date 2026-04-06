import { renderActionToast } from '../../components/ActionToast/ActionToast.js';
import { renderStatsCards } from '../../components/StatsCards/StatsCards.js';
import { renderLeaderboard } from '../../components/Leaderboard/Leaderboard.js';
import { renderBetsList } from '../../components/BetList/BetList.js';
import { getState } from '../../lib/store/store.js';

export function renderDashboardView() {
  return `
    ${renderActionToast()}
    
    <!-- Mobile FAB -->
    <div class="mobile-main-action">
      <button class="btn btn--primary btn--full mobile-fab" id="dashNewBetBtn">
        <span style="margin-right: 8px;">🏀</span> PLACE NEW BET
      </button>
    </div>

    <div class="dashboard-layout">
      <aside class="dashboard-sidebar">
        ${renderLeaderboard()}
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">Stats</h2>
          </div>
          ${renderStatsCards()}
        </section>
      </aside>
      <div class="dashboard-main">
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">All Bets</h2>
          </div>
          ${renderBetsList(getState().bets)}
        </section>
      </div>
    </div>
  `;
}
