import { getCurrentUser } from '../../api/api.js';

// Initial state
const initialState = {
    currentUser: getCurrentUser(),
    authMode: 'login',
    currentView: 'dashboard',
    bets: [],
    memberStats: [],
    overallStats: {},
    statusFilter: 'all',
    bettorFilter: 'all',

    // UI State
    showNewBetModal: false,
    isSubmitting: false,
    submitSuccess: false,
    showResolveModal: false,
    resolveBetId: null,
    resolveIsSubmitting: false,
    confirmingResolution: null,
    confirmingPaymentId: null,
    confirmingBetId: null,
    showChangePasswordModal: false,

    // Theme State
    isDarkMode: localStorage.getItem('hd_bets_theme') === 'dark'
};

let state = { ...initialState };
const listeners = new Set();
// To allow selective re-rendering if needed, store keys. For now, simple.

export function getState() {
    return state;
}

export function setState(newState) {
    state = { ...state, ...newState };
    notify();
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notify() {
    listeners.forEach(listener => listener(state));
}

// Convenience setters
export function setAuthMode(mode) { setState({ authMode: mode }); }
export function setCurrentView(view) { setState({ currentView: view }); }
export function setBets(bets) { setState({ bets }); }
export function setMemberStats(stats) { setState({ memberStats: stats }); }
export function setOverallStats(stats) { setState({ overallStats: stats }); }
export function setStatusFilter(filter) { setState({ statusFilter: filter }); }
export function setBettorFilter(filter) { setState({ bettorFilter: filter }); }
export function toggleTheme() {
    const newMode = !state.isDarkMode;
    setState({ isDarkMode: newMode });
    localStorage.setItem('hd_bets_theme', newMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
}

// Initialize theme immediately
if (state.isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
} else {
    document.documentElement.setAttribute('data-theme', 'light');
}

export function getPendingBets() {
    const { bets, currentUser } = state;
    if (!currentUser || !bets) return [];

    return bets.filter(bet => {
        if (bet.better1 !== currentUser.username && bet.better2 !== currentUser.username) return false;

        if (bet.status === 'confirming') {
            if (bet.better2 === currentUser.username) return true;
        }

        const isWaitingForWinner = !bet.winnerLabel && bet.status !== 'confirming';
        const isWaitingForPayment = !!bet.winnerLabel && bet.status !== 'paid';

        if (isWaitingForWinner) {
            if (bet.proposerWinner && bet.proposerWinner !== currentUser.username) return true;
        } else if (isWaitingForPayment) {
            if (bet.proposerPaid && bet.proposerPaid !== currentUser.username) return true;
        }
        return false;
    });
}

export function getPendingActionCount() {
    return getPendingBets().length;
}
