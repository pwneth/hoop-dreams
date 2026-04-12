import { renderLeaderboard } from '../../components/Leaderboard/Leaderboard.js';
import { renderDebts } from '../../components/Debts/Debts.js';
import { renderBetTable } from '../../components/BetTable/BetTable.js';
import { renderFilters } from '../../components/BetList/BetList.js';

export function renderDashboardView() {
  return `
    <div class="dash-tabs mobile-only">
      <button class="dash-tabs__btn dash-tabs__btn--active" data-dash-tab="overview">Overview</button>
      <button class="dash-tabs__btn" data-dash-tab="bets">Bets</button>
    </div>
    <div class="dashboard-layout" data-dash-active="overview">
      <aside class="dashboard-layout__sidebar dashboard-layout__panel" data-panel="overview">
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
      <div class="dashboard-layout__main dashboard-layout__panel" data-panel="bets">
        <section class="section">
          <div class="section__header desktop-only">
            <h2 class="section__title">Bets</h2>
          </div>
          ${renderFilters()}
          ${renderBetTable()}
        </section>
      </div>
    </div>
  `;
}
