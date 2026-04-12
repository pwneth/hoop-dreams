import { getState } from '../../lib/store/store.js';
import { formatCurrency, renderUserTag } from '../../lib/utils/utils.js';

export function renderDebts() {
  const state = getState();
  const { bets, allPaypals, currentUser } = state;

  const unpaidBets = bets.filter(b => b.winnerName && b.status !== 'paid');

  if (unpaidBets.length === 0) {
    return `<div class="debts__empty">All settled up!</div>`;
  }

  const debtMap = {};
  unpaidBets.forEach(bet => {
    const winner = bet.winnerName;
    const loser = winner === bet.better1 ? bet.better2 : bet.better1;
    const amount = winner === bet.better1 ? bet.better1Reward : bet.better2Reward;
    if (!debtMap[loser]) debtMap[loser] = {};
    if (!debtMap[loser][winner]) debtMap[loser][winner] = 0;
    debtMap[loser][winner] += amount;
  });

  const settled = new Set();
  const netDebts = [];
  Object.keys(debtMap).forEach(debtor => {
    Object.keys(debtMap[debtor]).forEach(creditor => {
      const key = [debtor, creditor].sort().join('|');
      if (settled.has(key)) return;
      settled.add(key);
      const aOwesB = (debtMap[debtor] && debtMap[debtor][creditor]) || 0;
      const bOwesA = (debtMap[creditor] && debtMap[creditor][debtor]) || 0;
      const net = aOwesB - bOwesA;
      if (net > 0) netDebts.push({ from: debtor, to: creditor, amount: net });
      else if (net < 0) netDebts.push({ from: creditor, to: debtor, amount: -net });
    });
  });

  netDebts.sort((a, b) => b.amount - a.amount);
  if (netDebts.length === 0) return `<div class="debts__empty">All settled up!</div>`;

  return `
    <div class="debts">
      ${netDebts.map(d => {
        const paypalUser = allPaypals[d.to] || '';
        const showPayLink = paypalUser && currentUser && d.from === currentUser.username;
        const payUrl = paypalUser ? `https://paypal.me/${paypalUser}/${d.amount}` : '';
        return `
          <div class="debts__row">
            <div class="debts__row-main">
              ${renderUserTag(d.from, state)}
              <span class="debts__arrow">&#8594;</span>
              ${renderUserTag(d.to, state)}
              ${showPayLink
                ? `<a class="debts__amount debts__amount--payable" href="${payUrl}" target="_blank" rel="noopener" data-tooltip="Pay now via PayPal">${formatCurrency(d.amount)}</a>`
                : `<span class="debts__amount">${formatCurrency(d.amount)}</span>`
              }
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
