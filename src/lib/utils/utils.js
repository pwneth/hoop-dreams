export function formatCurrency(amount) {
    return `€${Number(amount).toFixed(2)}`;
}

export function formatDate(date) {
    if (!date) return 'N/A';
    // Ensure date is a Date object if possible
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

export function getInitials(name) {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Fixed color assignment per known member for maximum contrast
const MEMBER_COLORS = {
  'Michael':   { bg: '#6001D2', text: '#FFF' },
  'Pelos':     { bg: '#E91E63', text: '#FFF' },
  'Loukianos': { bg: '#00838F', text: '#FFF' },
  'Eleodoro':  { bg: '#E65100', text: '#FFF' },
  'Bastian':   { bg: '#2E7D32', text: '#FFF' },
};

const FALLBACK_COLORS = [
  { bg: '#C62828', text: '#FFF' },
  { bg: '#1565C0', text: '#FFF' },
  { bg: '#AD1457', text: '#FFF' },
  { bg: '#00695C', text: '#FFF' },
  { bg: '#F57F17', text: '#FFF' },
];

export function getAvatarColor(name) {
  if (!name) return FALLBACK_COLORS[0];
  if (MEMBER_COLORS[name]) return MEMBER_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) * 31 + hash;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export function renderUserTag(name, state) {
  const color = getAvatarColor(name);
  const avatars = state.allAvatars || {};
  const paypals = state.allPaypals || {};
  const memberStats = state.memberStats || [];
  const avatar = avatars[name] || '';
  const paypal = paypals[name] || '';
  const member = memberStats.find(m => m.name === name);
  const net = member ? (member.netProfit > 0 ? '+' : '') + '€' + Number(member.netProfit).toFixed(2) : '';
  const record = member ? `${member.wins}W - ${member.losses}L` : '';

  const profileData = `data-profile-name="${name}" data-profile-avatar="${avatar}" data-profile-paypal="${paypal}" data-profile-net="${net}" data-profile-record="${record}"`;

  return `<span class="user-tag" style="background:${color.bg};color:${color.text}" ${profileData}>${avatar ? `<img class="user-tag__avatar" src="${avatar}" />` : `<span class="user-tag__initial">${name.charAt(0)}</span>`}${name}</span>`;
}

export function getOtherBetter(bet, user) {
    if (!user) return { name: 'Opponent' };
    return bet.better1 === user.username ? { name: bet.better2 } : { name: bet.better1 };
}
