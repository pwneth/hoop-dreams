import { getState } from '../lib/store.js';
import { renderIndividualStats } from '../components/Stats.js';
import { renderBetCard } from '../components/BetCard.js';
import { renderActionNeededSection } from '../components/ActionNeeded.js';

export function renderMyBetsView() {
    const { bets, currentUser, statusFilter } = getState();
    if (!currentUser) return '';

    let myBets = bets.filter(b => b.better1 === currentUser.username || b.better2 === currentUser.username);

    // Filter by status if needed
    if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
            myBets = myBets.filter(b => b.status === 'pending' || b.status === 'confirming');
        } else {
            myBets = myBets.filter(b => b.status === statusFilter);
        }
    }

    // Reuse renderIndividualStats for the current user's summary
    const statsHtml = renderIndividualStats(currentUser.username);

    const filtersHtml = `
    <div class="filters">
      <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">🟢 Active</button>
      <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">✅ Paid</button>
      <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">⏳ Pending</button>
    </div>
  `;

    let betsHtml = '';
    if (myBets.length === 0) {
        betsHtml = `
      <div class="empty-state">
        <div class="empty-state__icon">🎲</div>
        <p>No bets found matching criteria.</p>
        ${statusFilter === 'all' ? '<button class="btn btn--primary js-new-bet-btn" style="margin-top: var(--space-md);">Place your first bet</button>' : ''}
      </div>
    `;
    } else {
        betsHtml = `
      <div class="bets-grid">
        ${myBets.map(bet => renderBetCard(bet)).join('')}
      </div>
    `;
    }

    return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">My Bets</h2>
      </div>
      ${renderActionNeededSection()}
      ${filtersHtml}
      ${statsHtml}
      ${betsHtml}
    </section>
  `;
}
