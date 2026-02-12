import './style.css';
import confetti from 'canvas-confetti';
import {
  fetchBets,
  calculateMemberStats,
  calculateOverallStats,
  createBet,
  updateBet,
  markBetAsPaid,
  LEAGUE_MEMBERS,
  login,
  register,
  getCurrentUser,
  logout,
  changePassword,
  fetchUsers,
  confirmBet
} from './api.js';

// Auth State
let currentUser = getCurrentUser();
let authMode = 'login'; // 'login' or 'register'

// App State
let currentView = 'dashboard';
let bets = [];
let memberStats = [];
let overallStats = {};
let statusFilter = 'all';
let bettorFilter = 'all';

// UI State
let showNewBetModal = false;
let isSubmitting = false;
let submitSuccess = false;
let showResolveModal = false;
let resolveBetId = null;
let resolveIsSubmitting = false;
let confirmingResolution = null;
let confirmingPaymentId = null;
let confirmingBetId = null;
let showChangePasswordModal = false;

// Theme State
const THEME_STORAGE_KEY = 'hd_bets_theme';
let isDarkMode = localStorage.getItem(THEME_STORAGE_KEY) === 'dark';

// Apply theme on load
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}
applyTheme();

function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  applyTheme();
  render();
}

// DOM Elements
const app = document.getElementById('app');

// Helpers
function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Confetti Helpers
function triggerConfetti(type = 'happy') {
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 2000
  };

  if (type === 'happy') {
    confetti({
      ...defaults,
      particleCount: 100,
      spread: 70,
      colors: ['#6001D2', '#00D9A5', '#FFD700'],
      shapes: ['circle', 'square'],
      scalar: 1.2
    });
  } else if (type === 'sad') {
    const scalar = 4;
    const shapes = [
      confetti.shapeFromText({ text: '😭', scalar }),
      confetti.shapeFromText({ text: '😞', scalar }),
      confetti.shapeFromText({ text: '💔', scalar }),
      confetti.shapeFromText({ text: '📉', scalar })
    ];

    confetti({
      ...defaults,
      shapes,
      particleCount: 40,
      spread: 60,
      scalar,
      gravity: 1.2,
      ticks: 150
    });
  } else if (type === 'dice') {
    const scalar = 3;
    const dice = confetti.shapeFromText({ text: '🎲', scalar });
    const sparkle = confetti.shapeFromText({ text: '✨', scalar });

    confetti({
      ...defaults,
      shapes: [dice, sparkle],
      particleCount: 30,
      spread: 80,
      scalar
    });
  }
}

// ==========================================
// RENDER COMPONENTS
// ==========================================

// Routing
const BASE_URL = import.meta.env.BASE_URL || '/';

function navigateTo(path) {
  const normalizedBase = BASE_URL === '/' ? '' : BASE_URL.replace(/\/$/, '');
  const target = normalizedBase + path;
  window.history.pushState({}, '', target);
  handleRoute();
}

function handleRoute() {
  const path = window.location.pathname;
  const normalizedBase = BASE_URL === '/' ? '' : BASE_URL.replace(/\/$/, '');

  let internalPath = path;
  if (path.startsWith(normalizedBase)) {
    internalPath = path.substring(normalizedBase.length);
  }

  if (internalPath === '/' || internalPath === '/dashboard' || internalPath === '') {
    currentView = 'dashboard';
  } else if (internalPath === '/my-bets') {
    currentView = 'my-bets';
  } else if (internalPath === '/bets') {
    currentView = 'bets';
  } else if (internalPath === '/members') {
    currentView = 'members';
  } else {
    // Default route
    currentView = 'dashboard';
    // Optionally replace state to clean URL, but careful with loop
    if (internalPath !== '/' && internalPath !== '') {
      window.history.replaceState({}, '', normalizedBase + '/');
    }
  }

  render();
  window.scrollTo(0, 0);
}

function renderMyBetsView() {
  if (!currentUser) return '';

  let myBets = bets.filter(b => b.better1 === currentUser.username || b.better2 === currentUser.username);

  // Filter by status if needed
  if (statusFilter !== 'all') {
    myBets = myBets.filter(b => b.status === statusFilter);
  }

  // Reuse renderIndividualStats for the current user's summary
  const statsHtml = renderIndividualStats(currentUser.username);

  const filtersHtml = `
    <div class="filters">
      <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">🟢 Active</button>
      <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">✅ Paid</button>
      <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">⏳ Pending</button>
    </div>
  `;

  let betsHtml = '';
  if (myBets.length === 0) {
    betsHtml = `
      <div class="empty-state">
        <div class="empty-state__icon">🎲</div>
        <p>No bets found matching criteria.</p>
        ${statusFilter === 'all' ? '<button class="btn btn--primary js-new-bet-btn" style="margin-top: var(--space-md);">Place your first bet</button>' : ''}
      </div>
    `;
  } else {
    betsHtml = `
      <div class="bets-grid">
        ${myBets.map(bet => renderBetCard(bet)).join('')}
      </div>
    `;
  }

  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">My Bets</h2>
      </div>
      ${renderActionNeededSection()}
      ${filtersHtml}
      ${statsHtml}
      ${betsHtml}
    </section>
  `;
}

function getPendingBets() {
  if (!currentUser || !bets) return [];
  return bets.filter(bet => {
    if (bet.better1 !== currentUser.username && bet.better2 !== currentUser.username) return false;

    const isWaitingForWinner = !bet.winnerLabel;
    const isWaitingForPayment = !!bet.winnerLabel && bet.status !== 'paid';

    if (isWaitingForWinner) {
      if (bet.proposerWinner && bet.proposerWinner !== currentUser.username) return true;
    } else if (isWaitingForPayment) {
      if (bet.proposerPaid && bet.proposerPaid !== currentUser.username) return true;
    }
    return false;
  });
}

function getPendingActionCount() {
  return getPendingBets().length;
}

function renderActionNeededSection() {
  const pendingBets = getPendingBets();
  if (pendingBets.length === 0) return '';

  return `
      <section class="section" style="margin-bottom: var(--space-xl); background: rgba(255, 71, 87, 0.05); border: 1px solid rgba(255, 71, 87, 0.2); border-radius: var(--radius-lg); padding: var(--space-md);">
        <div class="section__header" style="margin-bottom: var(--space-md);">
           <h2 class="section__title" style="color: #ff4757; font-size: 1.25rem;"><span>⚠️</span> Action Needed</h2>
        </div>
        <div class="bets-grid">
           ${pendingBets.map(bet => renderBetCard(bet)).join('')}
        </div>
      </section>
    `;
}

function renderHeader() {
  const user = currentUser || { username: 'Guest' };
  const pendingCount = getPendingActionCount();

  let animationClass = '';
  if (pendingCount > 0 && !window.hasAnimatedBadge) {
    animationClass = 'animate-pop';
    window.hasAnimatedBadge = true; // Mark as animated
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

function renderMobileNav() {
  const user = currentUser || { username: 'Guest' };
  const pendingCount = getPendingActionCount();
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

function renderLoginScreen() {
  return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-card__header">
          <img src="${BASE_URL}header_logo.png" class="login-card__logo-img" alt="HD Bets" />
          <h1 class="login-card__title">HD Bets!</h1>
          <p class="login-card__subtitle">Fantasy Basketball Betting</p>
        </div>
        
        <div class="auth-toggle">
          <div class="auth-toggle__btn ${authMode === 'login' ? 'active' : ''}" onclick="window.setAuthMode('login')">Login</div>
          <div class="auth-toggle__btn ${authMode === 'register' ? 'active' : ''}" onclick="window.setAuthMode('register')">Register</div>
        </div>

        <form class="login-form" id="loginForm">
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input type="text" class="form-input" name="username" placeholder="Enter your first name" style="text-transform: capitalize;" required autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" placeholder="Enter password" required />
          </div>
          
          <div class="login-error" id="loginError" style="display: none;"></div>
          
          <button type="submit" class="btn btn--primary btn--full">
            ${authMode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  `;
}

// Window global for inline onclick (simplified)
window.setAuthMode = (mode) => {
  authMode = mode;
  const loginApp = document.getElementById('app');
  if (loginApp) loginApp.innerHTML = renderLoginScreen();
  // Re-attach listener
  const form = document.getElementById('loginForm');
  if (form) form.addEventListener('submit', handleAuthSubmit);
};

function renderStatsCards() {
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__label">Total Bets</div>
        <div class="stat-card__value">${overallStats.totalBets || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Active Bets</div>
        <div class="stat-card__value">${overallStats.activeBets || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Completed</div>
        <div class="stat-card__value">${overallStats.completedBets || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Total Volume</div>
        <div class="stat-card__value">${formatCurrency(overallStats.totalVolume || 0)}</div>
      </div>
    </div>
  `;
}

function renderLeaderboard() {
  if (memberStats.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">📊</div>No data available</div>';
  }

  const items = memberStats.map((member, index) => {
    const rank = index + 1;
    const rankClass = rank <= 3 ? `leaderboard__rank--${rank}` : 'leaderboard__rank--other';
    const profitClass = member.netProfit > 0 ? 'leaderboard__profit--positive' :
      member.netProfit < 0 ? 'leaderboard__profit--negative' :
        'leaderboard__profit--neutral';
    const profitSign = member.netProfit > 0 ? '+' : '';

    return `
      <div class="leaderboard__item" data-bettor="${member.name}" role="button" tabindex="0">
        <div class="leaderboard__rank ${rankClass}">${rank}</div>
        <div class="leaderboard__name">${member.name}</div>
        <div class="leaderboard__stats">${member.wins}W - ${member.losses}L (${member.winRate}%)</div>
        <div class="leaderboard__potential">${member.potentialGain > 0 ? formatCurrency(member.potentialGain) : '-'}</div>
        <div class="leaderboard__profit ${profitClass}">${profitSign}${formatCurrency(member.netProfit)}</div>
      </div>
    `;
  }).join('');

  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🏆</span> Leaderboard</h2>
      </div>
      <div class="leaderboard">
        ${items}
      </div>
    </section>
  `;
}

function getOtherBetter(bet, user) {
  if (!user) return { name: 'Opponent' };
  return bet.better1 === user.username ? { name: bet.better2 } : { name: bet.better1 };
}

function renderBetActions(bet, canModify) {
  if (!canModify || bet.status === 'paid' || bet.status === 'declined') return '';

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

function renderBetCard(bet) {
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
        <span class="bet-card__date">${bet.date ? bet.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
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

function renderFilters() {
  const allBettors = [...new Set(bets.flatMap(b => [b.better1, b.better2]))].filter(b => b !== 'Pot').sort();
  const bettorOptions = allBettors.map(b => `<option value="${b}" ${bettorFilter === b ? 'selected' : ''}>${b}</option>`).join('');

  return `
    <div class="filters">
      <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">🟢 Active</button>
      <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">✅ Paid</button>
      <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">⏳ Pending</button>
      <select class="form-select" id="bettorFilterSelect" style="min-width: 150px;">
        <option value="all" ${bettorFilter === 'all' ? 'selected' : ''}>All Bettors</option>
        ${bettorOptions}
      </select>
    </div>
  `;
}

function renderBetsList() {
  let filteredBets = bets;
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

  if (filteredBets.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">🎲</div>
        <p>No bets found</p>
      </div>
    `;
  }

  return `
    <div class="bets-grid">
      ${filteredBets.map(bet => renderBetCard(bet)).join('')}
    </div>
  `;
}

function renderMemberCard(member) {
  const profitClass = member.netProfit > 0 ? 'leaderboard__profit--positive' :
    member.netProfit < 0 ? 'leaderboard__profit--negative' :
      'leaderboard__profit--neutral';
  const profitSign = member.netProfit > 0 ? '+' : '';

  return `
    <div class="member-card">
      <div class="member-card__header">
        <div class="member-card__avatar">${getInitials(member.name)}</div>
        <div>
          <div class="member-card__name">${member.name}</div>
          <div class="member-card__record">${member.wins}W - ${member.losses}L</div>
        </div>
      </div>
      <div class="member-card__stats">
        <div class="member-card__stat">
          <div class="member-card__stat-value ${profitClass}">${profitSign}${formatCurrency(member.netProfit)}</div>
          <div class="member-card__stat-label">Net P/L</div>
        </div>
        <div class="member-card__stat">
          <div class="member-card__stat-value">${member.winRate}%</div>
          <div class="member-card__stat-label">Win Rate</div>
        </div>
        <div class="member-card__stat">
          <div class="member-card__stat-value">${member.activeBets}</div>
          <div class="member-card__stat-label">Active</div>
        </div>
      </div>
    </div>
  `;
}

function renderMembersView() {
  if (memberStats.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">👥</div>No members found</div>';
  }
  return `
    <div class="member-grid">
      ${memberStats.map(member => renderMemberCard(member)).join('')}
    </div>
  `;
}

function renderDashboardView() {
  return `
    ${renderActionNeededSection()}
    <div class="mobile-only-action">
      <button class="btn btn--primary btn--full" id="dashNewBetBtn">Place New Bet</button>
    </div>
    ${renderLeaderboard()}
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🔥</span> Recent Bets</h2>
      </div>
      <div class="bets-grid">
        ${bets.slice(0, 5).map(bet => renderBetCard(bet)).join('')}
      </div>
      <div style="margin-top: var(--space-lg); text-align: center;">
        <button class="btn btn--secondary btn--full" id="dashViewAllBtn">See All Bets</button>
      </div>
    </section>
  `;
}

function renderIndividualStats(name) {
  const member = memberStats.find(m => m.name === name);
  if (!member) return '';
  const totalBets = (member.wins || 0) + (member.losses || 0) + (member.activeBets || 0);
  const profitSign = member.netProfit > 0 ? '+' : '';
  const netColor = member.netProfit >= 0 ? 'var(--status-active)' : '#ff4757';

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__label">Total Bets</div>
        <div class="stat-card__value">${totalBets}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Won</div>
        <div class="stat-card__value" style="color: var(--status-active);">${member.wins}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Lost</div>
        <div class="stat-card__value" style="color: #ff4757;">${member.losses}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Potential</div>
        <div class="stat-card__value" style="color: var(--text-secondary);">${formatCurrency(member.potentialGain || 0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Net</div>
        <div class="stat-card__value" style="color: ${netColor};">${profitSign}${formatCurrency(member.netProfit)}</div>
      </div>
    </div>
  `;
}

function renderAllBetsView() {
  const statsHtml = bettorFilter === 'all' ? renderStatsCards() : renderIndividualStats(bettorFilter);
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title">All Bets</h2>
      </div>
      ${renderFilters()}
      ${statsHtml}
      ${renderBetsList()}
    </section>
  `;
}

function renderAllMembersView() {
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>👥</span> Member Statistics</h2>
      </div>
      ${renderMembersView()}
    </section>
  `;
}

function renderLoading() {
  return `
    <div style="max-width: 1400px; margin: 0 auto;">
      <div class="skeleton-section-title skeleton"></div>
      <div class="skeleton-leaderboard">
        ${Array(5).fill(0).map(() => `
          <div class="skeleton-lb-row">
            <div class="skeleton-lb-rank skeleton"></div>
            <div class="skeleton-lb-name skeleton"></div>
            <div class="skeleton-lb-stats skeleton"></div>
            <div class="skeleton-lb-potential skeleton"></div>
            <div class="skeleton-lb-profit skeleton"></div>
          </div>
        `).join('')}
      </div>
      <div class="skeleton-section-title skeleton" style="margin-top: var(--space-2xl);"></div>
      <div class="bets-grid">
        ${Array(3).fill(0).map(() => `
          <div class="skeleton-bet-card">
            <div class="skeleton-card-header">
              <div class="skeleton-date skeleton"></div>
              <div class="skeleton-status skeleton"></div>
            </div>
            <div class="skeleton-matchup">
              <div class="skeleton-side-box skeleton"></div>
              <div class="skeleton-vs"></div>
              <div class="skeleton-side-box skeleton"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderChangePasswordModal() {
  if (!showChangePasswordModal) return '';
  return `
    <div class="modal-overlay" id="pwModalOverlay">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">Change Password</h2>
          <button class="modal__close" id="closePwModalBtn">&times;</button>
        </div>
        <form class="modal__form" id="changePwForm">
          <div class="form-group">
            <label class="form-label">Old Password</label>
            <input type="password" class="form-input" name="oldPassword" required />
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" class="form-input" name="newPassword" required />
          </div>
          
          <div class="error-message" id="pwError" style="margin-top: 1rem; display: none;"></div>
          
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" id="cancelPwBtn">Cancel</button>
            <button type="submit" class="btn btn--primary">Change Password</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderNewBetModal() {
  if (!showNewBetModal) return '';

  // Filter out 'Pot' from LEAGUE_MEMBERS if it's present, and then filter out the current user
  const allBetters = [...new Set(LEAGUE_MEMBERS)].filter(b => b.toLowerCase() !== 'pot' && b !== currentUser.username);
  const betterOptions = allBetters.map(m => {
    const name = (typeof m === 'object' && m !== null) ? (m.username || m.name || 'User') : String(m);
    return `<option value="${name}">${name}</option>`;
  }).join('');

  const loadingClass = isSubmitting ? 'is-loading' : '';
  const successClass = submitSuccess ? 'is-success' : '';
  const me = currentUser.username;

  return `
    <div class="modal-overlay ${loadingClass} ${successClass}" id="modalOverlay">
      <div class="modal" id="modalContainer">
        <!-- Loader Overlay -->
        <div class="modal-overlay-loader">
          <div class="basketball-loader">🏀</div>
          <p style="margin-top: var(--space-lg); font-weight: 700; color: var(--text-primary); letter-spacing: 1px; font-size: 0.9rem;">LOCKING IN YOUR BET...</p>
        </div>

        <!-- Success Overlay -->
        <div class="modal-overlay-success">
          <div class="success-icon">🎲</div>
          <p class="success-text">Bet Placed Successfully!</p>
          <p class="success-subtext">Good luck to both bettors! May the best baller win. 🏀</p>
        </div>

        <!-- Main Form Content -->
        <div class="modal__header">
          <h2 class="modal__title">New Bet</h2>
          <button class="modal__close" id="closeModalBtn">&times;</button>
        </div>
        <p id="newBetError" class="error-message" style="margin: 0 var(--space-lg); display: none;"></p>
        <form class="modal__form" id="newBetForm">
          <div class="form-group" style="margin-bottom: var(--space-lg);">
            <label class="form-label" style="display: block; margin-bottom: var(--space-sm);">Who are you betting against?</label>
            <div class="betters-row" style="display: flex; align-items: center; gap: var(--space-md);">
              <div style="flex: 1; padding: var(--space-sm); background: var(--bg-secondary); border-radius: var(--radius-md); text-align: center; font-weight: 700; border: 1px solid var(--border-medium);">
                ${me} (You)
                <input type="hidden" name="better1" value="${me}" />
              </div>
              <span style="font-weight: 700; color: var(--text-muted); flex-shrink: 0;">VS</span>
              <select class="form-select" name="better2" id="better2Select" style="flex: 1;" required>
                <option value="">Select opponent...</option>
                ${betterOptions}
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Your Bet</label>
              <textarea class="form-textarea" name="better1Bet" placeholder="e.g. Knicks win" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Opponent's Bet</label>
              <textarea class="form-textarea" name="better2Bet" placeholder="e.g. Knicks lose" required></textarea>
            </div>
          </div>
          
          <div class="form-row">
             <!-- Shared Stakes for now, or assume equal stakes? -->
             <!-- The user said: "people cannot make bets for other people" -->
             <!-- We'll keep separate stakes inputs but label them clearly -->
            <div class="form-group">
              <label class="form-label">Your Stake (€)</label>
              <input type="number" class="form-input" name="better1Reward" min="1" step="0.01" placeholder="20.00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Opponent's Stake (€)</label>
              <input type="number" class="form-input" name="better2Reward" min="1" step="0.01" placeholder="20.00" required />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" id="cancelBetBtn">Cancel</button>
            <button type="submit" class="btn btn--primary" ${isSubmitting ? 'disabled' : ''}>
              ${isSubmitting ? 'Submitting...' : 'Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function render(target = 'all') {
  let mainContent = '';

  switch (currentView) {
    case 'dashboard':
      mainContent = renderDashboardView();
      break;
    case 'my-bets':
      mainContent = renderMyBetsView();
      break;
    case 'bets':
      mainContent = renderAllBetsView();
      break;
    case 'members':
      mainContent = renderAllMembersView();
      break;
  }

  if (target === 'all' || target === 'app') {
    app.innerHTML = `
      <div class="nav-overlay" id="navOverlay"></div>
      ${renderMobileNav()}
      ${renderHeader()}
      <main class="main">
        ${mainContent}
      </main>
    `;
  }

  if (target === 'all' || target === 'modals') {
    const modalsEl = document.getElementById('modals');
    const existingOverlay = document.getElementById('modalOverlay');

    if (existingOverlay && showNewBetModal) {
      // Surgically update the existing modal to avoid re-render flash
      existingOverlay.classList.toggle('is-loading', isSubmitting);
      existingOverlay.classList.toggle('is-success', submitSuccess);

      const submitBtn = existingOverlay.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = isSubmitting;
        submitBtn.textContent = isSubmitting ? 'Submitting...' : 'Place Bet';
      }
    } else if (modalsEl) {
      // Re-render completely if no modal exists, OR if we need to remove one (showNewBetModal is false)
      modalsEl.innerHTML = `
        ${renderNewBetModal()}
        ${renderChangePasswordModal()}
      `;
    }
  }

  attachEventListeners();
}

async function handleNewBetSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  const betData = {
    better1: currentUser.username, // Force self
    better2: formData.get('better2'),
    better1Bet: formData.get('better1Bet'),
    better2Bet: formData.get('better2Bet'),
    better1Reward: parseFloat(formData.get('better1Reward')),
    better2Reward: parseFloat(formData.get('better2Reward'))
  };

  const errorEl = document.getElementById('newBetError');
  if (errorEl) errorEl.style.display = 'none';

  if (!betData.better2) {
    if (errorEl) {
      errorEl.textContent = 'Please select an opponent!';
      errorEl.style.display = 'block';
    }
    return;
  }

  isSubmitting = true;
  render('modals');

  try {
    await createBet(betData);
    submitSuccess = true;
    isSubmitting = false;
    render('modals');

    triggerConfetti('dice');

    // Auto close modal after delay
    setTimeout(async () => {
      submitSuccess = false;
      showNewBetModal = false;

      bets = await fetchBets();
      memberStats = calculateMemberStats(bets);
      overallStats = calculateOverallStats(bets);
      render('all'); // Full refresh now that bet is finalized

      const newBetCard = document.querySelector('.bet-card');
      if (newBetCard) {
        newBetCard.classList.add('animate-new-bet');
      }
    }, 3000);

  } catch (error) {
    isSubmitting = false;
    render('modals');
    const errorEl = document.getElementById('newBetError');
    if (errorEl) {
      errorEl.textContent = 'Failed to create bet: ' + error.message;
      errorEl.style.display = 'block';
    }
  }
}

async function handleResolveBet(winnerKey) {
  if (!resolveBetId && resolveBetId !== 0) return;

  resolveIsSubmitting = true;
  render();

  try {
    const bet = bets.find(b => b.id == resolveBetId);
    await updateBet(resolveBetId, winnerKey);

    const winnerName = winnerKey.toLowerCase() === 'better1' ? bet.better1 : bet.better2;
    if (winnerName === currentUser.username) {
      triggerConfetti('happy');
    } else {
      triggerConfetti('sad');
    }

    showResolveModal = false;
    resolveBetId = null;
    resolveIsSubmitting = false;

    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

  } catch (error) {
    resolveIsSubmitting = false;
    alert('Failed to update bet: ' + error.message);
    render();
  }
}

async function handleConfirmBet(betId, confirmAction) {
  resolveBetId = betId;
  resolveIsSubmitting = true;
  render();

  try {
    await confirmBet(betId, confirmAction);

    if (confirmAction === 'confirm') {
      triggerConfetti('dice');
    }

    resolveBetId = null;
    resolveIsSubmitting = false;

    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

  } catch (error) {
    resolveIsSubmitting = false;
    alert('Failed to ' + confirmAction + ' bet: ' + error.message);
    render();
  }
}

async function handleResolvePayment(betId) {
  resolveBetId = betId;
  resolveIsSubmitting = true;
  render();

  try {
    await markBetAsPaid(betId);

    // Only trigger happy confetti for the person receiving the money (the winner)
    // Actually, marking paid is usually done by the winner to confirm receipt
    const bet = bets.find(b => b.id == resolveBetId);
    if (bet && bet.winnerName === currentUser.username) {
      triggerConfetti('happy');
    }

    resolveBetId = null;
    resolveIsSubmitting = false;

    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

  } catch (error) {
    resolveIsSubmitting = false;
    alert('Failed to mark as paid: ' + error.message);
    render();
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  let username = formData.get('username') ? formData.get('username').trim() : '';

  // Capitalize first letter logic
  if (username) {
    username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }

  const password = formData.get('password');
  const errorEl = document.getElementById('loginError');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
  }

  if (errorEl) errorEl.style.display = 'none';

  try {
    if (authMode === 'login') {
      await login(username, password);
    } else {
      await register(username, password);
    }

    // Auth successful, reload state
    currentUser = getCurrentUser();
    init();

  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
    }
    if (submitBtn) {
      submitBtn.textContent = authMode === 'login' ? 'Login' : 'Create Account';
      submitBtn.disabled = false;
    }
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const oldPassword = formData.get('oldPassword');
  const newPassword = formData.get('newPassword');
  const errorEl = document.getElementById('pwError');

  if (errorEl) errorEl.style.display = 'none';

  try {
    await changePassword(oldPassword, newPassword);
    alert('Password changed successfully!');
    showChangePasswordModal = false;
    render();
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
    }
  }
}

function attachEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn[data-path]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const path = e.target.dataset.path;
      if (path && window.location.pathname !== path) {
        navigateTo(path);
      }
    });
  });

  document.querySelectorAll('.js-logo-link').forEach(link => {
    link.addEventListener('click', () => {
      navigateTo('/');
    });
  });

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');

  if (hamburgerBtn && mainNav && navOverlay) {
    function toggleMenu() {
      mainNav.classList.toggle('active');
      navOverlay.classList.toggle('active');
      hamburgerBtn.innerHTML = mainNav.classList.contains('active') ? '✕' : '☰';
    }
    // Remove old listeners to prevent duplicates if any (though typically we re-render and re-attach)
    // Actually hamburgerBtn is re-rendered in header, so it's fresh.
    hamburgerBtn.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (mainNav.classList.contains('active')) toggleMenu();
      });
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      if (filter && filter !== statusFilter) {
        statusFilter = filter;
        render();
      }
    });
  });

  const bettorFilterSelect = document.getElementById('bettorFilterSelect');
  if (bettorFilterSelect) {
    bettorFilterSelect.addEventListener('change', (e) => {
      bettorFilter = e.target.value;
      render();
    });
  }

  document.querySelectorAll('.js-new-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showNewBetModal = true;
      render();
    });
  });

  document.querySelectorAll('.js-logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      logout();
      currentUser = null;
      window.history.replaceState({}, '', '/');
      init();
    });
  });

  document.querySelectorAll('.js-change-pw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showChangePasswordModal = true;
      render();
    });
  });

  document.querySelectorAll('.js-theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // Modals
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBetBtn = document.getElementById('cancelBetBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const newBetForm = document.getElementById('newBetForm');

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => { showNewBetModal = false; render(); });
  if (cancelBetBtn) cancelBetBtn.addEventListener('click', () => { showNewBetModal = false; render(); });
  if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { showNewBetModal = false; render(); } });
  if (newBetForm) newBetForm.addEventListener('submit', handleNewBetSubmit);

  // Password Modal
  const closePwBtn = document.getElementById('closePwModalBtn');
  const cancelPwBtn = document.getElementById('cancelPwBtn');
  const pwOverlay = document.getElementById('pwModalOverlay');
  const pwForm = document.getElementById('changePwForm');

  if (closePwBtn) closePwBtn.addEventListener('click', () => { showChangePasswordModal = false; render(); });
  if (cancelPwBtn) cancelPwBtn.addEventListener('click', () => { showChangePasswordModal = false; render(); });
  if (pwOverlay) pwOverlay.addEventListener('click', (e) => { if (e.target === pwOverlay) { showChangePasswordModal = false; render(); } });
  if (pwForm) pwForm.addEventListener('submit', handleChangePasswordSubmit);

  const dashNewBetBtn = document.getElementById('dashNewBetBtn');
  if (dashNewBetBtn) dashNewBetBtn.addEventListener('click', () => { showNewBetModal = true; render(); });

  const dashViewAllBtn = document.getElementById('dashViewAllBtn');
  if (dashViewAllBtn) dashViewAllBtn.addEventListener('click', () => {
    navigateTo('/bets');
  });

  // User Dropdown
  const userDropdownTrigger = document.getElementById('userDropdownTrigger');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  if (userDropdownTrigger && userDropdownMenu) {
    userDropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('active');
    });
  }
}

async function init() {
  // Handle popstate for back/forward navigation
  window.addEventListener('popstate', handleRoute);

  if (!currentUser) {
    app.innerHTML = renderLoginScreen();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleAuthSubmit);
    }
    return;
  }

  // Set initial view based on URL
  handleRoute();

  const mainEl = document.querySelector('.main');
  if (mainEl) mainEl.innerHTML = renderLoading();

  try {
    await fetchUsers();
    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();
  } catch (error) {
    console.error('Failed to load bets:', error);
    app.innerHTML = `
      ${renderHeader()}
      <main class="main">
        <div class="empty-state">
          <div class="empty-state__icon">❌</div>
          <p>Failed to load betting data. Please try again later.</p>
        </div>
      </main>
    `;
    // Re-attach listeners needed for logout
    attachEventListeners();
  }
}




// Global click delegation for dynamic elements
if (app) {
  app.onclick = (e) => {
    // Leaderboard Click
    const leaderboardItem = e.target.closest('.leaderboard__item');
    if (leaderboardItem) {
      statusFilter = 'all';
      bettorFilter = leaderboardItem.dataset.bettor;
      navigateTo('/bets');
      return;
    }

    // Resolve Winner
    const winnerBtn = e.target.closest('.resolve-winner-btn');
    if (winnerBtn) {
      const winner = winnerBtn.dataset.winner;
      const betId = winnerBtn.dataset.id;
      confirmingResolution = { id: betId, winner: winner };
      render();
    }

    // Confirm Resolution
    if (e.target.matches('.confirm-resolve-btn')) {
      if (confirmingResolution) {
        resolveBetId = confirmingResolution.id;
        const winner = confirmingResolution.winner;
        confirmingResolution = null;
        handleResolveBet(winner);
      }
    }

    // Cancel Resolution
    if (e.target.closest('.cancel-resolve-btn')) {
      confirmingResolution = null;
      render();
    }

    // Confirm Bet Action
    const confirmBetBtn = e.target.closest('.js-start-confirm-bet');
    if (confirmBetBtn) {
      confirmingBetId = confirmBetBtn.dataset.id;
      render();
    }

    const confirmActionBtn = e.target.closest('.js-confirm-bet-action');
    if (confirmActionBtn) {
      const betId = confirmActionBtn.dataset.id;
      const confirmAction = confirmActionBtn.dataset.action;
      confirmingBetId = null;
      handleConfirmBet(betId, confirmAction);
    }

    if (e.target.closest('.js-cancel-confirm-bet')) {
      confirmingBetId = null;
      render();
    }

    // Resolve Payment
    if (e.target.matches('.resolve-payment-btn')) {
      confirmingPaymentId = e.target.dataset.id;
      render();
    }

    // Confirm Payment
    if (e.target.matches('.confirm-payment-btn')) {
      if (confirmingPaymentId) {
        const betId = confirmingPaymentId;
        confirmingPaymentId = null;
        handleResolvePayment(betId);
      }
    }

    // Cancel Payment
    if (e.target.matches('.cancel-payment-btn')) {
      confirmingPaymentId = null;
      render();
    }
  };
}

// Global click listener to close dropdowns
document.addEventListener('click', (e) => {
  const menu = document.getElementById('userDropdownMenu');
  const trigger = document.getElementById('userDropdownTrigger');

  if (menu && menu.classList.contains('active') && trigger && !trigger.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// Start
init();
