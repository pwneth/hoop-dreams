import { renderActionToast } from '../components/ActionToast.js';
import { renderStatsCards } from '../components/StatsCards.js';
import { renderLeaderboard } from '../components/Leaderboard.js';

export function renderDashboardView() {
    return `
    ${renderActionToast()}
    <div class="mobile-only-action">
      <button class="btn btn--primary btn--full" id="dashNewBetBtn">Place New Bet</button>
    </div>
    ${renderStatsCards()}
    ${renderLeaderboard()}
  `;
}
