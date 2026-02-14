import { getCurrentUser } from '../../api/api.js';

// Initial state
const initialState = {
    // Current User
    currentUser: getCurrentUser(),
    authMode: 'login',

    // View State
    currentView: 'dashboard',

    // Data State
    bets: [],
    memberStats: [],
    overallStats: {},

    // Filter State
    statusFilter: 'all',
    bettorFilter: 'all',

    // UI State
    showNewBetModal: false,
    showChangePasswordModal: false,

    // Action States
    isSubmitting: false,
    submitSuccess: false,
    showResolveModal: false,
    resolveBetId: null,
    resolveIsSubmitting: false,

    // Confirmation States
    confirmingResolution: null,
    confirmingPaymentId: null,
    confirmingBetId: null,

    // Theme (Locked to Dark)
    isDarkMode: true
};

let state = { ...initialState };
const listeners = new Set();

// Ensure dark mode is set on init
document.documentElement.setAttribute('data-theme', 'dark');

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

export function getPendingBets() {
    const { bets, currentUser } = state;
    if (!currentUser || !bets) return [];

    return bets.filter(bet => {
        // Must be participant
        if (bet.better1 !== currentUser.username && bet.better2 !== currentUser.username) return false;

        // Waiting for confirmation (only opponent can confirm)
        if (bet.status === 'confirming') {
            if (bet.better2 === currentUser.username) return true;
        }

        const isWaitingForWinner = !bet.winnerLabel && bet.status !== 'confirming';
        const isWaitingForPayment = !!bet.winnerLabel && bet.status !== 'paid';

        // Waiting for resolution verification
        if (isWaitingForWinner) {
            // If someone proposed and it wasn't me, I need to act
            if (bet.proposerWinner && bet.proposerWinner !== currentUser.username) return true;
        }

        // Waiting for payment verification
        else if (isWaitingForPayment) {
            // If someone proposed and it wasn't me, I need to act
            if (bet.proposerPaid && bet.proposerPaid !== currentUser.username) return true;
        }

        return false;
    });
}

export function getPendingActionCount() {
    return getPendingBets().length;
}
