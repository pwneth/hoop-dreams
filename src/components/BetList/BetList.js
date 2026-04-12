import { getState, setStatusFilter, setBettorFilter } from '../../lib/store/store.js';
import { renderBetCard } from '../BetCard/BetCard.js';
import { getAvatarColor } from '../../lib/utils/utils.js';

export function renderFilters() {
  const { bets, statusFilter, bettorFilter, currentUser, allAvatars } = getState();
  const allBettors = [...new Set(bets.flatMap(b => [b.better1, b.better2]))].filter(b => b !== 'Pot').sort();
  const isShowingMyBets = currentUser && bettorFilter === currentUser.username;
  const avatars = allAvatars || {};

  const selectedName = bettorFilter !== 'all' ? bettorFilter : '';
  const selectedColor = selectedName ? getAvatarColor(selectedName) : null;
  const selectedAvatar = selectedName ? avatars[selectedName] || '' : '';

  const triggerHtml = selectedName
    ? `<span class="user-tag" style="--tag-color:${selectedColor.bg}"><span class="user-tag__icon" ${selectedAvatar ? `style="background-image:url('${selectedAvatar}')"` : ''}>${selectedName.charAt(0)}</span>${selectedName}</span>`
    : '<span class="user-select__placeholder">All Bettors</span>';

  const bettorCards = [`<div class="user-select__option js-bettor-select-option" data-value="all">
    <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); padding: 2px 8px;">All Bettors</span>
  </div>`].concat(allBettors.map(name => {
    const color = getAvatarColor(name);
    const avatar = avatars[name] || '';
    return `<div class="user-select__option js-bettor-select-option" data-value="${name}">
      <span class="user-tag" style="--tag-color:${color.bg}"><span class="user-tag__icon" ${avatar ? `style="background-image:url('${avatar}')"` : ''}>${name.charAt(0)}</span>${name}</span>
    </div>`;
  })).join('');

  return `
    <div class="filters">
      <div class="filters__group">
        <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">Active</button>
        <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">Paid</button>
        <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">Pending</button>
      </div>
      <div class="filters__group">
        <div class="user-select" id="bettorUserSelect">
          <div class="user-select__trigger" id="bettorSelectTrigger">
            ${triggerHtml}
            <span class="user-select__arrow"></span>
          </div>
          <div class="user-select__dropdown">
            ${bettorCards}
          </div>
        </div>
        ${!isShowingMyBets && currentUser ? `<button class="filter-btn filter-btn--accent js-show-my-bets">My Bets</button>` : ''}
        ${isShowingMyBets ? `<button class="filter-btn filter-btn--accent js-show-all-bets">All Bets</button>` : ''}
        <button class="filter-btn filter-btn--accent js-export-csv-trigger">&#8599; Export</button>
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
