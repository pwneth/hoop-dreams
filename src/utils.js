export function formatCurrency(amount) {
    return `€${amount.toFixed(2)}`;
}

export function formatDate(date) {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

export function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getOtherBetter(bet, user) {
  if (!user) return { name: 'Opponent' };
  return bet.better1 === user.username ? { name: bet.better2 } : { name: bet.better1 };
}
