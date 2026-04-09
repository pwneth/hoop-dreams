import { getState, setStatusFilter, setBettorFilter } from '../../lib/store/store.js';
import { renderBetCard } from '../BetCard/BetCard.js';

export function renderFilters() {
  const { bets, statusFilter, bettorFilter, currentUser } = getState();
  const allBettors = [...new Set(bets.flatMap(b => [b.better1, b.better2]))].filter(b => b !== 'Pot').sort();
  const bettorOptions = allBettors.map(b => `<option value="${b}" ${bettorFilter === b ? 'selected' : ''}>${b}</option>`).join('');
  const isShowingMyBets = currentUser && bettorFilter === currentUser.username;

  return `
    <div class="filters">
      <div class="filters__group">
        <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">Active</button>
        <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">Paid</button>
        <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">Pending</button>
      </div>
      <div class="filters__group">
        <select class="filter-select" id="bettorFilterSelect">
          <option value="all" ${bettorFilter === 'all' ? 'selected' : ''}>All Bettors</option>
          ${bettorOptions}
        </select>
        ${!isShowingMyBets && currentUser ? `<button class="filter-btn filter-btn--accent js-show-my-bets">My Bets</button>` : ''}
        ${isShowingMyBets ? `<button class="filter-btn filter-btn--accent js-show-all-bets">All Bets</button>` : ''}
      </div>
    </div>
  `;
}

export function renderBetsList(betsOverride = null) {
  const { bets, statusFilter, bettorFilter } = getState();
  let filteredBets = betsOverride || bets;

  if (!betsOverride) {
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filteredBets = filteredBets.filter(b => b.status === 'pending' || b.status === 'confirming');
      } else {
        filteredBets = filteredBets.filter(b => b.status === statusFilter);
      }
    }
    if (bettorFilter !== 'all') {
      filteredBets = filteredBets.filter(b => b.better1 === bettorFilter || b.better2 === bettorFilter);
    }
  }

  if (filteredBets.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">🎲</div>
        <p>No bets found</p>
      </div>
    `;
  }

  return `
    <div class="bets-grid">
      ${filteredBets.map(bet => renderBetCard(bet)).join('')}
    </div>
  `;
}
