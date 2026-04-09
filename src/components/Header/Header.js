import { getState, getPendingActionCount, toggleTheme } from '../../lib/store/store.js';
import { getInitials } from '../../lib/utils/utils.js';
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
        <span class="stats-bar__value" style="color: #8cff8c;">${member.wins || 0}</span>
        <span class="stats-bar__label">Won</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value" style="color: #ff8a8a;">${member.losses || 0}</span>
        <span class="stats-bar__label">Lost</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value">${formatCurrency(member.potentialGain || 0)}</span>
        <span class="stats-bar__label">Potential</span>
      </div>
      <div class="stats-bar__divider"></div>
      <div class="stats-bar__item">
        <span class="stats-bar__value" style="color: ${member.netProfit >= 0 ? '#8cff8c' : '#ff8a8a'};">${profitSign}${formatCurrency(member.netProfit)}</span>
        <span class="stats-bar__label">Net</span>
      </div>
    </div>
  `;
}

export function renderStatsBar() {
  const { overallStats, currentView, currentUser, memberStats, bettorFilter } = getState();
  if (!overallStats || !overallStats.totalBets) return '';

  // My Bets: show current user's stats
  if (currentView === 'my-bets' && currentUser) {
    const member = memberStats.find(m => m.name === currentUser.username);
    if (member) return renderMemberStatsBar(member, currentUser.username);
  }

  // All Bets with a player selected: show that player's stats
  if (currentView === 'bets' && bettorFilter && bettorFilter !== 'all') {
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
  const { currentUser, currentView, isDarkMode } = getState();
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
      <div class="header__inner">
        <div class="header__brand js-logo-link" style="cursor: pointer;">
          <img src="${BASE_URL}header_logo.png" class="header__logo-img" alt="HD Bets" />
          <span class="header__title">HD Bets!</span>
        </div>
        <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">☰</button>
        
        <!-- Desktop Nav -->
        <nav class="header__nav desktop-only">
          <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-path="/">
            Dashboard
          </button>
          <button class="nav-btn ${currentView === 'my-bets' ? 'active' : ''}" data-path="/my-bets">
            My Bets ${badgeHtml}
          </button>
          <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-path="/bets">
            All Bets
          </button>
          <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-path="/members">
            Members
          </button>
          <button class="nav-btn ${currentView === 'history' ? 'active' : ''}" data-path="/history">
            History
          </button>
          <button class="nav-btn ${currentView === 'bracket' ? 'active' : ''}" data-path="/bracket">
            Bracket
          </button>
          <button class="nav-btn nav-btn--primary js-new-bet-btn">
            + New Bet
          </button>
          
          <div class="header__user">
             <div class="user-dropdown" id="userDropdownTrigger">
               <div class="user-badge" title="Logged in as ${user.username}">
                 <div class="user-badge__icon">${getInitials(user.username)}</div>
                 <span>${user.username}</span>
                 ${user.isAdmin ? '<span class="admin-tag">ADMIN</span>' : ''}
                 <span style="font-size: 0.7em; margin-left: 4px; opacity: 0.5;">▼</span>
               </div>
               
               <div class="user-dropdown-menu" id="userDropdownMenu">
                 <button class="user-dropdown-item js-change-pw-btn">
                   <span>🔑</span> Change Password
                 </button>
                 <button class="user-dropdown-item js-theme-toggle">
                   <span>${isDarkMode ? '☀️' : '🌙'}</span> ${isDarkMode ? 'Light Mode' : 'Dark Mode'}
                 </button>
                 <button class="user-dropdown-item js-logout-btn" style="color: #ff4757;">
                   <span>➜</span> Logout
                 </button>
               </div>
             </div>
          </div>
        </nav>
      </div>
      <div class="nav-overlay" id="navOverlay"></div>
      ${renderStatsBar()}
    </header>
  `;
}

export function renderMobileNav() {
  const { currentUser, currentView, isDarkMode } = getState();
  const user = currentUser || { username: 'Guest' };
  const pendingCount = getPendingActionCount();
  const BASE_URL = import.meta.env.BASE_URL || '/';

  const badgeHtml = pendingCount > 0 ? `<span class="nav-badge">${pendingCount}</span>` : '';

  return `
    <nav class="header__nav mobile-only" id="mainNav">
      <div class="mobile-nav-header" style="padding: var(--space-lg) var(--space-md); border-bottom: 1px solid var(--border-subtle); margin-bottom: var(--space-md); display: flex; align-items: center; gap: var(--space-md);">
         <div class="user-badge__icon" style="width: 48px; height: 48px; font-size: 1.2rem;">${getInitials(user.username)}</div>
         <div>
           <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary);">${user.username}</div>
           <div style="font-size: 0.8rem; color: var(--text-muted);">${user.isAdmin ? 'League Administrator' : 'League Member'}</div>
         </div>
      </div>
      <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-path="/">
        Dashboard
      </button>
      <button class="nav-btn ${currentView === 'my-bets' ? 'active' : ''}" data-path="/my-bets">
        My Bets ${badgeHtml}
      </button>
      <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-path="/bets">
        All Bets
      </button>
      <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-path="/members">
        Members
      </button>
      <button class="nav-btn ${currentView === 'history' ? 'active' : ''}" data-path="/history">
        History
      </button>
      <button class="nav-btn ${currentView === 'bracket' ? 'active' : ''}" data-path="/bracket">
        Bracket
      </button>

      <div style="margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
         <button class="nav-btn js-new-bet-btn" style="background: var(--primary); color: white; justify-content: center;">Place New Bet</button>
         <button class="nav-btn js-logout-btn" style="color: #ff4757; justify-content: center;">Log Out</button>
         <button class="nav-btn js-theme-toggle" style="justify-content: center;">
             ${isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
         </button>
      </div>
    </nav>
  `;
}
