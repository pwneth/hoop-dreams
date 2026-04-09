import { getState } from '../../lib/store/store.js';
import { formatCurrency, formatDate } from '../../lib/utils/utils.js';

export function renderBetTable(betsOverride = null) {
  const { bets, statusFilter, bettorFilter, historySort } = getState();
  let filteredBets = betsOverride || [...bets];

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

  // Apply sorting
  const sort = historySort || { key: 'date', dir: 'desc' };
  filteredBets.sort((a, b) => {
    let valA, valB;
    switch (sort.key) {
      case 'date':
        valA = a.date ? a.date.getTime() : 0;
        valB = b.date ? b.date.getTime() : 0;
        break;
      case 'better1':
        valA = a.better1.toLowerCase();
        valB = b.better1.toLowerCase();
        break;
      case 'better2':
        valA = a.better2.toLowerCase();
        valB = b.better2.toLowerCase();
        break;
      case 'better1Reward':
        valA = a.better1Reward;
        valB = b.better1Reward;
        break;
      case 'better2Reward':
        valA = a.better2Reward;
        valB = b.better2Reward;
        break;
      case 'status':
        valA = a.status;
        valB = b.status;
        break;
      default:
        return 0;
    }
    if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
    if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  if (filteredBets.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">🎲</div>
        <p>No bets found</p>
      </div>
    `;
  }

  const sortIcon = (key) => {
    if (sort.key !== key) return '<span class="sort-icon">⇅</span>';
    return sort.dir === 'asc'
      ? '<span class="sort-icon sort-icon--active">↑</span>'
      : '<span class="sort-icon sort-icon--active">↓</span>';
  };

  const rows = filteredBets.map(bet => {
    const statusClass = `bet-table__status--${bet.status}`;
    const statusLabel = bet.status.charAt(0).toUpperCase() + bet.status.slice(1);
    const winnerCol = bet.winnerName
      ? `<span class="bet-table__winner">${bet.winnerName}</span>`
      : '<span class="bet-table__tbd">TBD</span>';

    return `
      <tr class="bet-table__row">
        <td class="bet-table__cell bet-table__cell--date">${formatDate(bet.date)}</td>
        <td class="bet-table__cell bet-table__cell--bettor">${bet.better1}</td>
        <td class="bet-table__cell bet-table__cell--bettor">${bet.better2}</td>
        <td class="bet-table__cell bet-table__cell--bet" title="${bet.better1Bet}">${bet.better1Bet}</td>
        <td class="bet-table__cell bet-table__cell--bet" title="${bet.better2Bet}">${bet.better2Bet}</td>
        <td class="bet-table__cell bet-table__cell--amount">${formatCurrency(bet.better1Reward)}</td>
        <td class="bet-table__cell bet-table__cell--amount">${formatCurrency(bet.better2Reward)}</td>
        <td class="bet-table__cell bet-table__cell--winner">${winnerCol}</td>
        <td class="bet-table__cell bet-table__cell--status"><span class="bet-table__status ${statusClass}">${statusLabel}</span></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="bet-table-wrapper">
      <div class="bet-table__count">${filteredBets.length} bet${filteredBets.length !== 1 ? 's' : ''}</div>
      <div class="bet-table-scroll">
        <table class="bet-table">
          <thead>
            <tr>
              <th class="bet-table__th js-sort-col" data-sort="date">Date ${sortIcon('date')}</th>
              <th class="bet-table__th js-sort-col" data-sort="better1">Better 1 ${sortIcon('better1')}</th>
              <th class="bet-table__th js-sort-col" data-sort="better2">Better 2 ${sortIcon('better2')}</th>
              <th class="bet-table__th">Better 1 Bet</th>
              <th class="bet-table__th">Better 2 Bet</th>
              <th class="bet-table__th js-sort-col" data-sort="better1Reward">Reward 1 ${sortIcon('better1Reward')}</th>
              <th class="bet-table__th js-sort-col" data-sort="better2Reward">Reward 2 ${sortIcon('better2Reward')}</th>
              <th class="bet-table__th">Winner</th>
              <th class="bet-table__th js-sort-col" data-sort="status">Status ${sortIcon('status')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
