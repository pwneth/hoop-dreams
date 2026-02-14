import { getState, getPendingActionCount, toggleTheme } from '../lib/store.js';
import { getInitials } from '../lib/utils.js';
import { logout } from '../lib/auth.js';

let hasAnimatedBadge = false;

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
      <div class="js-logo-link" style="padding: var(--space-md); border-bottom: 1px solid var(--border-subtle); margin-bottom: var(--space-md); display: flex; justify-content: center; cursor: pointer;">
         <img src="${BASE_URL}header_logo.png" style="height: 40px;" alt="HD Bets" />
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
      
      <div style="margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
         <div class="user-badge" style="justify-content: center; margin-bottom: var(--space-md);">
           <div class="user-badge__icon">${getInitials(user.username)}</div>
           <span>${user.username}</span>
         </div>
         <button class="nav-btn js-new-bet-btn" style="background: var(--primary); color: white; justify-content: center;">Place New Bet</button>
         <button class="nav-btn js-logout-btn" style="color: #ff4757; justify-content: center;">Log Out</button>
         <button class="nav-btn js-theme-toggle" style="justify-content: center;">
             ${isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
         </button>
      </div>
    </nav>
  `;
}
