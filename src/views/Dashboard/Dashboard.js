import { renderLeaderboard } from '../../components/Leaderboard/Leaderboard.js';
import { renderDebts } from '../../components/Debts/Debts.js';
import { renderBetTable } from '../../components/BetTable/BetTable.js';
import { renderFilters } from '../../components/BetList/BetList.js';

export function renderDashboardView() {
  return `
    <div class="dash-tabs mobile-only">
      <button class="dash-tabs__btn dash-tabs__btn--active" data-dash-tab="bets">Bets</button>
      <button class="dash-tabs__btn" data-dash-tab="leaderboard">Leaderboard</button>
      <button class="dash-tabs__btn" data-dash-tab="settle">Settle Up</button>
    </div>
    <div class="dashboard-layout" data-dash-active="bets">
      <aside class="dashboard-layout__sidebar">
        <section class="section dashboard-layout__panel" data-panel="leaderboard">
          <div class="section__header desktop-only">
            <h2 class="section__title">Leaderboard</h2>
          </div>
          ${renderLeaderboard(true)}
        </section>
        <section class="section dashboard-layout__panel" data-panel="settle">
          <div class="section__header desktop-only">
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
