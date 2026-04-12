import { getState, getPendingBets, getPendingActionCount } from '../../lib/store/store.js';
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
  const { showBetActionModal, bets, currentUser, confirmingPaymentId, resolveIsSubmitting, resolveBetId } = getState();
  if (!showBetActionModal) return '';

  const bet = bets.find(b => b.id == showBetActionModal);
  if (!bet) return '';

  const isAdmin = currentUser && currentUser.isAdmin;
  const isParticipant = currentUser && (currentUser.username === bet.better1 || currentUser.username === bet.better2);
  const canModify = isAdmin || isParticipant;
  if (!canModify || bet.status === 'paid') return '';

  const isLoading = resolveIsSubmitting && resolveBetId == bet.id;

  const isWinner = bet.winnerName === currentUser.username;
  const state = getState();
  let headerIcon = '';
  let headerTitle = '';
  let headerSubtitle = '';
  let content = '';

  // WINNER RESOLUTION — any participant can set winner directly
  if (!bet.winnerLabel) {
    headerIcon = '&#127942;';
    headerTitle = 'Set Winner';
    headerSubtitle = 'Who came out on top?';

    content = `
      <p class="bet-modal__pick-label">Pick the winner</p>
      <div class="bet-modal__matchup">
        <button class="bet-modal__pick js-pick-winner" data-id="${bet.id}" data-winner="better1" data-name="${bet.better1}">
          <span class="bet-modal__pick-avatar" style="background:${getAvatarColor(bet.better1).bg}">${(state.allAvatars && state.allAvatars[bet.better1]) ? `<img src="${state.allAvatars[bet.better1]}" />` : bet.better1.charAt(0)}</span>
          <span class="bet-modal__pick-name">${bet.better1}</span>
          <span class="bet-modal__pick-bet">${bet.better1Bet}</span>
          <span class="bet-modal__pick-stake">${formatCurrency(bet.better1Reward)}</span>
        </button>
        <span class="bet-modal__matchup-vs">VS</span>
        <button class="bet-modal__pick js-pick-winner" data-id="${bet.id}" data-winner="better2" data-name="${bet.better2}">
          <span class="bet-modal__pick-avatar" style="background:${getAvatarColor(bet.better2).bg}">${(state.allAvatars && state.allAvatars[bet.better2]) ? `<img src="${state.allAvatars[bet.better2]}" />` : bet.better2.charAt(0)}</span>
          <span class="bet-modal__pick-name">${bet.better2}</span>
          <span class="bet-modal__pick-bet">${bet.better2Bet}</span>
          <span class="bet-modal__pick-stake">${formatCurrency(bet.better2Reward)}</span>
        </button>
      </div>
      <div class="bet-modal__confirm-bar" id="winnerConfirmBar" style="display:none;">
        <span class="bet-modal__confirm-text">Confirm <strong id="winnerConfirmName"></strong> won?</span>
        <button class="btn btn--primary confirm-resolve-btn" id="confirmResolveBtn">&#9989; Confirm</button>
      </div>
    `;
  }

  // PAYMENT RESOLUTION
  else if (bet.status !== 'paid') {
    const winnerName = bet.winnerName || 'Winner';
    const loserName = bet.winnerName === bet.better1 ? bet.better2 : bet.better1;
    const oweAmount = formatCurrency(bet.winnerName === bet.better1 ? bet.better1Reward : bet.better2Reward);
    const rawAmount = bet.winnerName === bet.better1 ? bet.better1Reward : bet.better2Reward;

    if (bet.proposerPaid && bet.proposerPaid !== currentUser.username && isWinner) {
      headerIcon = '&#128176;';
      headerTitle = 'Confirm Payment';
      headerSubtitle = `${bet.proposerPaid} says they paid up`;
      content = `
        <div class="bet-modal__payment-card">
          <div class="bet-modal__payment-amount">${oweAmount}</div>
          <p class="bet-modal__payment-detail"><strong>${bet.proposerPaid}</strong> claims they sent you this amount.</p>
          <p class="bet-modal__payment-question">Did you receive it?</p>
        </div>
        <div class="bet-modal__actions">
          <button class="btn btn--primary resolve-payment-btn" data-id="${bet.id}">&#9989; Yes, Received</button>
        </div>
      `;
    } else if (bet.proposerPaid === currentUser.username) {
      headerIcon = '&#9203;';
      headerTitle = 'Waiting';
      headerSubtitle = 'Payment pending confirmation';
      content = `
        <div class="bet-modal__waiting-state">
          <div class="bet-modal__waiting-icon">&#9203;</div>
          <p class="bet-modal__info">You marked this as paid. Waiting for <strong>${winnerName}</strong> to confirm receipt.</p>
        </div>
      `;
    } else if (isWinner) {
      headerIcon = '&#127881;';
      headerTitle = 'You Won!';
      headerSubtitle = `${loserName} owes you`;
      content = `
        <div class="bet-modal__payment-card">
          <div class="bet-modal__payment-amount bet-modal__payment-amount--won">${oweAmount}</div>
          <p class="bet-modal__payment-detail"><strong>${loserName}</strong> owes you this amount.</p>
        </div>
        <div class="bet-modal__actions">
          <button class="btn btn--primary resolve-payment-btn" data-id="${bet.id}">&#9989; Mark as Paid</button>
        </div>
      `;
    } else {
      headerIcon = '&#128184;';
      headerTitle = 'Settle Up';
      headerSubtitle = `You owe ${winnerName}`;
      const paypal = state.allPaypals && state.allPaypals[winnerName] ? state.allPaypals[winnerName] : '';
      const payUrl = paypal ? `https://paypal.me/${paypal}/${rawAmount}` : '';
      content = `
        <div class="bet-modal__payment-card">
          <div class="bet-modal__payment-amount bet-modal__payment-amount--owe">${oweAmount}</div>
          <p class="bet-modal__payment-detail">You owe <strong>${winnerName}</strong> this amount.</p>
          ${payUrl ? `<a class="bet-modal__paypal-link" href="${payUrl}" target="_blank" rel="noopener">&#128179; Pay via PayPal</a>` : ''}
        </div>
        <div class="bet-modal__actions">
          <button class="btn btn--primary resolve-payment-btn" data-id="${bet.id}">&#9989; Mark as Paid</button>
        </div>
      `;
    }
  }

  return `
    <div class="modal-overlay js-close-bet-modal">
      <div class="modal new-bet-modal bet-modal">
        <div class="new-bet-modal__header">
          <button class="new-bet-modal__close js-close-bet-modal-btn">&times;</button>
          <span class="new-bet-modal__icon">${headerIcon}</span>
          <h2 class="new-bet-modal__title">${headerTitle}</h2>
          <p class="new-bet-modal__subtitle">${headerSubtitle}</p>
        </div>
        <div class="bet-modal__body">
          ${isLoading ? `
            <div class="bet-modal__loading">
              <div class="loading__spinner loading__spinner--sm"></div>
              <span>Updating...</span>
            </div>
          ` : content}
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
            <span class="bet-table__stacked-primary${bet.winnerName === bet.better1 ? ' bet-table__winner-text' : ''}" title="${bet.better1Bet}">${bet.better1Bet}</span>
            <span class="bet-table__stacked-secondary${bet.winnerName === bet.better2 ? ' bet-table__winner-text' : ''}" title="${bet.better2Bet}">${bet.better2Bet}</span>
          </div>
        </td>
        <td class="bet-table__cell bet-table__cell--stakes">
          <div class="bet-table__stacked">
            <span class="bet-table__stacked-primary${bet.winnerName === bet.better1 ? ' bet-table__winner-text' : ''}">${formatCurrency(bet.better1Reward)}</span>
            <span class="bet-table__stacked-secondary${bet.winnerName === bet.better2 ? ' bet-table__winner-text' : ''}">${formatCurrency(bet.better2Reward)}</span>
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
            ${renderUserTag(bet.better1, getState())}
            <span class="bet-mcard__bet${bet.winnerName === bet.better1 ? ' bet-table__winner-text' : ''}">${bet.better1Bet}</span>
            <span class="bet-mcard__stake${bet.winnerName === bet.better1 ? ' bet-table__winner-text' : ''}">${formatCurrency(bet.better1Reward)}</span>
          </div>
          <span class="bet-mcard__vs">vs</span>
          <div class="bet-mcard__side">
            ${renderUserTag(bet.better2, getState())}
            <span class="bet-mcard__bet${bet.winnerName === bet.better2 ? ' bet-table__winner-text' : ''}">${bet.better2Bet}</span>
            <span class="bet-mcard__stake${bet.winnerName === bet.better2 ? ' bet-table__winner-text' : ''}">${formatCurrency(bet.better2Reward)}</span>
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
    let totalWon = 0, totalLost = 0, wins = 0, losses = 0, pendingAmount = 0;
    filteredBets.forEach(bet => {
      if (!bet.winnerName) {
        // Active bet with no winner yet — count the stake as pending
        const stake = resultBettor === bet.better1 ? bet.better1Reward : bet.better2Reward;
        pendingAmount += stake;
        return;
      }
      const isWin = bet.winnerName === resultBettor;
      const amount = resultBettor === bet.better1 ? bet.better1Reward : bet.better2Reward;
      if (isWin) { totalWon += amount; wins++; }
      else { totalLost += amount; losses++; }
    });
    const net = totalWon - totalLost;
    const netSign = net >= 0 ? '+' : '';
    const netClass = net >= 0 ? 'bet-table__summary--positive' : 'bet-table__summary--negative';
    const pendingHtml = pendingAmount > 0 ? `<span class="bet-table__summary-sep">|</span><span class="bet-table__summary--pending">${formatCurrency(pendingAmount)} pending</span>` : '';
    summaryHtml = `
      <div class="bet-table__summary">
        <span class="bet-table__summary--positive">+${formatCurrency(totalWon)}</span>
        <span class="bet-table__summary-label">(${wins}W)</span>
        <span class="bet-table__summary-sep">-</span>
        <span class="bet-table__summary--negative">${formatCurrency(totalLost)}</span>
        <span class="bet-table__summary-label">(${losses}L)</span>
        <span class="bet-table__summary-sep">=</span>
        <span class="${netClass} bet-table__summary-net">${netSign}${formatCurrency(net)}</span>
        ${pendingHtml}
      </div>
    `;
  }

  const pendingCount = getPendingActionCount();
  const colCount = showResultCol ? 8 : 7;
  const actionRowHtml = pendingCount > 0 ? `
    <tr class="action-bar-row">
      <td colspan="${colCount}">
        <div class="action-bar">
          <span class="action-bar__icon">&#9888;&#65039;</span>
          <span class="action-bar__text">You have <strong>${pendingCount}</strong> pending action${pendingCount > 1 ? 's' : ''} requiring your attention</span>
        </div>
      </td>
    </tr>
  ` : '';
  const actionCardHtml = pendingCount > 0 ? `
    <div class="action-bar">
      <span class="action-bar__icon">&#9888;&#65039;</span>
      <span class="action-bar__text">You have <strong>${pendingCount}</strong> pending action${pendingCount > 1 ? 's' : ''} requiring your attention</span>
    </div>
  ` : '';

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
            ${actionRowHtml}
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="bet-mcards mobile-only">
        ${actionCardHtml}
        ${cards}
      </div>
    </div>
  `;
}
