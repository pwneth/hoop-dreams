import { getState } from '../../lib/store/store.js';
import { renderStatsCards } from '../../components/StatsCards/StatsCards.js';
import { renderIndividualStats } from '../../components/Stats/Stats.js';
import { renderFilters, renderBetsList } from '../../components/BetList/BetList.js';

export function renderAllBetsView() {
  const { bettorFilter } = getState();
  const statsHtml = bettorFilter === 'all' ? renderStatsCards() : renderIndividualStats(bettorFilter);

  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">All Bets</h2>
      </div>
      ${renderFilters()}
      ${statsHtml}
      ${renderBetsList()}
    </section>
  `;
}
