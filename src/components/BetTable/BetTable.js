import { getState, getPendingBets } from '../../lib/store/store.js';
import { formatCurrency, formatDate, getOtherBetter, getAvatarColor, renderUserTag } from '../../lib/utils/utils.js';

function getAction(bet) {
  const { currentUser } = getState();
  const isAdmin = currentUser && currentUser.isAdmin;
  const isParticipant = currentUser && (currentUser.username === bet.better1 || currentUser.username === bet.better2);
  const canModify = isAdmin || isParticipant;

  if (!canModify || bet.status === 'paid') return null;

  const other = currentUser.username === bet.better1 ? bet.better2 : bet.better1;
  const isWinner = bet.winnerName === currentUser.username;

  // No winner yet — anyone can set winner
  if (!bet.winnerLabel) {
    return { label: '🏆 Set Winner', type: 'default' };
  }

  // Winner set, not paid yet
  if (bet.status !== 'paid') {
    // Loser claimed they paid — winner needs to confirm receipt
    if (bet.proposerPaid && bet.proposerPaid !== currentUser.username && isWinner) {
      return { label: '✓ Confirm Paid', type: 'urgent' };
    }
    // Loser claimed they paid — loser is waiting
    if (bet.proposerPaid === currentUser.username && !isAdmin) {
      return { label: '⏳ Waiting', type: 'waiting', tooltip: `Waiting for ${other} to confirm receipt` };
    }
    // Winner can mark as received at any time
    if (isWinner) {
      return { label: '✓ Mark Paid', type: 'success' };
    }
    // Loser needs to pay
    return { label: '⚠ Pay', type: 'urgent' };
  }

  return null;
}

export function renderBetActionModal() {
  const { showBetActionModal, bets, currentUser, confirmingResolution, confirmingPaymentId, resolveIsSubmitting, resolveBetId } = getState();
  if (!showBetActionModal) return '';

  const bet = bets.find(b => b.id == showBetActionModal);
  if (!bet) return '';

  const isAdmin = currentUser && currentUser.isAdmin;
  const isParticipant = currentUser && (currentUser.username === bet.better1 || currentUser.username === bet.better2);
  const canModify = isAdmin || isParticipant;
  if (!canModify || bet.status === 'paid') return '';

  const isLoading = resolveIsSubmitting && resolveBetId == bet.id;

  const isWinner = bet.winnerName === currentUser.username;
  let content = '';

  // WINNER RESOLUTION — any participant can set winner directly
  if (!bet.winnerLabel) {
    if (confirmingResolution && confirmingResolution.id == bet.id) {
      content = `
        <p class="bet-modal__info">Set <strong>${bet[confirmingResolution.winner]}</strong> as the winner?</p>
        <div class="bet-modal__actions">
          <button class="btn btn--primary confirm-resolve-btn">Confirm</button>
          <button class="btn btn--outline cancel-resolve-btn">Cancel</button>
        </div>
      `;
    } else {
      content = `
        <p class="bet-modal__info">Who won this bet?</p>
        <div class="bet-modal__actions">
          <button class="btn btn--primary resolve-winner-btn" data-id="${bet.id}" data-winner="better1">${bet.better1} Won</button>
          <button class="btn btn--primary resolve-winner-btn" data-id="${bet.id}" data-winner="better2">${bet.better2} Won</button>
        </div>
      `;
    }
  }

  // PAYMENT RESOLUTION
  else if (bet.status !== 'paid') {
    const winnerName = bet.winnerName || 'Winner';
    const loserName = bet.winnerName === bet.better1 ? bet.better2 : bet.better1;
    const oweAmount = formatCurrency(bet.winnerName === bet.better1 ? bet.better1Reward : bet.better2Reward);

    if (bet.proposerPaid && bet.proposerPaid !== currentUser.username && isWinner) {
      // Loser claimed paid — winner confirms receipt
      content = `
        <p class="bet-modal__info"><strong>${bet.proposerPaid}</strong> says they paid ${oweAmount}. Confirm you received it?</p>
        <div class="bet-modal__actions">
          <button class="btn btn--primary resolve-payment-btn" data-id="${bet.id}">Confirm Paid</button>
        </div>
      `;
    } else if (bet.proposerPaid === currentUser.username) {
      content = `<p class="bet-modal__info">You marked this as paid. Waiting for <strong>${winnerName}</strong> to confirm receipt.</p>`;
    } else if (isWinner) {
      // Winner can confirm receipt directly
      content = `
        <p class="bet-modal__info"><strong>${loserName}</strong> owes you ${oweAmount}.</p>
        <div class="bet-modal__actions">
          <button class="btn btn--primary resolve-payment-btn" data-id="${bet.id}">Mark as Paid</button>
        </div>
      `;
    } else {
      // Loser marks as paid
      content = `
        <p class="bet-modal__info">You owe <strong>${winnerName}</strong> ${oweAmount}.</p>
        <div class="bet-modal__actions">
          <button class="btn btn--primary resolve-payment-btn" data-id="${bet.id}">Mark as Paid</button>
        </div>
      `;
    }
  }

  return `
    <div class="modal-overlay js-close-bet-modal">
      <div class="modal bet-modal">
        <div class="modal__header">
          <h2 class="modal__title">${bet.better1} vs ${bet.better2}</h2>
          <button class="modal__close js-close-bet-modal-btn">&times;</button>
        </div>
        <div class="bet-modal__body">
          <div class="bet-modal__summary">
            <div class="bet-modal__detail"><span>Date:</span> ${formatDate(bet.date)}</div>
            <div class="bet-modal__detail"><span>${bet.better1}:</span> ${bet.better1Bet} (${formatCurrency(bet.better1Reward)})</div>
            <div class="bet-modal__detail"><span>${bet.better2}:</span> ${bet.better2Bet} (${formatCurrency(bet.better2Reward)})</div>
            ${bet.winnerName ? `<div class="bet-modal__detail"><span>Winner:</span> <strong>${bet.winnerName}</strong></div>` : ''}
          </div>
          ${isLoading ? '<div class="bet-modal__loading"><div class="loading__spinner loading__spinner--sm"></div> Updating...</div>' : content}
        </div>
      </div>
    </div>
  `;
}

function escapeCSV(val) {
  const s = String(val || '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function generateCSV(bets) {
  const headers = ['Date', 'Better 1', 'Better 2', 'Bet 1', 'Bet 2', 'Stake 1', 'Stake 2', 'Winner', 'Status'];
  const rows = bets.map(b => [
    formatDate(b.date),
    b.better1,
    b.better2,
    b.better1Bet,
    b.better2Bet,
    b.better1Reward,
    b.better2Reward,
    b.winnerName || '',
    b.status
  ].map(escapeCSV).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function renderBetTable(betsOverride = null) {
  const { bets, statusFilter, bettorFilter } = getState();
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

  // Sort: action-required first, then by date descending
  const pendingBetIds = new Set(getPendingBets().map(b => b.id));
  filteredBets.sort((a, b) => {
    const aAction = pendingBetIds.has(a.id) ? 1 : 0;
    const bAction = pendingBetIds.has(b.id) ? 1 : 0;
    if (aAction !== bAction) return bAction - aAction;
    const aTime = a.date ? a.date.getTime() : 0;
    const bTime = b.date ? b.date.getTime() : 0;
    return bTime - aTime;
  });

  if (filteredBets.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">🎲</div>
        <p>No bets found</p>
      </div>
    `;
  }

  const { currentUser } = getState();
  const showResultCol = bettorFilter && bettorFilter !== 'all';
  const resultBettor = showResultCol ? bettorFilter : null;

  const rows = filteredBets.map(bet => {
    const statusClass = `bet-table__status--${bet.status}`;
    const statusLabel = bet.status.charAt(0).toUpperCase() + bet.status.slice(1);
    const winnerCol = bet.winnerName
      ? renderUserTag(bet.winnerName, getState())
      : '<span class="bet-table__tbd">—</span>';
    const action = getAction(bet);
    const { resolveIsSubmitting, resolveBetId } = getState();
    const isRowLoading = resolveIsSubmitting && resolveBetId == bet.id;
    const isParticipant = currentUser && (bet.better1 === currentUser.username || bet.better2 === currentUser.username);
    const isMyWin = currentUser && bet.winnerName === currentUser.username;
    const isMyLoss = currentUser && bet.winnerName && bet.winnerName !== currentUser.username && isParticipant;
    const needsAction = pendingBetIds.has(bet.id);
    const rowClass = needsAction ? 'bet-table__row--action' : (isMyWin ? 'bet-table__row--won' : (isMyLoss ? 'bet-table__row--lost' : (isParticipant ? 'bet-table__row--mine' : '')));

    const actionTypeClass = action && action.type === 'urgent' ? 'bet-table__action--urgent' : (action && action.type === 'success' ? 'bet-table__action--success' : '');
    const actionCell = isRowLoading ? '<span class="bet-table__row-loading"><span class="bet-table__row-spinner"></span></span>' : (action ? (action.type === 'waiting' ? `<span class="bet-table__waiting" data-tooltip="${action.tooltip}">${action.label}</span>` : `<button class="btn btn--xs btn--outline js-open-bet-action ${actionTypeClass}" data-bet-id="${bet.id}">${action.label}</button>`) : '');

    return { table: `
      <tr class="bet-table__row ${rowClass}" data-needs-action="${needsAction ? '1' : '0'}">
        <td class="bet-table__cell bet-table__cell--date">${formatDate(bet.date)}</td>
        <td class="bet-table__cell bet-table__cell--players">
          <div class="bet-table__stacked">
            ${renderUserTag(bet.better1, getState())}
            ${renderUserTag(bet.better2, getState())}
          </div>
        </td>
        <td class="bet-table__cell bet-table__cell--bets">
          <div class="bet-table__stacked">
            <span class="bet-table__stacked-primary" title="${bet.better1Bet}">${bet.better1Bet}</span>
            <span class="bet-table__stacked-secondary" title="${bet.better2Bet}">${bet.better2Bet}</span>
          </div>
        </td>
        <td class="bet-table__cell bet-table__cell--stakes">
          <div class="bet-table__stacked">
            <span class="bet-table__stacked-primary">${formatCurrency(bet.better1Reward)}</span>
            <span class="bet-table__stacked-secondary">${formatCurrency(bet.better2Reward)}</span>
          </div>
        </td>
        <td class="bet-table__cell bet-table__cell--winner">${winnerCol}</td>
        ${showResultCol ? (() => {
          if (!bet.winnerName) return '<td class="bet-table__cell bet-table__cell--result">—</td>';
          const won = bet.winnerName === resultBettor;
          const amount = won
            ? (resultBettor === bet.better1 ? bet.better1Reward : bet.better2Reward)
            : (resultBettor === bet.better1 ? bet.better1Reward : bet.better2Reward);
          return `<td class="bet-table__cell bet-table__cell--result"><span class="${won ? 'bet-table__result--won' : 'bet-table__result--lost'}">${won ? '+' : '-'}${formatCurrency(amount)}</span></td>`;
        })() : ''}
        <td class="bet-table__cell bet-table__cell--status"><span class="bet-table__status ${statusClass}">${statusLabel}</span></td>
        <td class="bet-table__cell bet-table__cell--actions">${actionCell}</td>
      </tr>
    `, card: `
      <div class="bet-mcard ${rowClass}" data-needs-action="${needsAction ? '1' : '0'}">
        <div class="bet-mcard__header">
          <span class="bet-mcard__date">${formatDate(bet.date)}</span>
          <span class="bet-table__status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="bet-mcard__players">
          <div class="bet-mcard__side">
            <span class="bet-table__tag" style="background:${getAvatarColor(bet.better1).bg};color:${getAvatarColor(bet.better1).text}">${bet.better1}</span>
            <span class="bet-mcard__bet">${bet.better1Bet}</span>
            <span class="bet-mcard__stake">${formatCurrency(bet.better1Reward)}</span>
          </div>
          <span class="bet-mcard__vs">vs</span>
          <div class="bet-mcard__side">
            <span class="bet-table__tag" style="background:${getAvatarColor(bet.better2).bg};color:${getAvatarColor(bet.better2).text}">${bet.better2}</span>
            <span class="bet-mcard__bet">${bet.better2Bet}</span>
            <span class="bet-mcard__stake">${formatCurrency(bet.better2Reward)}</span>
          </div>
        </div>
        ${bet.winnerName ? `<div class="bet-mcard__winner">Winner: <strong>${bet.winnerName}</strong></div>` : ''}
        ${actionCell ? `<div class="bet-mcard__action">${actionCell}</div>` : ''}
      </div>
    `};
  });

  const tableRows = rows.map(r => r.table).join('');
  const cards = rows.map(r => r.card).join('');

  // Calculate summary for filtered bettor
  let summaryHtml = '';
  if (showResultCol && resultBettor) {
    let totalWon = 0, totalLost = 0, wins = 0, losses = 0;
    filteredBets.forEach(bet => {
      if (!bet.winnerName) return;
      const isWin = bet.winnerName === resultBettor;
      const amount = resultBettor === bet.better1 ? bet.better1Reward : bet.better2Reward;
      if (isWin) { totalWon += amount; wins++; }
      else { totalLost += amount; losses++; }
    });
    const net = totalWon - totalLost;
    const netSign = net >= 0 ? '+' : '';
    const netClass = net >= 0 ? 'bet-table__summary--positive' : 'bet-table__summary--negative';
    summaryHtml = `
      <div class="bet-table__summary">
        <span class="bet-table__summary--positive">+${formatCurrency(totalWon)}</span>
        <span class="bet-table__summary-label">(${wins}W)</span>
        <span class="bet-table__summary-sep">-</span>
        <span class="bet-table__summary--negative">${formatCurrency(totalLost)}</span>
        <span class="bet-table__summary-label">(${losses}L)</span>
        <span class="bet-table__summary-sep">=</span>
        <span class="${netClass} bet-table__summary-net">${netSign}${formatCurrency(net)}</span>
      </div>
    `;
  }

  return `
    <div class="bet-table-wrapper">
      <div class="bet-table__toolbar">
        <span class="bet-table__count">${filteredBets.length} bet${filteredBets.length !== 1 ? 's' : ''}</span>
        ${summaryHtml}
      </div>
      <div class="bet-table-scroll desktop-only">
        <table class="bet-table">
          <thead>
            <tr>
              <th class="bet-table__th">Date</th>
              <th class="bet-table__th">Players</th>
              <th class="bet-table__th">Bets</th>
              <th class="bet-table__th">Stakes</th>
              <th class="bet-table__th">Winner</th>
              ${showResultCol ? '<th class="bet-table__th">Result</th>' : ''}
              <th class="bet-table__th">Status</th>
              <th class="bet-table__th">Action</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="bet-mcards mobile-only">
        ${cards}
      </div>
    </div>
  `;
}
