import { formatCurrency, getOtherBetter, formatDate } from '../lib/utils.js';
import { getState } from '../lib/store.js';

function renderBetActions(bet, canModify) {
  const {
    currentUser,
    resolveIsSubmitting,
    resolveBetId,
    confirmingResolution,
    confirmingPaymentId,
    confirmingBetId
  } = getState();

  if (!canModify || bet.status === 'paid') return '';

  if (resolveIsSubmitting && resolveBetId == bet.id) {
    return `
      <div class="bet-actions-row">
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <div class="loading__spinner loading__spinner--sm"></div>
          <span class="action-label">Updating...</span>
        </div>
      </div>
    `;
  }

  // BET CONFIRMATION
  if (bet.status === 'confirming') {
    const isOpponent = currentUser.username === bet.better2 || currentUser.isAdmin;
    if (!isOpponent) {
      return `
        <div class="bet-actions-row">
          <div class="verification-status">
            <span class="verification-status__icon">⏳</span>
            <span>Waiting for <strong>${bet.better2}</strong> to confirm</span>
          </div>
        </div>
      `;
    } else {
      if (confirmingBetId == bet.id) {
        return `
          <div class="bet-actions-row">
            <span class="action-label">Accept this bet?</span>
            <div class="btn-group">
              <button class="btn btn--xs btn--primary js-confirm-bet-action" data-id="${bet.id}" data-action="confirm">Accept</button>
              <button class="btn btn--xs btn--outline js-confirm-bet-action" data-id="${bet.id}" data-action="decline" style="color: #ff4757; border-color: #ff4757;">Decline</button>
              <button class="btn btn--xs btn--outline js-cancel-confirm-bet">Cancel</button>
            </div>
          </div>
        `;
      }
      return `
        <div class="bet-actions-row">
          <span class="action-label">New Proposal</span>
          <button class="btn btn--xs btn--primary js-start-confirm-bet" data-id="${bet.id}">Verify Bet</button>
        </div>
      `;
    }
  }

  const isWaitingForWinner = !bet.winnerLabel;
  // If winner determined but not paid, we are waiting for payment
  const isWaitingForPayment = !!bet.winnerLabel && bet.status !== 'paid';

  // WINNER RESOLUTION
  if (isWaitingForWinner) {
    if (bet.proposerWinner) {
      if (bet.proposerWinner === currentUser.username) {
        return `<div class="bet-actions-row"><div class="verification-status"><span class="verification-status__icon">⏳</span><span>Waiting for <strong>${getOtherBetter(bet, currentUser).name}</strong> to verify winner</span></div></div>`;
      } else {
        // Show Confirm UI
        // Determine name of proposed winner
        const proposedWinnerValue = bet.proposedWinnerValue;
        const proposedWinnerName = proposedWinnerValue === 'better1' ? bet.better1 : bet.better2;

        if (confirmingResolution && confirmingResolution.id == bet.id) {
          return `
                <div class="bet-actions-row">
                  <span class="action-label">Confirm <b>${proposedWinnerName}</b> won?</span>
                  <div class="btn-group">
                    <button class="btn btn--xs btn--primary confirm-resolve-btn">Yes</button>
                    <button class="btn btn--xs btn--outline cancel-resolve-btn">Cancel</button>
                  </div>
                </div>
              `;
        }

        return `
              <div class="bet-actions-row">
                 <span class="action-label"><b>${bet.proposerWinner}</b> says <b>${proposedWinnerName}</b> won.</span>
                 <button class="btn btn--xs btn--primary resolve-winner-btn" data-id="${bet.id}" data-winner="${proposedWinnerValue}">Verify Winner</button>
              </div>
           `;
      }
    } else {
      // No proposal yet - Show generic Propose Winner buttons
      if (confirmingResolution && confirmingResolution.id == bet.id) {
        return `
              <div class="bet-actions-row">
                <span class="action-label">Confirm <b>${bet[confirmingResolution.winner]}</b> won?</span>
                <div class="btn-group">
                  <button class="btn btn--xs btn--primary confirm-resolve-btn">Yes</button>
                  <button class="btn btn--xs btn--outline cancel-resolve-btn">Cancel</button>
                </div>
              </div>
            `;
      }
      return `
            <div class="bet-actions-row">
              <span class="action-label">Who won?</span>
              <div class="btn-group">
                <button class="btn btn--xs btn--outline resolve-winner-btn" data-id="${bet.id}" data-winner="better1">${bet.better1}</button>
                <button class="btn btn--xs btn--outline resolve-winner-btn" data-id="${bet.id}" data-winner="better2">${bet.better2}</button>
              </div>
            </div>
        `;
    }
  }

  // PAYMENT RESOLUTION
  else if (isWaitingForPayment) {
    if (bet.proposerPaid) {
      if (bet.proposerPaid === currentUser.username) {
        return `<div class="bet-actions-row"><div class="verification-status"><span class="verification-status__icon">💸</span><span>Waiting for <strong>${getOtherBetter(bet, currentUser).name}</strong> to verify payment</span></div></div>`;
      } else {
        if (confirmingPaymentId == bet.id) {
          return `
                  <div class="bet-actions-row">
                    <span class="action-label">Confirm payment received?</span>
                    <div class="btn-group">
                      <button class="btn btn--xs btn--success confirm-payment-btn">Yes</button>
                      <button class="btn btn--xs btn--outline cancel-payment-btn">Cancel</button>
                    </div>
                  </div>
                `;
        }
        return `
              <div class="bet-actions-row">
                 <span class="action-label"><b>${bet.proposerPaid}</b> marked paid.</span>
                 <button class="btn btn--xs btn--success resolve-payment-btn" data-id="${bet.id}">Verify Payment</button>
              </div>
           `;
      }
    } else {
      // No proposal - Show Mark Paid
      if (confirmingPaymentId == bet.id) {
        return `
              <div class="bet-actions-row">
                <span class="action-label">Mark as paid?</span>
                <div class="btn-group">
                  <button class="btn btn--xs btn--success confirm-payment-btn">Yes</button>
                  <button class="btn btn--xs btn--outline cancel-payment-btn">Cancel</button>
                </div>
              </div>
            `;
      }
      return `
            <div class="bet-actions-row">
              <button class="btn btn--xs btn--primary resolve-payment-btn" data-id="${bet.id}">Mark Paid</button>
            </div>
         `;
    }
  }

  return '';
}

export function renderBetCard(bet) {
  const { currentUser } = getState();
  const statusClass = `bet-card__status--${bet.status}`;
  const statusLabel = bet.status.charAt(0).toUpperCase() + bet.status.slice(1);
  const isWinner1 = bet.winnerName === bet.better1;
  const isWinner2 = bet.winnerName === bet.better2;
  const side1Class = isWinner1 ? 'bet-card__side--winner' : (isWinner2 ? 'bet-card__side--loser' : '');
  const side2Class = isWinner2 ? 'bet-card__side--winner' : (isWinner1 ? 'bet-card__side--loser' : '');
  const cardClass = isWinner1 ? 'bet-card--winner-1' : (isWinner2 ? 'bet-card--winner-2' : '');

  // Authorization Check
  const isAdmin = currentUser && currentUser.isAdmin;
  const isParticipant = currentUser && (currentUser.username === bet.better1 || currentUser.username === bet.better2);
  const canModify = isAdmin || isParticipant;

  return `
    <div class="bet-card ${cardClass}">
      <div class="bet-card__header">
        <span class="bet-card__date">${formatDate(bet.date)}</span>
        <span class="bet-card__status ${statusClass}">${statusLabel}</span>
      </div>
      <div class="bet-card__matchup">
        <div class="bet-card__side ${side1Class}">
          <div class="bet-card__bettor">
            ${bet.better1}
            ${isWinner1 ? '<span class="winner-badge">👑</span>' : ''}
          </div>
          <div class="bet-card__bet">${bet.better1Bet}</div>
          <div class="bet-card__stake">${formatCurrency(bet.better1Reward)}</div>
        </div>
        <div class="bet-card__vs">VS</div>
        <div class="bet-card__side ${side2Class}">
          <div class="bet-card__bettor">
            ${bet.better2}
            ${isWinner2 ? '<span class="winner-badge">👑</span>' : ''}
          </div>
          <div class="bet-card__bet">${bet.better2Bet}</div>
          <div class="bet-card__stake">${formatCurrency(bet.better2Reward)}</div>
        </div>
      </div>
      ${renderBetActions(bet, canModify)}
    </div>
  `;
}
