import { renderLeaderboard } from '../../components/Leaderboard/Leaderboard.js';
import { renderDebts } from '../../components/Debts/Debts.js';
import { renderBetTable } from '../../components/BetTable/BetTable.js';
import { renderFilters } from '../../components/BetList/BetList.js';

export function renderDashboardView() {
  return `
    <div class="mobile-only-action">
      <button class="btn btn--primary btn--full" id="dashNewBetBtn">Place New Bet</button>
    </div>
    <div class="dashboard-layout">
      <aside class="dashboard-layout__sidebar">
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">Leaderboard</h2>
          </div>
          ${renderLeaderboard(true)}
        </section>
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">Settle Up</h2>
          </div>
          ${renderDebts()}
        </section>
      </aside>
      <div class="dashboard-layout__main">
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">Bets</h2>
          </div>
          ${renderFilters()}
          ${renderBetTable()}
        </section>
      </div>
    </div>
  `;
}
