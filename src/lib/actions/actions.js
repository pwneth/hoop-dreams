import * as api from '../../api/api.js';
import { getState, setState, setBets, setMemberStats, setOverallStats } from '../store/store.js';
import { formatCurrency } from '../utils/utils.js';
import { triggerConfetti } from '../confetti/confetti.js';
import { login, register, changePassword } from '../auth/auth.js';

export async function refreshData() {
    await api.fetchUsers();
    const bets = await api.fetchBets();
    const memberStats = api.calculateMemberStats(bets);
    const overallStats = api.calculateOverallStats(bets);

    setState({ bets, memberStats, overallStats, dataLoaded: true });
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

        // Refresh data immediately so the new bet appears
        await refreshData();

        // Auto close modal after brief success display
        setTimeout(() => {
            setState({ submitSuccess: false, showNewBetModal: false });

            // Highlight the new row
            const firstRow = document.querySelector('.bet-table__row');
            if (firstRow) {
                firstRow.classList.add('bet-table__row--new');
                setTimeout(() => firstRow.classList.remove('bet-table__row--new'), 2000);
            }
        }, 1500);

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

        await refreshData();
        setState({ showResolveModal: false, resolveBetId: null, resolveIsSubmitting: false, showBetActionModal: null });

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

        await refreshData();
        setState({ resolveBetId: null, resolveIsSubmitting: false, showBetActionModal: null });

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

        await refreshData();
        setState({ resolveBetId: null, resolveIsSubmitting: false, showBetActionModal: null });

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
        await Promise.all([refreshData(), loadUserSettings()]);

        // Show onboarding for new users, settings prompt for existing users without PayPal
        const { userPaypal } = getState();
        if (authMode === 'register') {
          setState({ showOnboardingModal: true });
        } else if (!userPaypal) {
          setState({ showSettingsModal: true });
        }

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

// --- Bracket Actions ---

// Advancement maps for backfill team name resolution
const BACKFILL_ADV = {
  west_playin_1: ['west_r1_4', 'bottom'], east_playin_1: ['east_r1_4', 'bottom'],
  west_playin_3: ['west_r1_1', 'bottom'], east_playin_3: ['east_r1_1', 'bottom'],
  west_r1_1: ['west_r2_1', 'top'], west_r1_2: ['west_r2_1', 'bottom'],
  west_r1_3: ['west_r2_2', 'top'], west_r1_4: ['west_r2_2', 'bottom'],
  east_r1_1: ['east_r2_1', 'top'], east_r1_2: ['east_r2_1', 'bottom'],
  east_r1_3: ['east_r2_2', 'top'], east_r1_4: ['east_r2_2', 'bottom'],
  west_r2_1: ['west_r3_1', 'top'], west_r2_2: ['west_r3_1', 'bottom'],
  east_r2_1: ['east_r3_1', 'top'], east_r2_2: ['east_r3_1', 'bottom'],
  west_r3_1: ['finals', 'top'], east_r3_1: ['finals', 'bottom']
};
const BACKFILL_PLAYIN = {
  west_playin_1: ['west_playin_3', 'top', 'loser'], east_playin_1: ['east_playin_3', 'top', 'loser'],
  west_playin_2: ['west_playin_3', 'bottom', 'winner'], east_playin_2: ['east_playin_3', 'bottom', 'winner']
};

function buildExpectedTeamMap(matchups, picks) {
  // Build user's expected bracket from clean base + user picks only
  const pickMap = {};
  picks.forEach(p => { pickMap[p.matchupId] = p.pick; });

  const projected = matchups.map(m => ({ ...m, teamTop: m.teamTop || '', teamBottom: m.teamBottom || '' }));
  // Clear propagated slots
  projected.forEach(m => {
    if (m.matchupId.endsWith('_r1_1')) m.teamBottom = '';
    if (m.matchupId.endsWith('_r1_4')) m.teamBottom = '';
    if (m.matchupId.endsWith('_playin_3')) { m.teamTop = ''; m.teamBottom = ''; }
    if (['r2', 'r3', 'finals'].includes(m.round)) { m.teamTop = ''; m.teamBottom = ''; }
    m.winner = '';
  });

  const byId = {};
  projected.forEach(m => { byId[m.matchupId] = m; });

  const rounds = ['playin', 'r1', 'r2', 'r3'];
  for (const round of rounds) {
    for (const m of projected) {
      if (m.round !== round) continue;
      const pick = pickMap[m.matchupId];
      if (!pick) continue;
      const winnerTeam = pick === 'top' ? m.teamTop : m.teamBottom;
      const loserTeam = pick === 'top' ? m.teamBottom : m.teamTop;

      const pf = BACKFILL_PLAYIN[m.matchupId];
      if (pf) {
        const t = byId[pf[0]];
        if (t) {
          const team = pf[2] === 'winner' ? winnerTeam : loserTeam;
          if (team && pf[1] === 'top' && !t.teamTop) t.teamTop = team;
          if (team && pf[1] === 'bottom' && !t.teamBottom) t.teamBottom = team;
        }
      }

      const adv = BACKFILL_ADV[m.matchupId];
      if (adv && winnerTeam) {
        const t = byId[adv[0]];
        if (t) {
          if (adv[1] === 'top' && !t.teamTop) t.teamTop = winnerTeam;
          if (adv[1] === 'bottom' && !t.teamBottom) t.teamBottom = winnerTeam;
        }
      }
    }
  }

  // Build map: "matchupId:pick" -> teamName
  const teamMap = {};
  for (const m of projected) {
    if (m.teamTop) teamMap[m.matchupId + ':top'] = m.teamTop;
    if (m.teamBottom) teamMap[m.matchupId + ':bottom'] = m.teamBottom;
  }
  return teamMap;
}

export async function refreshBracketData() {
  setState({ bracketLoading: true });
  try {
    const { matchups, picks, scores, buyIn } = await api.fetchBracket();
    setState({ bracketMatchups: matchups, bracketPicks: picks, bracketScores: scores, bracketBuyIn: buyIn, bracketLoading: false });

    // Backfill pickedTeam for any picks that are missing or incorrect
    if (picks.length > 0) {
      const teamMap = buildExpectedTeamMap(matchups, picks);
      // Check if any picks need updating
      const needsBackfill = picks.some(p => {
        const key = p.matchupId + ':' + p.pick;
        return teamMap[key] && teamMap[key] !== p.pickedTeam;
      });
      if (needsBackfill) {
        await api.backfillPickedTeams(teamMap);
        const updated = await api.fetchBracket();
        setState({ bracketMatchups: updated.matchups, bracketPicks: updated.picks, bracketScores: updated.scores, bracketBuyIn: updated.buyIn });
      }
    }
  } catch (error) {
    console.error('Failed to load bracket:', error);
    setState({ bracketLoading: false });
  }
}

export function stageUserPick(matchupId, pick, games, pickedTeam) {
  const { bracketStagedPicks } = getState();
  setState({
    bracketStagedPicks: {
      ...bracketStagedPicks,
      [matchupId]: { pick, games: games ? Number(games) : null, pickedTeam: pickedTeam || '' }
    },
    bracketPendingPick: null
  });
}

export async function handleSaveAllPicks() {
  const { bracketStagedPicks } = getState();
  const entries = Object.entries(bracketStagedPicks);
  if (entries.length === 0) return;

  const picks = entries.map(([matchupId, { pick, games, pickedTeam }]) => ({ matchupId, pick, games, pickedTeam }));

  setState({ bracketSaving: true });
  try {
    await api.batchSubmitPicks(picks);
    const { matchups, picks: serverPicks, scores, buyIn } = await api.fetchBracket();
    setState({ bracketMatchups: matchups, bracketPicks: serverPicks, bracketScores: scores, bracketBuyIn: buyIn, bracketStagedPicks: {}, bracketSaving: false });
  } catch (error) {
    setState({ bracketSaving: false });
    alert('Failed to save picks: ' + error.message);
  }
}

export function stageAdminChange(matchupId, updates) {
  const { bracketAdminChanges } = getState();
  const existing = bracketAdminChanges[matchupId] || {};
  setState({
    bracketAdminChanges: {
      ...bracketAdminChanges,
      [matchupId]: { ...existing, ...updates }
    }
  });
}

export async function handleAdminSaveAll() {
  const { bracketAdminChanges } = getState();
  const entries = Object.entries(bracketAdminChanges);
  if (entries.length === 0) return;

  const updates = entries.map(([matchupId, changes]) => ({ matchupId, ...changes }));

  setState({ bracketSaving: true });
  try {
    await api.batchUpdateMatchups(updates);
    const { matchups, picks, scores, buyIn } = await api.fetchBracket();
    setState({ bracketMatchups: matchups, bracketPicks: picks, bracketScores: scores, bracketBuyIn: buyIn, bracketAdminChanges: {}, bracketSaving: false });
  } catch (error) {
    setState({ bracketSaving: false });
    alert('Failed to save changes: ' + error.message);
  }
}

export async function fetchAndPopulateStandings() {
  setState({ bracketSaving: true });
  try {
    const response = await fetch('https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?region=us&lang=en&contentorigin=espn&type=0&level=2&sort=playoffSeed:asc');
    const data = await response.json();

    if (!data.children || data.children.length < 2) {
      throw new Error('Unexpected standings data format');
    }

    // ESPN returns conferences — find east and west
    const conferences = {};
    data.children.forEach(conf => {
      const name = conf.abbreviation || conf.name || '';
      if (name.toLowerCase().includes('east') || conf.name?.toLowerCase().includes('eastern')) {
        conferences.east = conf;
      } else if (name.toLowerCase().includes('west') || conf.name?.toLowerCase().includes('western')) {
        conferences.west = conf;
      }
    });

    if (!conferences.east || !conferences.west) {
      throw new Error('Could not identify conferences');
    }

    // Extract team entries sorted by playoff seed
    function getSeededTeams(confData) {
      const entries = confData.standings?.entries || [];
      return entries
        .map(entry => ({
          name: entry.team?.name || '',
          abbr: entry.team?.abbreviation || '',
          seed: entry.stats?.find(s => s.name === 'playoffSeed')?.value || 99
        }))
        .sort((a, b) => a.seed - b.seed);
    }

    const westTeams = getSeededTeams(conferences.west);
    const eastTeams = getSeededTeams(conferences.east);

    // Map seeds to matchups and stage as admin changes
    // Seed mapping:
    // Play-in: 7v8 (playin_1), 9v10 (playin_2)
    // R1: 1v8 (r1_1), 4v5 (r1_2), 3v6 (r1_3), 2v7 (r1_4)
    function mapConference(conf, teams) {
      const changes = {};
      const t = (seed) => teams[seed - 1]?.name || '';

      // Play-in
      changes[`${conf}_playin_1`] = { teamTop: t(7), teamBottom: t(8) };
      changes[`${conf}_playin_2`] = { teamTop: t(9), teamBottom: t(10) };

      // R1 — seeds 1-6 are set, 7 and 8 come from play-in so leave them
      changes[`${conf}_r1_1`] = { teamTop: t(1) };
      changes[`${conf}_r1_2`] = { teamTop: t(4), teamBottom: t(5) };
      changes[`${conf}_r1_3`] = { teamTop: t(3), teamBottom: t(6) };
      changes[`${conf}_r1_4`] = { teamTop: t(2) };

      return changes;
    }

    const westChanges = mapConference('west', westTeams);
    const eastChanges = mapConference('east', eastTeams);

    // Merge into admin staged changes
    const { bracketAdminChanges } = getState();
    const merged = { ...bracketAdminChanges };
    for (const [id, updates] of Object.entries({ ...westChanges, ...eastChanges })) {
      merged[id] = { ...(merged[id] || {}), ...updates };
    }

    setState({ bracketAdminChanges: merged, bracketSaving: false });
  } catch (error) {
    setState({ bracketSaving: false });
    alert('Failed to fetch standings: ' + error.message);
  }
}

export async function handleSetBracketBuyIn(buyIn) {
  setState({ bracketSaving: true });
  try {
    await api.adminSetBracketConfig({ buyIn });
    setState({ bracketBuyIn: Number(buyIn), bracketSaving: false });
  } catch (error) {
    setState({ bracketSaving: false });
    alert('Failed to set buy-in: ' + error.message);
  }
}

export async function loadUserSettings() {
  try {
    const [settings, allData] = await Promise.all([
      api.getUserSettings(),
      api.getAllPayPals()
    ]);
    setState({
      userPaypal: settings.paypal || '',
      userEmail: settings.email || '',
      userAvatar: settings.avatar || '',
      allPaypals: allData.paypals || {},
      allAvatars: allData.avatars || {}
    });
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

export async function handleOnboardingSave(name, paypal, avatar) {
  try {
    // Update name if changed
    const { currentUser } = getState();
    if (name && name !== currentUser.username) {
      await api.updateDisplayName(name);
      setState({ currentUser: { ...currentUser, username: name } });
    }
    // Save settings
    await api.saveUserSettings({ paypal: paypal || '', avatar: avatar || '' });
    const allData = await api.getAllPayPals();
    setState({
      userPaypal: paypal || '',
      userAvatar: avatar || '',
      allPaypals: allData.paypals || {},
      allAvatars: allData.avatars || {},
      showOnboardingModal: false
    });
    await refreshData();
  } catch (error) {
    alert('Failed to save: ' + error.message);
  }
}

export async function handleSaveSettings(settings) {
  try {
    await api.saveUserSettings(settings);
    const allData = await api.getAllPayPals();
    setState({
      userPaypal: settings.paypal !== undefined ? settings.paypal : getState().userPaypal,
      userEmail: settings.email !== undefined ? settings.email : getState().userEmail,
      userAvatar: settings.avatar !== undefined ? settings.avatar : getState().userAvatar,
      allPaypals: allData.paypals || {},
      allAvatars: allData.avatars || {},
      showSettingsModal: false
    });
  } catch (error) {
    alert('Failed to save: ' + error.message);
    setState({ showSettingsModal: true });
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
