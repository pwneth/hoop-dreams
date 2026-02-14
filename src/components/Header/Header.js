import { getState, getPendingActionCount } from '../../lib/store/store.js';
import { getInitials } from '../../lib/utils/utils.js';
import { logout } from '../../lib/auth/auth.js';

let hasAnimatedBadge = false;

export function renderHeader() {
  const { currentUser, currentView } = getState();
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
          <span class="header__title">HD // BETS</span>
        </div>
        <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">☰</button>
        
        <!-- Desktop Nav -->
        <nav class="header__nav desktop-only">
          <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-path="/">
            DASHBOARD
          </button>
          <button class="nav-btn ${currentView === 'my-bets' ? 'active' : ''}" data-path="/my-bets">
            MY BETS ${badgeHtml}
          </button>
          <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-path="/bets">
            ALL BETS
          </button>
          <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-path="/members">
            MEMBERS
          </button>
          <button class="btn btn--secondary btn--sm js-new-bet-btn">
            + NEW BET
          </button>
          
          <div class="header__user">
             <div class="user-dropdown" id="userDropdownTrigger">
               <div class="user-badge" title="Logged in as ${user.username}">
                 <div class="user-badge__icon">${getInitials(user.username)}</div>
                 <span class="font-mono text-sm">${user.username}</span>
                 ${user.isAdmin ? '<span class="admin-tag">ADMIN</span>' : ''}
                 <span style="font-size: 0.7em; margin-left: 4px; opacity: 0.5;">▼</span>
               </div>
               
               <div class="user-dropdown-menu" id="userDropdownMenu">
                 <button class="user-dropdown-item js-change-pw-btn">
                   <span>🔑</span> CHANGE PASSWORD
                 </button>
                 <button class="user-dropdown-item js-logout-btn" style="color: var(--neon-pink);">
                   <span>➜</span> LOGOUT
                 </button>
               </div>
             </div>
          </div>
        </nav>
      </div>
      <div class="nav-overlay" id="navOverlay"></div>
    </header>
  `;
}

export function renderMobileNav() {
  const { currentUser, currentView } = getState();
  const user = currentUser || { username: 'Guest' };
  const pendingCount = getPendingActionCount();
  const BASE_URL = import.meta.env.BASE_URL || '/';

  const badgeHtml = pendingCount > 0 ? `<span class="nav-badge">${pendingCount}</span>` : '';

  return `
    <nav class="header__nav mobile-only" id="mainNav">
      <div class="mobile-nav-header" style="padding: var(--space-lg) var(--space-md); border-bottom: 1px solid var(--border-subtle); margin-bottom: var(--space-md); display: flex; align-items: center; gap: var(--space-md);">
         <div class="user-badge__icon" style="width: 48px; height: 48px; font-size: 1.2rem;">${getInitials(user.username)}</div>
         <div>
           <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-display);">${user.username}</div>
           <div style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono);">${user.isAdmin ? 'League Administrator' : 'League Member'}</div>
         </div>
      </div>
      <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-path="/">
        DASHBOARD
      </button>
      <button class="nav-btn ${currentView === 'my-bets' ? 'active' : ''}" data-path="/my-bets">
        MY BETS ${badgeHtml}
      </button>
      <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-path="/bets">
        ALL BETS
      </button>
      <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-path="/members">
        MEMBERS
      </button>
      
      <div style="margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 10px;">
         <button class="btn btn--primary js-new-bet-btn" style="justify-content: center;">PLACE NEW BET</button>
         <button class="btn btn--outline js-change-pw-btn" style="justify-content: center;">CHANGE PASSWORD</button>
         <button class="btn btn--danger js-logout-btn" style="justify-content: center;">LOG OUT</button>
      </div>
    </nav>
  `;
}
