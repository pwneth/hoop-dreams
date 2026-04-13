import { getState, getPendingActionCount, getPendingBets, toggleTheme } from '../../lib/store/store.js';
import { getInitials, getAvatarColor } from '../../lib/utils/utils.js';
import { formatCurrency } from '../../lib/utils/utils.js';
import { logout } from '../../lib/auth/auth.js';

let hasAnimatedBadge = false;

function renderMemberStatsBar(member, label) {
  const profitSign = member.netProfit > 0 ? '+' : '';
  return `
    <div class="stats-bar">
      <div class="stats-bar__item">
        <span class="stats-bar__name">${label}</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${(member.wins || 0) + (member.losses || 0) + (member.activeBets || 0)}</span>
        <span class="stats-bar__label">Bets</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${member.wins || 0}</span>
        <span class="stats-bar__label">Won</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${member.losses || 0}</span>
        <span class="stats-bar__label">Lost</span>
      </div>
      <div class="stats-bar__divider stats-bar__hide-mobile"></div>
      <div class="stats-bar__item stats-bar__hide-mobile">
        <span class="stats-bar__value">${formatCurrency(member.potentialGain || 0)}</span>
        <span class="stats-bar__label">Pending</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${profitSign}${formatCurrency(member.netProfit)}</span>
        <span class="stats-bar__label">${member.netProfit >= 0 ? 'Won' : 'Lost'}</span>
      </div>
    </div>
  `;
}

export function renderActionBar() {
  const count = getPendingActionCount();
  if (count === 0) return '';
  return `
    <div class="action-bar">
      <span class="action-bar__icon">&#9888;&#65039;</span>
      <span class="action-bar__text">You have <strong>${count}</strong> pending action${count > 1 ? 's' : ''} requiring your attention</span>
    </div>
  `;
}

export function renderStatsBar() {
  const { overallStats, currentView, currentUser, memberStats, bettorFilter } = getState();
  if (!overallStats || !overallStats.totalBets) return '';

  // When a player is selected: show that player's stats
  if (currentView === 'dashboard' && bettorFilter && bettorFilter !== 'all') {
    const member = memberStats.find(m => m.name === bettorFilter);
    if (member) return renderMemberStatsBar(member, bettorFilter);
  }

  // Default: overall stats
  return `
    <div class="stats-bar">
      <div class="stats-bar__item">
        <span class="stats-bar__value">${overallStats.totalBets || 0}</span>
        <span class="stats-bar__label">Bets</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${overallStats.activeBets || 0}</span>
        <span class="stats-bar__label">Active</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${overallStats.completedBets || 0}</span>
        <span class="stats-bar__label">Done</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${formatCurrency(overallStats.totalVolume || 0)}</span>
        <span class="stats-bar__label">Volume</span>
      </div>
    </div>
  `;
}

export function renderHeader() {
  const { currentUser, currentView, isDarkMode, userAvatar } = getState();
  const user = currentUser || { username: 'Guest' };
  const pendingCount = getPendingActionCount();
  const BASE_URL = import.meta.env.BASE_URL || '/';

  let animationClass = '';
  if (pendingCount > 0 && !hasAnimatedBadge) {
    animationClass = 'animate-pop';
    hasAnimatedBadge = true;
  }

  const badgeHtml = pendingCount > 0 ? `<span class="nav-badge ${animationClass}">${pendingCount}</span>` : '';

  return `
    <header class="header">
      <div class="header__nav-row">
        <div class="header__inner">
          <div class="header__brand js-logo-link" style="cursor: pointer;">
            <img src="${BASE_URL}header_logo.png" class="header__logo-img" alt="HD Bets" />
            <span class="header__title">HD Bets!</span>
          </div>
          <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">☰</button>

          <!-- Desktop Nav -->
          <nav class="header__nav desktop-only">
            ${currentUser ? `
              <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-path="/">
                Bets ${badgeHtml}
              </button>
            ` : ''}
            <button class="nav-btn ${currentView === 'bracket' ? 'active' : ''}" data-path="/bracket">
              Bracket
            </button>
            ${currentUser ? `
              <div class="header__user">
                 <div class="user-menu" id="userDropdownTrigger">
                   <div class="user-menu__trigger">
                     <span class="user-tag user-tag--nav" style="--tag-color:${getAvatarColor(user.username).bg}"><span class="user-tag__icon" ${userAvatar ? `style="background-image:url('${userAvatar}')"` : ''}>${user.username.charAt(0)}</span>${user.username}${user.isAdmin ? '<span class="admin-tag">ADMIN</span>' : ''}<span class="user-tag__arrow">▼</span></span>
                   </div>
                   <div class="user-menu__items">
                     <button class="user-menu__item js-settings-btn">Settings</button>
                     <button class="user-menu__item js-theme-toggle">${isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
                     <button class="user-menu__item user-menu__item--danger js-logout-btn">Logout</button>
                   </div>
                 </div>
              </div>
            ` : ''}
          </nav>
        </div>
      </div>
      <div class="nav-overlay" id="navOverlay"></div>
    </header>
  `;
}

export function renderMobileNav() {
  const { currentUser, currentView, isDarkMode, userAvatar } = getState();
  const user = currentUser || { username: 'Guest' };
  const pendingCount = getPendingActionCount();
  const color = getAvatarColor(user.username);

  const badgeHtml = pendingCount > 0 ? `<span class="nav-badge">${pendingCount}</span>` : '';

  return `
    <nav class="header__nav mobile-only" id="mainNav">
      <button class="mobile-nav__close" id="closeNavBtn">&times;</button>
      ${currentUser ? `
        <div class="mobile-nav__profile">
          ${userAvatar
            ? `<img src="${userAvatar}" class="mobile-nav__avatar" />`
            : `<div class="mobile-nav__avatar-placeholder" style="background:${color.bg}">${user.username.charAt(0)}</div>`
          }
          <div class="mobile-nav__name">${user.username}</div>
        </div>
      ` : ''}
      <div class="mobile-nav__links">
        ${currentUser ? `
          <button class="mobile-nav__link ${currentView === 'dashboard' ? 'mobile-nav__link--active' : ''}" data-path="/">
            Bets ${badgeHtml}
          </button>
        ` : ''}
        <button class="mobile-nav__link ${currentView === 'bracket' ? 'mobile-nav__link--active' : ''}" data-path="/bracket">
          Bracket
        </button>
        ${currentUser ? `
          <button class="mobile-nav__link js-settings-btn">Settings</button>
        ` : ''}
        <button class="mobile-nav__link js-theme-toggle">${isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
        ${currentUser ? `
          <button class="mobile-nav__link mobile-nav__link--logout js-logout-btn">Log Out</button>
        ` : ''}
      </div>
    </nav>
  `;
}
