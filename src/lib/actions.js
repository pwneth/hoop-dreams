import * as api from '../api/api.js';
import { getState, setState, setBets, setMemberStats, setOverallStats } from './store.js';
import { formatCurrency } from './utils.js';
import { triggerConfetti } from './confetti.js';
import { login, register, changePassword } from './auth.js';

export async function refreshData() {
    const bets = await api.fetchBets();
    const memberStats = api.calculateMemberStats(bets);
    const overallStats = api.calculateOverallStats(bets);

    setState({ bets, memberStats, overallStats });
}

export async function handleNewBetSubmit(e) {
    e.preventDefault();
    const { currentUser } = getState();
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

    setState({ isSubmitting: true });

    try {
        await api.createBet(betData);
        setState({ submitSuccess: true, isSubmitting: false });
        triggerConfetti('dice');

        // Auto close modal after delay
        setTimeout(async () => {
            setState({ submitSuccess: false, showNewBetModal: false });

            await refreshData();

            const newBetCard = document.querySelector('.bet-card');
            if (newBetCard) {
                newBetCard.classList.add('animate-new-bet');
            }
        }, 3000);

    } catch (error) {
        setState({ isSubmitting: false });
        const errorEl = document.getElementById('newBetError');
        if (errorEl) {
            errorEl.textContent = 'Failed to create bet: ' + error.message;
            errorEl.style.display = 'block';
        }
    }
}

export async function handleResolveBet(winnerKey) {
    const { resolveBetId, bets, currentUser } = getState();
    if (!resolveBetId && resolveBetId !== 0) return;

    setState({ resolveIsSubmitting: true });

    try {
        const bet = bets.find(b => b.id == resolveBetId);
        await api.updateBet(resolveBetId, winnerKey);

        const winnerName = winnerKey.toLowerCase() === 'better1' ? bet.better1 : bet.better2;
        if (winnerName === currentUser.username) {
            triggerConfetti('happy');
        } else {
            triggerConfetti('sad');
        }

        setState({
            showResolveModal: false,
            resolveBetId: null,
            resolveIsSubmitting: false
        });

        await refreshData();

    } catch (error) {
        setState({ resolveIsSubmitting: false });
        alert('Failed to update bet: ' + error.message);
    }
}

export async function handleConfirmBet(betId, confirmAction) {
    setState({ resolveBetId: betId, resolveIsSubmitting: true });

    try {
        await api.confirmBet(betId, confirmAction);

        if (confirmAction === 'confirm') {
            triggerConfetti('dice');
        }

        setState({
            resolveBetId: null,
            resolveIsSubmitting: false
        });

        await refreshData();

    } catch (error) {
        setState({ resolveIsSubmitting: false });
        alert('Failed to ' + confirmAction + ' bet: ' + error.message);
    }
}

export async function handleResolvePayment(betId) {
    const { bets, currentUser } = getState();
    setState({ resolveBetId: betId, resolveIsSubmitting: true });

    try {
        await api.markBetAsPaid(betId);

        const bet = bets.find(b => b.id == betId);
        if (bet && bet.winnerName === currentUser.username) {
            triggerConfetti('happy');
        }

        setState({
            resolveBetId: null,
            resolveIsSubmitting: false
        });

        await refreshData();

    } catch (error) {
        setState({ resolveIsSubmitting: false });
        alert('Failed to mark as paid: ' + error.message);
    }
}

export async function handleAuthSubmit(e) {
    e.preventDefault();
    const { authMode } = getState();
    const formData = new FormData(e.target);
    let username = formData.get('username') ? formData.get('username').trim() : '';

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
        // Auth successful, store updates automatically via auth.js
        // We might need to trigger init or refresh?
        // main.js subscription will handle re-render, but data fetch needs to happen.
        await refreshData();

        // We can navigate to dashboard implicitly
        // But init logic usually handles data fetch.

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

export async function handleChangePasswordSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const oldPassword = formData.get('oldPassword');
    const newPassword = formData.get('newPassword');
    const errorEl = document.getElementById('pwError');

    if (errorEl) errorEl.style.display = 'none';

    try {
        await changePassword(oldPassword, newPassword);
        alert('Password changed successfully!');
        setState({ showChangePasswordModal: false });
    } catch (error) {
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
        }
    }
}
