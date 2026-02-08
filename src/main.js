import './style.css';
import { fetchBets, calculateMemberStats, calculateOverallStats, createBet, LEAGUE_MEMBERS, verifyPassword, setPassword, getPassword } from './api.js';

// Auth State - check if we have a stored password
let isAuthenticated = !!getPassword();

// App State
let currentView = 'dashboard';
let bets = [];
let memberStats = [];
let overallStats = {};
let statusFilter = 'all';
let showNewBetModal = false;
let isSubmitting = false;

// DOM Elements
const app = document.getElementById('app');

// Format currency
function formatCurrency(amount) {
  return `€${amount.toFixed(2)}`;
}

// Format date
function formatDate(date) {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Get initials from name
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Render Header
function renderHeader() {
  return `
    <header class="header">
      <div class="header__inner">
        <div class="header__brand">
          <span class="header__logo">🏀</span>
          <span class="header__title">Bookie of the Year</span>
        </div>
        <nav class="header__nav">
          <button class="nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
            Dashboard
          </button>
          <button class="nav-btn ${currentView === 'bets' ? 'active' : ''}" data-view="bets">
            All Bets
          </button>
          <button class="nav-btn ${currentView === 'members' ? 'active' : ''}" data-view="members">
            Members
          </button>
          <button class="nav-btn nav-btn--primary" id="newBetBtn">
            + New Bet
          </button>
          <button class="nav-btn" id="logoutBtn" title="Logout">
            🚪
          </button>
        </nav>
      </div>
    </header>
  `;
}

// Render Login Screen
function renderLoginScreen() {
  return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-card__header">
          <span class="login-card__logo">🏀</span>
          <h1 class="login-card__title">Bookie of the Year</h1>
          <p class="login-card__subtitle">Fantasy Basketball Betting</p>
        </div>
        <form class="login-form" id="loginForm">
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" placeholder="Enter password" required autofocus />
          </div>
          <div class="login-error" id="loginError" style="display: none;">
            Invalid password
          </div>
          <button type="submit" class="btn btn--primary btn--full">
            🎲 Enter the Game
          </button>
        </form>
      </div>
    </div>
  `;
}

// Render Stats Cards
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

// Render Leaderboard
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
      <div class="leaderboard__item">
        <div class="leaderboard__rank ${rankClass}">${rank}</div>
        <div class="leaderboard__name">${member.name}</div>
        <div class="leaderboard__stats">${member.wins}W - ${member.losses}L (${member.winRate}%)</div>
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

// Render Bet Card
function renderBetCard(bet) {
  const statusClass = `bet-card__status--${bet.status}`;
  const statusLabel = bet.status.charAt(0).toUpperCase() + bet.status.slice(1);

  const isWinner1 = bet.winnerName === bet.better1;
  const isWinner2 = bet.winnerName === bet.better2;

  const side1Class = isWinner1 ? 'bet-card__side--winner' : (isWinner2 ? 'bet-card__side--loser' : '');
  const side2Class = isWinner2 ? 'bet-card__side--winner' : (isWinner1 ? 'bet-card__side--loser' : '');

  const cardClass = isWinner1 ? 'bet-card--winner-1' : (isWinner2 ? 'bet-card--winner-2' : '');

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
    </div>
  `;
}

// Render Filters
function renderFilters() {
  return `
    <div class="filters">
      <button class="filter-btn ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-btn ${statusFilter === 'active' ? 'active' : ''}" data-filter="active">🟢 Active</button>
      <button class="filter-btn ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">✅ Paid</button>
      <button class="filter-btn ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">⏳ Pending</button>
    </div>
  `;
}

// Render Bets List
function renderBetsList() {
  const filteredBets = statusFilter === 'all'
    ? bets
    : bets.filter(b => b.status === statusFilter);

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

// Render Member Card
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

// Render Members View
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

// Render Dashboard View
function renderDashboardView() {
  return `
    ${renderStatsCards()}
    ${renderLeaderboard()}
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🔥</span> Recent Bets</h2>
      </div>
      <div class="bets-grid">
        ${bets.slice(0, 5).map(bet => renderBetCard(bet)).join('')}
      </div>
    </section>
  `;
}

// Render All Bets View
function renderAllBetsView() {
  return `
    <section class="section">
      <div class="section__header">
        <h2 class="section__title"><span>🎲</span> All Bets</h2>
      </div>
      ${renderFilters()}
      ${renderBetsList()}
    </section>
  `;
}

// Render All Members View
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

// Render Loading State
function renderLoading() {
  return `
    <div class="loading">
      <div class="loading__spinner"></div>
      <p>Loading bets...</p>
    </div>
  `;
}

// Render New Bet Modal
function renderNewBetModal() {
  if (!showNewBetModal) return '';

  const memberOptions = LEAGUE_MEMBERS.map(m => `<option value="${m}">${m}</option>`).join('');

  return `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">🎲 New Bet</h2>
          <button class="modal__close" id="closeModalBtn">&times;</button>
        </div>
        <form class="modal__form" id="newBetForm">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Better 1</label>
              <select class="form-select" name="better1" required>
                <option value="">Select member...</option>
                ${memberOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Better 2</label>
              <select class="form-select" name="better2" required>
                <option value="">Select member...</option>
                ${memberOptions}
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Better 1's Bet</label>
              <textarea class="form-textarea" name="better1Bet" placeholder="e.g. Knicks win the championship" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Better 2's Bet</label>
              <textarea class="form-textarea" name="better2Bet" placeholder="e.g. Knicks don't win the championship" required></textarea>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Better 1 Stakes (€)</label>
              <input type="number" class="form-input" name="better1Reward" min="1" step="0.01" placeholder="20.00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Better 2 Stakes (€)</label>
              <input type="number" class="form-input" name="better2Reward" min="1" step="0.01" placeholder="20.00" required />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" id="cancelBetBtn">Cancel</button>
            <button type="submit" class="btn btn--primary" ${isSubmitting ? 'disabled' : ''}>
              ${isSubmitting ? 'Submitting...' : '🎯 Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Main Render Function
function render() {
  let mainContent = '';

  switch (currentView) {
    case 'dashboard':
      mainContent = renderDashboardView();
      break;
    case 'bets':
      mainContent = renderAllBetsView();
      break;
    case 'members':
      mainContent = renderAllMembersView();
      break;
  }

  app.innerHTML = `
    ${renderHeader()}
    <main class="main">
      ${mainContent}
    </main>
    ${renderNewBetModal()}
  `;

  // Attach event listeners
  attachEventListeners();
}

// Handle form submission
async function handleNewBetSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const betData = {
    better1: formData.get('better1'),
    better2: formData.get('better2'),
    better1Bet: formData.get('better1Bet'),
    better2Bet: formData.get('better2Bet'),
    better1Reward: parseFloat(formData.get('better1Reward')),
    better2Reward: parseFloat(formData.get('better2Reward'))
  };

  // Validate different bettors
  if (betData.better1 === betData.better2) {
    alert('Please select two different members for the bet!');
    return;
  }

  isSubmitting = true;
  render();

  try {
    await createBet(betData);
    showNewBetModal = false;
    isSubmitting = false;

    // Refresh bets
    bets = await fetchBets();
    memberStats = calculateMemberStats(bets);
    overallStats = calculateOverallStats(bets);
    render();

  } catch (error) {
    isSubmitting = false;
    alert('Failed to create bet: ' + error.message);
    render();
  }
}

// Attach Event Listeners
function attachEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn:not(#newBetBtn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      if (view && view !== currentView) {
        currentView = view;
        render();
      }
    });
  });

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      if (filter && filter !== statusFilter) {
        statusFilter = filter;
        render();
      }
    });
  });

  // New Bet Button
  const newBetBtn = document.getElementById('newBetBtn');
  if (newBetBtn) {
    newBetBtn.addEventListener('click', () => {
      showNewBetModal = true;
      render();
    });
  }

  // Modal controls
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBetBtn = document.getElementById('cancelBetBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const newBetForm = document.getElementById('newBetForm');

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      showNewBetModal = false;
      render();
    });
  }

  if (cancelBetBtn) {
    cancelBetBtn.addEventListener('click', () => {
      showNewBetModal = false;
      render();
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        showNewBetModal = false;
        render();
      }
    });
  }

  if (newBetForm) {
    newBetForm.addEventListener('submit', handleNewBetSubmit);
  }

  // Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const password = formData.get('password');

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = 'Verifying...';
  submitBtn.disabled = true;

  try {
    const valid = await verifyPassword(password);

    if (valid) {
      isAuthenticated = true;
      init(); // Reload the app
    } else {
      const errorEl = document.getElementById('loginError');
      if (errorEl) {
        errorEl.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.textContent = 'Connection error. Please try again.';
      errorEl.style.display = 'block';
    }
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Handle Logout
function handleLogout() {
  isAuthenticated = false;
  setPassword(''); // Clear password from api.js
  init(); // Show login screen
}

// Initialize App
async function init() {
  // Check authentication first
  if (!isAuthenticated) {
    app.innerHTML = renderLoginScreen();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    return;
  }

  app.innerHTML = `
    ${renderHeader()}
    <main class="main">
      ${renderLoading()}
    </main>
  `;

  try {
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
          <p>Failed to load betting data</p>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">
            Make sure your Google Sheet is published to the web
          </p>
        </div>
      </main>
    `;
  }
}

// Start the app
init();

