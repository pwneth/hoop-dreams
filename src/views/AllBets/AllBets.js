import { getState } from '../../lib/store/store.js';
import { renderFilters, renderBetsList } from '../../components/BetList/BetList.js';

export function renderAllBetsView() {
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">All Bets</h2>
      </div>
      ${renderFilters()}
      ${renderBetsList()}
    </section>
  `;
}
