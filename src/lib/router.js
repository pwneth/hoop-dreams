import { setCurrentView } from './store.js';

const BASE_URL = import.meta.env.BASE_URL || '/';

export function navigateTo(path) {
    const normalizedBase = BASE_URL === '/' ? '' : BASE_URL.replace(/\/$/, '');
    const target = normalizedBase + path;
    window.history.pushState({}, '', target);
    handleRoute();
}

export function handleRoute() {
    const path = window.location.pathname;
    const normalizedBase = BASE_URL === '/' ? '' : BASE_URL.replace(/\/$/, '');

    let internalPath = path;
    if (path.startsWith(normalizedBase)) {
        internalPath = path.substring(normalizedBase.length);
    }

    // Remove trailing slash if not root
    if (internalPath.length > 1 && internalPath.endsWith('/')) {
        internalPath = internalPath.slice(0, -1);
    }

    let view = 'dashboard';
    if (internalPath === '/' || internalPath === '/dashboard' || internalPath === '') {
        view = 'dashboard';
    } else if (internalPath === '/my-bets') {
        view = 'my-bets';
    } else if (internalPath === '/bets') {
        view = 'bets';
    } else if (internalPath === '/members') {
        view = 'members';
    } else {
        // Default route
        view = 'dashboard';
        // Optionally replace state to clean URL if completely unknown?
        // For now we just default to dashboard
    }

    setCurrentView(view);
    window.scrollTo(0, 0);
}
