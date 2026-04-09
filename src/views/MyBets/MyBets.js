import { getState } from '../../lib/store/store.js';
import { renderBetTable } from '../../components/BetTable/BetTable.js';
import { renderActionNeededSection } from '../../components/ActionNeeded/ActionNeeded.js';

export function renderMyBetsView() {
  const { bets, currentUser, statusFilter } = getState();
  if (!currentUser) return '';

  let myBets = bets.filter(b => b.better1 === currentUser.username || b.better2 === currentUser.username);

  if (statusFilter !== 'all') {
    if (statusFilter === 'pending') {
      myBets = myBets.filter(b => b.status === 'pending' || b.status === 'confirming');
    } else {
      myBets = myBets.filter(b => b.status === statusFilter);
    }
  }

  const filtersHtml = `
    <div class="filters">
      <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">Active</button>
      <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">Paid</button>
      <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">Pending</button>
    </div>
  `;

  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">My Bets</h2>
      </div>
      ${renderActionNeededSection()}
      ${filtersHtml}
      ${renderBetTable(myBets)}
    </section>
  `;
}
