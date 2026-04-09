import { getState, getPendingBets } from '../../lib/store/store.js';
import { formatCurrency, formatDate, getOtherBetter, getAvatarColor } from '../../lib/utils/utils.js';

function getAction(bet) {
  const { currentUser } = getState();
  const isAdmin = currentUser && currentUser.isAdmin;
  const isParticipant = currentUser && (currentUser.username === bet.better1 || currentUser.username === bet.better2);
  const canModify = isAdmin || isParticipant;

  if (!canModify || bet.status === 'paid') return null;

  const other = currentUser.username === bet.better1 ? bet.better2 : bet.better1;

  // Confirming: if I'm the creator (better1), I'm waiting for opponent
  if (bet.status === 'confirming') {
    if (currentUser.username === bet.better1 && !isAdmin) {
      return { label: '⏳ Waiting', type: 'waiting', tooltip: `Waiting for ${other} to accept the bet` };
    }
    return { label: '✓ Verify', type: 'default' };
  }

  // Winner resolution
  if (!bet.winnerLabel) {
    if (bet.proposerWinner === currentUser.username && !isAdmin) {
      return { label: '⏳ Waiting', type: 'waiting', tooltip: `Waiting for ${other} to verify the winner` };
    }
    if (bet.proposerWinner && bet.proposerWinner !== currentUser.username) {
      return { label: '✓ Verify Winner', type: 'urgent' };
    }
    return { label: '🏆 Set Winner', type: 'default' };
  }

  // Payment resolution
  if (bet.status !== 'paid') {
    if (bet.proposerPaid === currentUser.username && !isAdmin) {
      return { label: '⏳ Waiting', type: 'waiting', tooltip: `Waiting for ${other} to confirm payment` };
    }
    if (bet.proposerPaid && bet.proposerPaid !== currentUser.username) {
      return { label: '✓ Verify Payment', type: 'urgent' };
    }
    return { label: '⚠ Payment', type: 'urgent' };
  }

  return null;
}

export function renderBetActionModal() {
  const { showBetActionModal, bets, currentUser, confirmingResolution, confirmingPaymentId, confirmingBetId, resolveIsSubmitting, resolveBetId } = getState();
  if (!showBetActionModal) return '';

  const bet = bets.find(b => b.id == showBetActionModal);
  if (!bet) return '';

  const isAdmin = currentUser && currentUser.isAdmin;
  const isParticipant = currentUser && (currentUser.username === bet.better1 || currentUser.username === bet.better2);
  const canModify = isAdmin || isParticipant;
  if (!canModify || bet.status === 'paid') return '';

  const isLoading = resolveIsSubmitting && resolveBetId == bet.id;

  let content = '';

  // BET CONFIRMATION
  if (bet.status === 'confirming') {
    const isOpponent = currentUser.username === bet.better2 || currentUser.isAdmin;
    if (!isOpponent) {
      content = `
        <p class="bet-modal__info">Waiting for <strong>${bet.better2}</strong> to confirm this bet.</p>
      `;
    } else if (confirmingBetId == bet.id) {
      content = `
        <p class="bet-modal__info">Accept this bet between <strong>${bet.better1}</strong> and <strong>${bet.better2}</strong>?</p>
        <div class="bet-modal__actions">
          <button class="btn btn--primary js-confirm-bet-action" data-id="${bet.id}" data-action="confirm">Accept Bet</button>
          <button class="btn btn--outline js-confirm-bet-action" data-id="${bet.id}" data-action="decline" style="color:#ff4757;border-color:#ff4757;">Decline Bet</button>
        </div>
      `;
    } else {
      content = `
        <p class="bet-modal__info"><strong>${bet.better1}</strong> proposed a bet with <strong>${bet.better2}</strong>.</p>
        <div class="bet-modal__details">
          <div class="bet-modal__detail"><span>Bet 1:</span> ${bet.better1Bet}</div>
          <div class="bet-modal__detail"><span>Bet 2:</span> ${bet.better2Bet}</div>
          <div class="bet-modal__detail"><span>Stake:</span> ${formatCurrency(bet.better1Reward)} / ${formatCurrency(bet.better2Reward)}</div>
        </div>
        <div class="bet-modal__actions">
          <button class="btn btn--primary js-start-confirm-bet" data-id="${bet.id}">Review & Accept</button>
        </div>
      `;
    }
  }

  // WINNER RESOLUTION
  else if (!bet.winnerLabel) {
    if (bet.proposerWinner) {
      const proposedWinnerName = bet.proposedWinnerValue === 'better1' ? bet.better1 : bet.better2;
      if (bet.proposerWinner === currentUser.username) {
        content = `<p class="bet-modal__info">You proposed <strong>${proposedWinnerName}</strong> as the winner. Waiting for the other party to verify.</p>`;
      } else if (confirmingResolution && confirmingResolution.id == bet.id) {
        content = `
          <p class="bet-modal__info"><strong>${bet.proposerWinner}</strong> says <strong>${proposedWinnerName}</strong> won. Confirm?</p>
          <div class="bet-modal__actions">
            <button class="btn btn--primary confirm-resolve-btn">Confirm Winner</button>
            <button class="btn btn--outline cancel-resolve-btn">Cancel</button>
          </div>
        `;
      } else {
        content = `
          <p class="bet-modal__info"><strong>${bet.proposerWinner}</strong> says <strong>${proposedWinnerName}</strong> won.</p>
          <div class="bet-modal__actions">
            <button class="btn btn--primary resolve-winner-btn" data-id="${bet.id}" data-winner="${bet.proposedWinnerValue}">Verify Winner</button>
          </div>
        `;
      }
    } else if (confirmingResolution && confirmingResolution.id == bet.id) {
      content = `
        <p class="bet-modal__info">Confirm <strong>${bet[confirmingResolution.winner]}</strong> won this bet?</p>
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
    if (bet.proposerPaid) {
      if (bet.proposerPaid === currentUser.username) {
        content = `<p class="bet-modal__info">You marked this as paid. Waiting for <strong>${getOtherBetter(bet, currentUser).name}</strong> to verify.</p>`;
      } else if (confirmingPaymentId == bet.id) {
        content = `
          <p class="bet-modal__info"><strong>${bet.proposerPaid}</strong> says they paid. Confirm receipt?</p>
          <div class="bet-modal__actions">
            <button class="btn btn--primary confirm-payment-btn">Confirm Paid</button>
            <button class="btn btn--outline cancel-payment-btn">Cancel</button>
          </div>
        `;
      } else {
        content = `
          <p class="bet-modal__info"><strong>${bet.proposerPaid}</strong> marked this as paid.</p>
          <div class="bet-modal__actions">
            <button class="btn btn--primary resolve-payment-btn" data-id="${bet.id}">Verify Payment</button>
          </div>
        `;
      }
    } else if (confirmingPaymentId == bet.id) {
      content = `
        <p class="bet-modal__info">Mark this bet as paid?</p>
        <div class="bet-modal__actions">
          <button class="btn btn--primary confirm-payment-btn">Confirm Paid</button>
          <button class="btn btn--outline cancel-payment-btn">Cancel</button>
        </div>
      `;
    } else {
      content = `
        <p class="bet-modal__info"><strong>${winnerName}</strong> won. <strong>${loserName}</strong> owes ${formatCurrency(bet.winnerName === bet.better1 ? bet.better1Reward : bet.better2Reward)}.</p>
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
  const rows = filteredBets.map(bet => {
    const statusClass = `bet-table__status--${bet.status}`;
    const statusLabel = bet.status.charAt(0).toUpperCase() + bet.status.slice(1);
    const winnerCol = bet.winnerName
      ? `<span class="bet-table__tag" style="background:${getAvatarColor(bet.winnerName).bg};color:${getAvatarColor(bet.winnerName).text}">${bet.winnerName}</span>`
      : '<span class="bet-table__tbd">—</span>';
    const action = getAction(bet);
    const { resolveIsSubmitting, resolveBetId } = getState();
    const isRowLoading = resolveIsSubmitting && resolveBetId == bet.id;
    const isParticipant = currentUser && (bet.better1 === currentUser.username || bet.better2 === currentUser.username);
    const isMyWin = currentUser && bet.winnerName === currentUser.username;
    const isMyLoss = currentUser && bet.winnerName && bet.winnerName !== currentUser.username && isParticipant;
    const needsAction = pendingBetIds.has(bet.id);
    const rowClass = needsAction ? 'bet-table__row--action' : (isMyWin ? 'bet-table__row--won' : (isMyLoss ? 'bet-table__row--lost' : (isParticipant ? 'bet-table__row--mine' : '')));

    const actionCell = isRowLoading ? '<span class="bet-table__row-loading"><span class="bet-table__row-spinner"></span></span>' : (action ? (action.type === 'waiting' ? `<span class="bet-table__waiting" data-tooltip="${action.tooltip}">${action.label}</span>` : `<button class="btn btn--xs btn--outline js-open-bet-action ${action.type === 'urgent' ? 'bet-table__action--urgent' : ''}" data-bet-id="${bet.id}">${action.label}</button>`) : '');

    return { table: `
      <tr class="bet-table__row ${rowClass}" data-needs-action="${needsAction ? '1' : '0'}">
        <td class="bet-table__cell bet-table__cell--date">${formatDate(bet.date)}</td>
        <td class="bet-table__cell bet-table__cell--players">
          <div class="bet-table__stacked">
            <span class="bet-table__tag" style="background:${getAvatarColor(bet.better1).bg};color:${getAvatarColor(bet.better1).text}">${bet.better1}</span>
            <span class="bet-table__tag" style="background:${getAvatarColor(bet.better2).bg};color:${getAvatarColor(bet.better2).text}">${bet.better2}</span>
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

  return `
    <div class="bet-table-wrapper">
      <div class="bet-table__count">${filteredBets.length} bet${filteredBets.length !== 1 ? 's' : ''}</div>
      <div class="bet-table-scroll desktop-only">
        <table class="bet-table">
          <thead>
            <tr>
              <th class="bet-table__th">Date</th>
              <th class="bet-table__th">Players</th>
              <th class="bet-table__th">Bets</th>
              <th class="bet-table__th">Stakes</th>
              <th class="bet-table__th">Winner</th>
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
