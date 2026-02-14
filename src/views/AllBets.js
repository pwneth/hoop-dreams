import { getState } from '../lib/store.js';
import { renderStatsCards } from '../components/StatsCards.js';
import { renderIndividualStats } from '../components/Stats.js';
import { renderFilters, renderBetsList } from '../components/BetList.js';

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
