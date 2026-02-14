import './styles/main.css';
import {
  getState,
  subscribe,
  setStatusFilter,
  setBettorFilter,
  setState
} from './lib/store/store.js';
import { navigateTo, handleRoute } from './lib/router/router.js';
import { logout } from './lib/auth/auth.js';
import { handleNewBetSubmit, handleResolveBet, handleConfirmBet, handleResolvePayment, handleAuthSubmit, handleChangePasswordSubmit, refreshData } from './lib/actions/actions.js';

// Views
import { renderDashboardView } from './views/Dashboard/Dashboard.js';
import { renderMyBetsView } from './views/MyBets/MyBets.js';
import { renderAllBetsView } from './views/AllBets/AllBets.js';
import { renderMembersView } from './views/Members/Members.js';

// Components
import { renderHeader, renderMobileNav } from './components/Header/Header.js';
import { renderLoginScreen } from './components/Login/Login.js';
import { renderNewBetModal, renderChangePasswordModal } from './components/Modals/Modals.js';
import { renderLoading } from './components/Loader/Loader.js';

const app = document.getElementById('app');

// ==========================================
// RENDER
// ==========================================

function render(target = 'all') {
  const state = getState();
  const { currentView, showNewBetModal, isSubmitting, submitSuccess, showChangePasswordModal, currentUser } = state;

  // If not logged in, show login screen
  if (!currentUser) {
    if (app.innerHTML !== renderLoginScreen()) {
      app.innerHTML = renderLoginScreen();
      attachLoginListeners();
    }
    return;
  }

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
      mainContent = renderMembersView();
      break;
    default:
      mainContent = renderDashboardView();
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

  // Modals
  if (target === 'all' || target === 'modals') {
    const modalsEl = document.getElementById('modals');
    // If we have a modals container in index.html (we do)
    if (modalsEl) {
      if (showNewBetModal) {
        // Check if already rendered to avoid input lose?
        // For now unconditional re-render or smart update
        // Smart update for modals to keep form state while submitting
        const existingOverlay = document.getElementById('modalOverlay');
        if (existingOverlay) {
          existingOverlay.classList.toggle('is-loading', isSubmitting);
          existingOverlay.classList.toggle('is-success', submitSuccess);
          const submitBtn = existingOverlay.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            submitBtn.textContent = isSubmitting ? 'Submitting...' : 'Place Bet';
          }
        } else {
          modalsEl.innerHTML = renderNewBetModal();
        }
      } else if (showChangePasswordModal) {
        modalsEl.innerHTML = renderChangePasswordModal();
      } else {
        modalsEl.innerHTML = '';
      }
    }
  }

  attachEventListeners();
}

// Subscribe to store changes
subscribe(() => {
  // Determine what to re-render based on state changes if needed
  // For now, full re-render is safe enough for this size app
  // We can optimize 'modals' vs 'app' later if key is passed
  render();
});

// ==========================================
// LISTENERS
// ==========================================

function attachLoginListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAuthSubmit);
  }
}

// Global listener for auth mode change
window.addEventListener('auth-mode-changed', attachLoginListeners);

function attachEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn[data-path]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent bubbling issues
      const path = e.target.closest('.nav-btn').dataset.path;
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

  // Mobile Menu
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');

  if (hamburgerBtn && mainNav && navOverlay) {
    function toggleMenu(e) {
      e.stopPropagation();
      mainNav.classList.toggle('active');
      navOverlay.classList.toggle('active');
      hamburgerBtn.innerHTML = mainNav.classList.contains('active') ? '✕' : '☰';
    }
    // Use onclick to avoid duplicate listeners on re-render
    hamburgerBtn.onclick = toggleMenu;
    navOverlay.onclick = toggleMenu;
  }

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      setStatusFilter(filter);
    });
  });

  const bettorFilterSelect = document.getElementById('bettorFilterSelect');
  if (bettorFilterSelect) {
    bettorFilterSelect.onchange = (e) => {
      setBettorFilter(e.target.value);
    };
  }

  // Modals Triggers
  document.querySelectorAll('.js-new-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ showNewBetModal: true });
    });
  });

  document.querySelectorAll('.js-logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      logout();
      navigateTo('/');
    });
  });

  document.querySelectorAll('.js-change-pw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ showChangePasswordModal: true });
    });
  });


  const dashNewBetBtn = document.getElementById('dashNewBetBtn');
  if (dashNewBetBtn) dashNewBetBtn.onclick = () => setState({ showNewBetModal: true });

  const toastViewBtn = document.getElementById('toastViewBtn');
  if (toastViewBtn) toastViewBtn.onclick = () => navigateTo('/my-bets');

  // Modals Actions
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBetBtn = document.getElementById('cancelBetBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const newBetForm = document.getElementById('newBetForm');

  if (closeModalBtn) closeModalBtn.onclick = () => setState({ showNewBetModal: false });
  if (cancelBetBtn) cancelBetBtn.onclick = () => setState({ showNewBetModal: false });
  if (modalOverlay) modalOverlay.onclick = (e) => { if (e.target === modalOverlay) setState({ showNewBetModal: false }); };
  if (newBetForm) {
    // Avoid duplicate submission if re-attached
    newBetForm.onsubmit = handleNewBetSubmit;
  }

  const closePwBtn = document.getElementById('closePwModalBtn');
  const cancelPwBtn = document.getElementById('cancelPwBtn');
  const pwOverlay = document.getElementById('pwModalOverlay');
  const pwForm = document.getElementById('changePwForm');

  if (closePwBtn) closePwBtn.onclick = () => setState({ showChangePasswordModal: false });
  if (cancelPwBtn) cancelPwBtn.onclick = () => setState({ showChangePasswordModal: false });
  if (pwOverlay) pwOverlay.onclick = (e) => { if (e.target === pwOverlay) setState({ showChangePasswordModal: false }); };
  if (pwForm) pwForm.onsubmit = handleChangePasswordSubmit;

  // User Dropdown
  const userDropdownTrigger = document.getElementById('userDropdownTrigger');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  if (userDropdownTrigger && userDropdownMenu) {
    userDropdownTrigger.onclick = (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('active');
    };
  }
}

// Global Delegated Listeners (attached once)
if (app) {
  app.onclick = (e) => {
    // Leaderboard Click
    const leaderboardItem = e.target.closest('.leaderboard__item');
    if (leaderboardItem) {
      setStatusFilter('all');
      setBettorFilter(leaderboardItem.dataset.bettor);
      navigateTo('/bets');
      return;
    }

    // Resolve Winner
    const winnerBtn = e.target.closest('.resolve-winner-btn');
    if (winnerBtn) {
      const winner = winnerBtn.dataset.winner;
      const betId = winnerBtn.dataset.id;
      setState({ confirmingResolution: { id: betId, winner: winner } });
    }

    // Confirm Resolution
    if (e.target.matches('.confirm-resolve-btn')) {
      const { confirmingResolution } = getState();
      if (confirmingResolution) {
        setState({ resolveBetId: confirmingResolution.id, confirmingResolution: null });
        handleResolveBet(confirmingResolution.winner);
      }
    }

    // Cancel Resolution
    if (e.target.closest('.cancel-resolve-btn')) {
      setState({ confirmingResolution: null });
    }

    // Confirm Bet Action
    const confirmBetBtn = e.target.closest('.js-start-confirm-bet');
    if (confirmBetBtn) {
      setState({ confirmingBetId: confirmBetBtn.dataset.id });
    }

    const confirmActionBtn = e.target.closest('.js-confirm-bet-action');
    if (confirmActionBtn) {
      const betId = confirmActionBtn.dataset.id;
      const action = confirmActionBtn.dataset.action;
      setState({ confirmingBetId: null });
      handleConfirmBet(betId, action);
    }

    if (e.target.closest('.js-cancel-confirm-bet')) {
      setState({ confirmingBetId: null });
    }

    // Resolve Payment
    if (e.target.matches('.resolve-payment-btn')) {
      setState({ confirmingPaymentId: e.target.dataset.id });
    }

    // Confirm Payment
    if (e.target.matches('.confirm-payment-btn')) {
      const { confirmingPaymentId } = getState();
      if (confirmingPaymentId) {
        const betId = confirmingPaymentId;
        setState({ confirmingPaymentId: null });
        handleResolvePayment(betId);
      }
    }

    // Cancel Payment
    if (e.target.matches('.cancel-payment-btn')) {
      setState({ confirmingPaymentId: null });
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

// ==========================================
// INIT
// ==========================================

async function init() {
  window.addEventListener('popstate', handleRoute);

  const { currentUser } = getState();
  if (currentUser) {
    // Render initial shell with skeleton loader
    app.innerHTML = `
      <div class="nav-overlay" id="navOverlay"></div>
      ${renderMobileNav()}
      ${renderHeader()}
      <main class="main">
        ${renderLoading()}
      </main>
    `;
    attachEventListeners();

    try {
      await refreshData();
      handleRoute(); // Set initial view
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load betting data. Please try again.');
    }
  } else {
    render();
  }
}

init();
