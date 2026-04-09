import { renderFilters } from '../../components/BetList/BetList.js';
import { renderBetTable } from '../../components/BetTable/BetTable.js';

export function renderAllBetsView() {
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">Bets</h2>
      </div>
      ${renderFilters()}
      ${renderBetTable()}
    </section>
  `;
}
