import { getState, setState } from '../../lib/store/store.js';
import { renderLoading } from '../../components/Loader/Loader.js';
import { formatCurrency, renderUserTag, getAvatarColor } from '../../lib/utils/utils.js';
import { NBA_TEAMS, getTeamLogo, getTeamByAbbreviation } from '../../data/nbaTeams.js';

const SAVING_MESSAGES = [
  'LOCKING IN YOUR PICK...',
  'CALLING THE PLAY...',
  'SETTING THE LINEUP...',
  'SENDING IT TO THE REFS...',
  'CHECKING THE REPLAY...',
];

function getRandomMessage() {
  return SAVING_MESSAGES[Math.floor(Math.random() * SAVING_MESSAGES.length)];
}

export function renderBracketConfirmModal() {
  const { showBracketConfirmModal, bracketStagedPicks } = getState();
  if (!showBracketConfirmModal) return '';

  const count = Object.keys(bracketStagedPicks).length;

  return `
    <div class="app-modal-overlay">
      <div class="app-modal">
        <div class="app-modal__header">
          <h2 class="app-modal__title">Save your picks?</h2>
          <button class="app-modal__close js-bracket-cancel-save">&times;</button>
        </div>
        <div class="app-modal__body" style="padding: var(--space-lg); text-align: center;">
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-md);">
            You're about to save <strong>${count} pick${count > 1 ? 's' : ''}</strong>.
            You can edit your picks until <strong>Tuesday April 14 at 7:30 PM EST</strong>.
            After that, all picks are locked — even incomplete brackets.
          </p>
          <div class="bracket-confirm__countdown" id="confirmCountdown" data-target="${PICKS_LOCK_DATE.toISOString()}" style="margin-bottom: var(--space-lg);"></div>
          <div style="display: flex; gap: var(--space-md); justify-content: center;">
            <button class="btn btn--secondary js-bracket-cancel-save">Go Back</button>
            <button class="btn btn--primary js-bracket-confirm-save">Save Picks</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderBracketSavingOverlay() {
  const { bracketSaving, currentView } = getState();
  if (!bracketSaving || currentView !== 'bracket') return '';

  return `
    <div class="bracket-saving-overlay">
      <div class="bracket-saving-overlay__content">
        <div class="bracket-saving-overlay__ball">&#127936;</div>
        <p class="bracket-saving-overlay__text">${getRandomMessage()}</p>
        <div class="bracket-saving-overlay__dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
}

// Default NBA Playoff bracket structure (all 21 matchups)
const DEFAULT_BRACKET = [
  // --- Play-In: West ---
  { matchupId: 'west_playin_1', round: 'playin', conference: 'west', seedTop: 7, seedBottom: 8, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'west_playin_2', round: 'playin', conference: 'west', seedTop: 9, seedBottom: 10, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'west_playin_3', round: 'playin', conference: 'west', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },

  // --- Play-In: East ---
  { matchupId: 'east_playin_1', round: 'playin', conference: 'east', seedTop: 7, seedBottom: 8, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_playin_2', round: 'playin', conference: 'east', seedTop: 9, seedBottom: 10, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_playin_3', round: 'playin', conference: 'east', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },

  // --- Round 1: West ---
  { matchupId: 'west_r1_1', round: 'r1', conference: 'west', seedTop: 1, seedBottom: 8, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'west_r1_2', round: 'r1', conference: 'west', seedTop: 4, seedBottom: 5, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'west_r1_3', round: 'r1', conference: 'west', seedTop: 3, seedBottom: 6, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'west_r1_4', round: 'r1', conference: 'west', seedTop: 2, seedBottom: 7, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },

  // --- Round 1: East ---
  { matchupId: 'east_r1_1', round: 'r1', conference: 'east', seedTop: 1, seedBottom: 8, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_r1_2', round: 'r1', conference: 'east', seedTop: 4, seedBottom: 5, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_r1_3', round: 'r1', conference: 'east', seedTop: 3, seedBottom: 6, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_r1_4', round: 'r1', conference: 'east', seedTop: 2, seedBottom: 7, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },

  // --- Round 2 (Conf Semis) ---
  { matchupId: 'west_r2_1', round: 'r2', conference: 'west', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'west_r2_2', round: 'r2', conference: 'west', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_r2_1', round: 'r2', conference: 'east', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_r2_2', round: 'r2', conference: 'east', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },

  // --- Conference Finals ---
  { matchupId: 'west_r3_1', round: 'r3', conference: 'west', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
  { matchupId: 'east_r3_1', round: 'r3', conference: 'east', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },

  // --- Finals ---
  { matchupId: 'finals', round: 'finals', conference: '', seedTop: null, seedBottom: null, teamTop: '', teamBottom: '', winner: '', seriesScore: '', status: 'upcoming', gamesPlayed: null },
];

// Maps each matchup to where its winner feeds into: [targetMatchupId, 'top'|'bottom']
const ADVANCEMENT_MAP = {
  // Play-in → R1
  // playin_1 (7v8): winner is 7 seed → r1_4 bottom (2v7)
  west_playin_1: ['west_r1_4', 'bottom'],
  east_playin_1: ['east_r1_4', 'bottom'],
  // playin_3 (loser 7v8 vs winner 9v10): winner is 8 seed → r1_1 bottom (1v8)
  west_playin_3: ['west_r1_1', 'bottom'],
  east_playin_3: ['east_r1_1', 'bottom'],
  // R1 → R2 (per conference)
  west_r1_1: ['west_r2_1', 'top'],
  west_r1_2: ['west_r2_1', 'bottom'],
  west_r1_3: ['west_r2_2', 'top'],
  west_r1_4: ['west_r2_2', 'bottom'],
  east_r1_1: ['east_r2_1', 'top'],
  east_r1_2: ['east_r2_1', 'bottom'],
  east_r1_3: ['east_r2_2', 'top'],
  east_r1_4: ['east_r2_2', 'bottom'],
  // R2 → R3
  west_r2_1: ['west_r3_1', 'top'],
  west_r2_2: ['west_r3_1', 'bottom'],
  east_r2_1: ['east_r3_1', 'top'],
  east_r2_2: ['east_r3_1', 'bottom'],
  // R3 → Finals
  west_r3_1: ['finals', 'top'],
  east_r3_1: ['finals', 'bottom'],
};

// Play-in special feeds: loser of playin_1 and winner of playin_2 → playin_3
const PLAYIN_FEED_MAP = {
  west_playin_1: ['west_playin_3', 'top', 'loser'],
  east_playin_1: ['east_playin_3', 'top', 'loser'],
  west_playin_2: ['west_playin_3', 'bottom', 'winner'],
  east_playin_2: ['east_playin_3', 'bottom', 'winner'],
};

function getWinnerName(matchup, pick) {
  return pick === 'top' ? matchup.teamTop : matchup.teamBottom;
}

function getLoserName(matchup, pick) {
  return pick === 'top' ? matchup.teamBottom : matchup.teamTop;
}

function applyPickProjections(matchups, picks) {
  const pickMap = {};
  picks.forEach(p => { pickMap[p.matchupId] = p.pick; });

  const projected = matchups.map(m => ({ ...m }));
  const byId = {};
  projected.forEach(m => { byId[m.matchupId] = m; });

  function projectToSlot(targetId, slot, teamName) {
    const target = byId[targetId];
    if (!target || !teamName) return;
    if (slot === 'top' && !target.teamTop) {
      target.teamTop = teamName;
      target._projectedTop = true;
    } else if (slot === 'bottom' && !target.teamBottom) {
      target.teamBottom = teamName;
      target._projectedBottom = true;
    }
  }

  // Process in round order
  const roundOrder = ['playin', 'r1', 'r2', 'r3'];
  for (const round of roundOrder) {
    for (const m of projected) {
      if (m.round !== round) continue;

      // Determine the effective winner: actual (server) or user pick
      const effectiveWinner = m.winner || pickMap[m.matchupId];
      if (!effectiveWinner) continue;

      // Play-in special feeds (loser/winner → playin_3)
      const pf = PLAYIN_FEED_MAP[m.matchupId];
      if (pf) {
        const [pfTargetId, pfSlot, who] = pf;
        const feedTeam = who === 'winner' ? getWinnerName(m, effectiveWinner) : getLoserName(m, effectiveWinner);
        if (feedTeam) projectToSlot(pfTargetId, pfSlot, feedTeam);
      }

      // Normal winner advancement
      const adv = ADVANCEMENT_MAP[m.matchupId];
      if (adv) {
        const [targetId, slot] = adv;
        const winnerTeam = getWinnerName(m, effectiveWinner);
        if (winnerTeam) projectToSlot(targetId, slot, winnerTeam);
      }
    }
  }
  return projected;
}

function getViewingPicks() {
  const { bracketPicks, bracketAllPicks, bracketViewingUser, currentUser } = getState();
  if (bracketViewingUser && bracketViewingUser !== (currentUser && currentUser.username)) {
    return bracketAllPicks[bracketViewingUser] || [];
  }
  return bracketPicks;
}

function getMatchups() {
  const { bracketMatchups, bracketAdminChanges, bracketStagedPicks, bracketViewingUser, currentUser } = getState();
  const bracketPicks = getViewingPicks();
  const isViewingOther = bracketViewingUser && bracketViewingUser !== (currentUser && currentUser.username);
  let base = bracketMatchups.length > 0 ? bracketMatchups : DEFAULT_BRACKET;

  // Merge admin staged changes for preview
  if (Object.keys(bracketAdminChanges).length > 0) {
    base = base.map(m => {
      const changes = bracketAdminChanges[m.matchupId];
      return changes ? { ...m, ...changes } : m;
    });
  }

  const isAdmin = currentUser && currentUser.isAdmin;
  if (isAdmin) {
    const adminPicks = Object.entries(bracketAdminChanges)
      .filter(([_, v]) => v.winner)
      .map(([matchupId, v]) => ({ matchupId, pick: v.winner }));
    const serverPicks = base.filter(m => m.winner).map(m => ({ matchupId: m.matchupId, pick: m.winner }));
    return applyPickProjections(base, [...serverPicks, ...adminPicks]);
  } else {
    const allUserPicks = [
      ...bracketPicks.map(p => ({ matchupId: p.matchupId, pick: p.pick })),
      ...(isViewingOther ? [] : Object.entries(bracketStagedPicks).map(([matchupId, v]) => ({ matchupId, pick: v.pick }))),
    ];
    const serverPicks = base.filter(m => m.winner).map(m => ({ matchupId: m.matchupId, pick: m.winner }));

    // Build actual bracket (server winners take priority)
    const actual = applyPickProjections(base, [...serverPicks, ...allUserPicks]);

    // Build user's expected bracket from a CLEAN base:
    // Strip ALL server results (winners + propagated teams) so only the initial
    // seeded teams remain. User pick projections fill everything else.
    const cleanBase = base.map(m => {
      const clone = { ...m };
      // Clear winner from all matchups — user picks will determine advancement
      clone.winner = '';
      clone.gamesPlayed = null;
      // Clear propagated team slots
      // R1: 7/8 seeds come from play-in
      if (m.matchupId.endsWith('_r1_1')) clone.teamBottom = '';
      if (m.matchupId.endsWith('_r1_4')) clone.teamBottom = '';
      // Play-in 3: both teams come from play-in 1 loser + play-in 2 winner
      if (m.matchupId.endsWith('_playin_3')) {
        clone.teamTop = '';
        clone.teamBottom = '';
      }
      // R2, R3, Finals: all teams come from previous rounds
      if (['r2', 'r3', 'finals'].includes(m.round)) {
        clone.teamTop = '';
        clone.teamBottom = '';
      }
      return clone;
    });
    const expected = applyPickProjections(cleanBase, allUserPicks);

    // The user's expected bracket is the primary view.
    // Compare with actual to find where reality differs.
    const actualById = {};
    actual.forEach(m => { actualById[m.matchupId] = m; });

    const userPickMap = {};
    allUserPicks.forEach(p => { userPickMap[p.matchupId] = p.pick; });

    return expected.map(m => {
      const act = actualById[m.matchupId];
      if (!act) return m;

      // Copy server-decided winner onto the expected view so result checking works
      const merged = { ...m, winner: act.winner || m.winner, gamesPlayed: act.gamesPlayed || m.gamesPlayed };

      // A slot is broken when the user's expected team differs from the actual team
      const brokenTop = !!(m.teamTop && act.teamTop && m.teamTop !== act.teamTop);
      const brokenBottom = !!(m.teamBottom && act.teamBottom && m.teamBottom !== act.teamBottom);

      // If user picked a side and that side's team is broken, it's a guaranteed loss
      const userPick = userPickMap[m.matchupId];
      const guaranteedLoss = !act.winner && (
        (userPick === 'top' && brokenTop) ||
        (userPick === 'bottom' && brokenBottom)
      );

      return {
        ...merged,
        _brokenTop: brokenTop,
        _brokenBottom: brokenBottom,
        // Actual team (what's really there) — shown as replacement
        _actualTop: brokenTop ? act.teamTop : '',
        _actualBottom: brokenBottom ? act.teamBottom : '',
        _guaranteedLoss: guaranteedLoss,
      };
    });
  }
}

// =============================================
// Countdown
// =============================================

const PICKS_OPEN_DATE = new Date('2026-04-13T05:00:00Z'); // April 13 1am EST = 5am UTC
const PICKS_LOCK_DATE = new Date('2026-04-14T23:30:00Z'); // April 14 7:30pm EST = 11:30pm UTC (first play-in game)

function renderCountdown() {
  const now = new Date();

  // Before picks open — count down to open
  if (now < PICKS_OPEN_DATE) {
    const diff = PICKS_OPEN_DATE - now;
    return renderCountdownMarkup(diff, 'Picks open when the regular season ends', 'April 13, 2026 at 1:00 AM EST');
  }

  // Picks are open — count down to lock
  if (now < PICKS_LOCK_DATE) {
    const diff = PICKS_LOCK_DATE - now;
    return renderCountdownMarkup(diff, 'Make your picks before the Play-In starts!', 'Picks lock Tuesday April 14 at 7:30 PM EST');
  }

  return '';
}

function renderCountdownMarkup(diff, label, dateText) {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `
    <div class="bracket-countdown">
      <div class="bracket-countdown__header">
        <span class="bracket-countdown__icon">&#9200;</span>
        <span class="bracket-countdown__label">${label}</span>
      </div>
      <div class="bracket-countdown__timer" id="bracketCountdown" data-target="${PICKS_LOCK_DATE.toISOString()}">
        <div class="bracket-countdown__unit">
          <span class="bracket-countdown__num">${days}</span>
          <span class="bracket-countdown__tag">days</span>
        </div>
        <span class="bracket-countdown__sep">:</span>
        <div class="bracket-countdown__unit">
          <span class="bracket-countdown__num">${String(hours).padStart(2, '0')}</span>
          <span class="bracket-countdown__tag">hrs</span>
        </div>
        <span class="bracket-countdown__sep">:</span>
        <div class="bracket-countdown__unit">
          <span class="bracket-countdown__num">${String(minutes).padStart(2, '0')}</span>
          <span class="bracket-countdown__tag">min</span>
        </div>
        <span class="bracket-countdown__sep">:</span>
        <div class="bracket-countdown__unit">
          <span class="bracket-countdown__num">${String(seconds).padStart(2, '0')}</span>
          <span class="bracket-countdown__tag">sec</span>
        </div>
      </div>
      <div class="bracket-countdown__date">${dateText}</div>
    </div>
  `;
}

export function isPicksOpen() {
  return new Date() >= PICKS_OPEN_DATE;
}

// =============================================
// Main View
// =============================================

export function renderBracketView() {
  const { bracketLoading, bracketSaving, bracketScores, bracketBuyIn, bracketStagedPicks, bracketAdminChanges, bracketViewingUser, currentUser } = getState();
  const viewingPicks = getViewingPicks();
  const isAdmin = currentUser && currentUser.isAdmin;
  const isViewingOther = bracketViewingUser && bracketViewingUser !== (currentUser && currentUser.username);
  const hasAdminChanges = Object.keys(bracketAdminChanges).length > 0;
  const hasStagedPicks = Object.keys(bracketStagedPicks).length > 0;
  const matchups = getMatchups();

  if (bracketLoading) return renderLoading();

  const westPlayin = matchups.filter(m => m.round === 'playin' && m.conference === 'west');
  const eastPlayin = matchups.filter(m => m.round === 'playin' && m.conference === 'east');

  const pot = bracketScores.length * bracketBuyIn;
  const picksLocked = new Date() >= PICKS_LOCK_DATE;

  // Count picks across all matchups that have both teams (including projected)
  const pickedIds = new Set([
    ...viewingPicks.map(p => p.matchupId),
    ...(isViewingOther ? [] : Object.keys(bracketStagedPicks))
  ]);
  const totalMatchups = 21;
  const totalPickedCount = pickedIds.size;
  const remainingCount = totalMatchups - totalPickedCount;
  const allPicked = totalPickedCount >= totalMatchups;

  const hasChanges = isAdmin ? hasAdminChanges : hasStagedPicks;
  const stagedCount = isAdmin ? Object.keys(bracketAdminChanges).length : Object.keys(bracketStagedPicks).length;

  // Per-round progress for display
  const roundProgress = !isAdmin ? getRoundProgress(matchups, pickedIds) : [];

  return `
    <section class="section bracket-section">

      <!-- Sign In CTA for non-logged-in users -->
      ${!currentUser ? `
        <div class="bracket-cta">
          <span class="bracket-cta__icon">&#127936;</span>
          <div class="bracket-cta__text">
            <strong>Want to make your picks?</strong>
            <span>Sign in or create an account to start predicting the playoffs!</span>
          </div>
          <button class="btn btn--primary js-logo-link" data-path="/">Sign In</button>
        </div>
      ` : ''}

      <!-- Countdown or missed picks banner -->
      ${renderCountdown()}
      ${!isAdmin && currentUser && picksLocked && !allPicked && !isViewingOther ? `
        <div class="bracket-missed">
          <span class="bracket-missed__icon">&#128683;</span>
          <div class="bracket-missed__text">
            <strong>You're not participating this year</strong>
            <span>You didn't complete all your picks before the deadline. You can still follow along!</span>
          </div>
        </div>
      ` : ''}

      <!-- Standings Section -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Standings</h2>
          <div class="section__header-actions">
            ${!isAdmin ? `<button class="bracket-how-link js-show-how-it-works">How It Works</button>` : ''}
            ${isAdmin ? `<button class="btn btn--secondary js-fetch-standings">Fetch Latest Standings</button>` : ''}
          </div>
        </div>
        ${renderScoreboard(bracketScores, bracketBuyIn, pot, isAdmin)}
      </section>

      <!-- Sticky Bottom Bar: Progress + Save -->
      ${currentUser && (new Date() < PICKS_LOCK_DATE || isAdmin) ? renderBottomBar(isAdmin, bracketSaving, hasChanges, stagedCount, totalPickedCount, totalMatchups, remainingCount, roundProgress) : ''}

      <!-- Bracket Viewer Selector -->
      ${currentUser && !isAdmin ? (() => {
        const state = getState();
        const allPks = state.bracketAllPicks || {};
        const viewableUsers = Object.keys(allPks).sort();
        const viewingName = bracketViewingUser || currentUser.username;
        const viewingColor = getAvatarColor(viewingName);
        const viewingAvatar = (state.allAvatars || {})[viewingName] || '';

        if (viewableUsers.length === 0) return '';
        return `
          <div class="bracket-viewer-bar">
            <span class="bracket-viewing-text">Viewing</span>
            <div class="user-select bracket-user-select" id="bracketUserSelect">
              <div class="user-select__trigger" id="bracketUserTrigger">
                <span class="user-tag" style="--tag-color:${viewingColor.bg}"><span class="user-tag__icon" ${viewingAvatar ? `style="background-image:url('${viewingAvatar}')"` : ''}>${viewingName.charAt(0)}</span>${viewingName}</span>
                <span class="user-select__arrow"></span>
              </div>
              <div class="user-select__dropdown">
                <div class="user-select__option js-bracket-user-option" data-value="${currentUser.username}">
                  <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); padding: 2px 8px;">My Bracket</span>
                </div>
                ${viewableUsers.filter(u => u !== currentUser.username).map(u => {
                  const color = getAvatarColor(u);
                  const avatar = (state.allAvatars || {})[u] || '';
                  return `<div class="user-select__option js-bracket-user-option" data-value="${u}">
                    <span class="user-tag" style="--tag-color:${color.bg}"><span class="user-tag__icon" ${avatar ? `style="background-image:url('${avatar}')"` : ''}>${u.charAt(0)}</span>${u}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      })() : ''}

      <!-- Play-In Section -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Play-In Tournament</h2>
          <div class="section__header-actions">
            ${!isAdmin && !isViewingOther && !picksLocked && allPicked && !hasStagedPicks ? `
              <button class="bracket-how-link js-bracket-edit-picks">Edit Picks</button>
            ` : ''}
          </div>
        </div>
        <div class="bracket-playin">
          <div class="playin-line">
            <div class="playin-line__conf-label">West</div>
            ${renderPlayInLine(westPlayin, 'west')}
            <div class="playin-line__divider"></div>
            <div class="playin-line__conf-label">East</div>
            ${renderPlayInLine(eastPlayin, 'east')}
          </div>
        </div>
      </section>

      <!-- Bracket Section -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Playoff Bracket</h2>
        </div>
        <div class="bracket-playoff-card">

        <div class="bracket-container">
        <div class="bracket-container__inner">
        <!-- Round Labels -->
        <div class="bracket-labels">
          <div class="bracket-label">Round 1 <span class="bracket-label__pts">2pts / pick · 1pt / games</span></div>
          <div class="bracket-label">Semis <span class="bracket-label__pts">4pts / pick · 2pts / games</span></div>
          <div class="bracket-label">West Finals <span class="bracket-label__pts">6pts / pick · 3pts / games</span></div>
          <div class="bracket-label bracket-label--finals">NBA Finals <span class="bracket-label__pts">8pts / pick · 4pts / games</span></div>
          <div class="bracket-label">East Finals <span class="bracket-label__pts">6pts / pick · 3pts / games</span></div>
          <div class="bracket-label">Semis <span class="bracket-label__pts">4pts / pick · 2pts / games</span></div>
          <div class="bracket-label">Round 1 <span class="bracket-label__pts">2pts / pick · 1pt / games</span></div>
        </div>
        <div class="bracket-tree">
          ${renderBracketColumn(matchups, 'west', 'r1', true)}
          ${renderBracketColumn(matchups, 'west', 'r2', true)}
          ${renderBracketColumn(matchups, 'west', 'r3', true)}
          ${renderFinalsColumn(matchups)}
          ${renderBracketColumn(matchups, 'east', 'r3', true)}
          ${renderBracketColumn(matchups, 'east', 'r2', true)}
          ${renderBracketColumn(matchups, 'east', 'r1', true)}
        </div>
        </div>
        </div>
      </div>
      </section>
    </section>
  `;
}

// =============================================
// Pick Progress
// =============================================

const ROUND_NAMES = {
  playin: 'Play-In',
  r1: 'Round 1',
  r2: 'Semis',
  r3: 'Conf Finals',
  finals: 'Finals'
};

const ROUND_TOTALS = { playin: 6, r1: 8, r2: 4, r3: 2, finals: 1 };

function getRoundProgress(matchups, pickedIds) {
  const rounds = ['playin', 'r1', 'r2', 'r3', 'finals'];
  return rounds.map(round => {
    const available = matchups.filter(m => m.round === round && m.teamTop && m.teamBottom);
    const picked = available.filter(m => pickedIds.has(m.matchupId));
    const total = ROUND_TOTALS[round];
    return { round, label: ROUND_NAMES[round], total, available: available.length, picked: picked.length };
  });
}

// Progress rendering is now handled by renderBottomBar

// =============================================
// Sticky Bottom Bar
// =============================================

function renderBottomBar(isAdmin, isSaving, hasChanges, stagedCount, totalPicked, totalAvailable, remaining, roundProgress) {
  // Admin: only show when there are changes
  if (isAdmin) {
    if (!hasChanges) return '';
    return `
      <div class="bracket-bottom-bar">
        <div class="bracket-bottom-bar__inner">
          <span class="bracket-bottom-bar__count">${stagedCount} unsaved change${stagedCount > 1 ? 's' : ''}</span>
          <button class="btn btn--primary bracket-bottom-bar__btn js-bracket-save-all" ${isSaving ? 'disabled' : ''}>
            ${isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    `;
  }

  const picksLocked = new Date() >= PICKS_LOCK_DATE;
  // User: all picks saved, nothing staged — no bottom bar needed
  if (remaining === 0 && !hasChanges) return '';

  const pct = totalAvailable > 0 ? Math.round((totalPicked / totalAvailable) * 100) : 0;

  return `
    <div class="bracket-bottom-bar">
      <div class="bracket-bottom-bar__inner">
        <div class="bracket-bottom-bar__progress">
          <div class="bracket-bottom-bar__progress-top">
            <span class="bracket-bottom-bar__progress-text">${totalPicked}/${totalAvailable} picks</span>
            <div class="bracket-bottom-bar__rounds">
              ${roundProgress.map(r => {
                const cls = r.picked === r.total ? 'bracket-progress-round--done' : r.picked > 0 ? 'bracket-progress-round--partial' : r.available === 0 ? 'bracket-progress-round--locked' : '';
                return `<span class="bracket-progress-round ${cls}">${r.label} ${r.picked}/${r.total}</span>`;
              }).join('')}
            </div>
            <span class="bracket-bottom-bar__remaining">${remaining > 0 ? `${remaining} left` : 'All picked!'}</span>
          </div>
          <div class="bracket-bottom-bar__bar">
            <div class="bracket-bottom-bar__bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
        ${hasChanges ? `
          <button class="btn btn--secondary bracket-bottom-bar__btn js-bracket-cancel-edit">Cancel</button>
          <button class="btn btn--primary bracket-bottom-bar__btn js-bracket-save-picks" ${isSaving ? 'disabled' : ''}>
            ${isSaving ? 'Saving...' : 'Save Changes'} (${stagedCount})
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// =============================================
// Instructions
// =============================================

export function renderBracketHowModal() {
  const { showBracketHowModal } = getState();
  if (!showBracketHowModal) return '';

  return `
    <div class="app-modal-overlay js-close-how-modal">
      <div class="app-modal">
        <div class="app-modal__header">
          <h2 class="app-modal__title">How It Works</h2>
          <button class="app-modal__close js-close-how-modal-btn">&times;</button>
        </div>
        <div class="app-modal__body">
          <div class="how-modal__steps">
            <div class="how-modal__step">
              <div class="how-modal__step-num">1</div>
              <div class="how-modal__step-content">
                <strong>Pick every winner</strong>
                <span>Play-In, Round 1, Round 2, Conference Finals, and the Finals</span>
              </div>
            </div>
            <div class="how-modal__step">
              <div class="how-modal__step-num">2</div>
              <div class="how-modal__step-content">
                <strong>Predict the games</strong>
                <span>How many games will each series go? (4-7)</span>
              </div>
            </div>
            <div class="how-modal__step">
              <div class="how-modal__step-num">3</div>
              <div class="how-modal__step-content">
                <strong>Earn points</strong>
                <span>More points for later rounds. Bonus for predicting exact games.</span>
              </div>
            </div>
            <div class="how-modal__scoring">
              <div class="how-modal__scoring-title">Points per round</div>
              <div class="how-modal__scoring-table">
                <div class="how-modal__scoring-row how-modal__scoring-row--header">
                  <span>Round</span><span>Winner</span><span>Games</span>
                </div>
                <div class="how-modal__scoring-row"><span>Play-In</span><span>1 pt</span><span>—</span></div>
                <div class="how-modal__scoring-row"><span>Round 1</span><span>2 pts</span><span>1 pt</span></div>
                <div class="how-modal__scoring-row"><span>Round 2</span><span>4 pts</span><span>2 pts</span></div>
                <div class="how-modal__scoring-row"><span>Conf Finals</span><span>6 pts</span><span>3 pts</span></div>
                <div class="how-modal__scoring-row how-modal__scoring-row--finals"><span>Finals</span><span>8 pts</span><span>4 pts</span></div>
              </div>
            </div>
            <div class="how-modal__step">
              <div class="how-modal__step-num">4</div>
              <div class="how-modal__step-content">
                <strong>Most points wins</strong>
                <span>The player with the most points at the end takes the pot. In case of a tie, the pot is split evenly.</span>
              </div>
            </div>
          </div>
          <div class="how-modal__warning">
            Picks are not editable once the first Play-In game starts.
          </div>
          <button class="btn btn--primary how-modal__btn js-close-how-modal-btn">Let's Go!</button>
        </div>
      </div>
    </div>
  `;
}

// =============================================
// Scoreboard
// =============================================

function renderScoreboard(scores, buyIn, pot, isAdmin) {
  const rankEmojis = ['&#129351;', '&#129352;', '&#129353;'];
  const state = getState();
  const allPicks = state.bracketAllPicks || {};

  // If no matchups are completed yet, build placeholder entries from allPicks
  const displayScores = scores.length > 0 ? scores : Object.keys(allPicks).map(username => ({
    username,
    points: 0,
    correctPicks: 0,
    correctPlayin: 0,
    correctSeries: 0,
    correctGames: 0,
    totalPicks: allPicks[username].length
  }));

  return `
    <div class="bracket-scoreboard">
      <div class="bracket-scoreboard__header">
        <div class="bracket-scoreboard__meta">
          <div class="bracket-scoreboard__stat">
            <span class="bracket-scoreboard__stat-label">Pot</span>
            <span class="bracket-scoreboard__stat-value bracket-scoreboard__stat-value--pot">${formatCurrency(pot)}</span>
          </div>
          <div class="bracket-scoreboard__stat">
            <span class="bracket-scoreboard__stat-label">Buy-in</span>
            ${isAdmin ? `
              <div class="bracket-scoreboard__buyin-edit">
                <input class="form-input bracket-scoreboard__buyin-input" type="number" id="bracketBuyInInput" value="${buyIn}" min="0" step="1" />
                <button class="btn btn--primary bracket-admin__btn js-set-buyin">Set</button>
              </div>
            ` : `
              <span class="bracket-scoreboard__stat-value">${formatCurrency(buyIn)}</span>
            `}
          </div>
        </div>
      </div>
      ${displayScores.length > 0 ? `
        <div class="bracket-scoreboard__cols">
          <div class="bracket-scoreboard__col-header">
            <span></span>
            <span class="bracket-scoreboard__col-label bracket-scoreboard__col-label--player">Player</span>
            <span class="bracket-scoreboard__col-label" data-tooltip="Points from Play-In (1pt/pick)">PI</span>
            <span class="bracket-scoreboard__col-label" data-tooltip="Points from Round 1 (2pt/pick + 1pt/games)">R1</span>
            <span class="bracket-scoreboard__col-label" data-tooltip="Points from Conf Semis (4pt/pick + 2pt/games)">R2</span>
            <span class="bracket-scoreboard__col-label" data-tooltip="Points from Conf Finals (6pt/pick + 3pt/games)">CF</span>
            <span class="bracket-scoreboard__col-label" data-tooltip="Points from Finals (8pt/pick + 4pt/games)">F</span>
            <span class="bracket-scoreboard__col-label bracket-scoreboard__col-label--pts">Total</span>
          </div>
          ${displayScores.map((s, i) => {
            const rank = i + 1;
            const rankHtml = rank <= 3 ? `<span class="bracket-scoreboard__medal">${rankEmojis[i]}</span>` : `<span class="bracket-scoreboard__rank-num">${rank}</span>`;
            return `
              <div class="bracket-scoreboard__item ${rank === 1 ? 'bracket-scoreboard__item--leader' : ''} ${allPicks[s.username] ? 'bracket-scoreboard__item--clickable' : ''}" ${allPicks[s.username] ? `data-view-bracket="${s.username}"` : ''}>
                <div class="bracket-scoreboard__rank">${rankHtml}</div>
                <div class="bracket-scoreboard__player">
                  ${renderUserTag(s.username, state)}
                  ${allPicks[s.username] ? `<button class="bracket-scoreboard__view-link" data-view-bracket="${s.username}">View picks</button>` : ''}
                </div>
                <span class="bracket-scoreboard__col-val">${s.ptsPlayin || 0}</span>
                <span class="bracket-scoreboard__col-val">${s.ptsR1 || 0}</span>
                <span class="bracket-scoreboard__col-val">${s.ptsR2 || 0}</span>
                <span class="bracket-scoreboard__col-val">${s.ptsR3 || 0}</span>
                <span class="bracket-scoreboard__col-val">${s.ptsFinals || 0}</span>
                <span class="bracket-scoreboard__col-val bracket-scoreboard__col-val--pts">${s.points}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<p class="bracket-scoreboard__empty">No picks submitted yet</p>'}
    </div>
  `;
}

// =============================================
// Play-In Section
// =============================================

function renderPlayInLine(playinMatchups, conference) {
  const game1 = playinMatchups.find(m => m.matchupId === `${conference}_playin_1`);
  const game2 = playinMatchups.find(m => m.matchupId === `${conference}_playin_2`);
  const game3 = playinMatchups.find(m => m.matchupId === `${conference}_playin_3`);

  return `
    <div class="playin-line__game">
      <div class="playin-line__label">7v8 · 7th seed <span class="bracket-label__pts">1pt</span></div>
      ${renderMatchupCard(game1)}
    </div>
    <div class="playin-line__game">
      <div class="playin-line__label">9v10 · loser out <span class="bracket-label__pts">1pt</span></div>
      ${renderMatchupCard(game2)}
    </div>
    <div class="playin-line__game">
      <div class="playin-line__label">8th seed <span class="bracket-label__pts">1pt</span></div>
      ${renderMatchupCard(game3)}
    </div>
  `;
}

// =============================================
// Bracket Tree Columns
// =============================================

function renderBracketColumn(matchups, conference, round, visible) {
  if (!visible) return '';
  const roundMatchups = matchups.filter(m => m.round === round && m.conference === conference);

  return `
    <div class="bracket-col bracket-col--${conference} bracket-col--${round}">
      ${roundMatchups.map(m => `
        <div class="bracket-col__slot">
          ${renderMatchupCard(m)}
        </div>
      `).join('')}
    </div>
  `;
}

function renderFinalsColumn(matchups) {
  const finals = matchups.find(m => m.round === 'finals');
  if (!finals) return '';

  return `
    <div class="bracket-col bracket-col--finals">
      <div class="bracket-col__slot bracket-col__slot--finals">
        <div class="bracket-finals-trophy">&#127942;</div>
        ${renderMatchupCard(finals)}
      </div>
    </div>
  `;
}

// =============================================
// Team Logo Helper
// =============================================

function renderTeamName(teamName, showTBD = true) {
  if (!teamName) return showTBD ? '<span class="bracket-team__name">TBD</span>' : '';
  const logo = getTeamLogo(teamName);
  return `
    ${logo ? `<img class="bracket-team__logo" src="${logo}" alt="${teamName}" />` : ''}
    <span class="bracket-team__name">${teamName}</span>
  `;
}

// =============================================
// Matchup Card
// =============================================

function renderMatchupCard(matchup) {
  if (!matchup) return '';

  const { currentUser, bracketStagedPicks, bracketPendingPick, bracketSaving, bracketAdminChanges, bracketViewingUser } = getState();
  const bracketPicks = getViewingPicks();
  const isAdmin = currentUser && currentUser.isAdmin;
  const isViewingOther = bracketViewingUser && bracketViewingUser !== (currentUser && currentUser.username);
  const hasTeams = matchup.teamTop && matchup.teamBottom;
  const isCompleted = matchup.winner !== '';
  const isSeries = matchup.round !== 'playin';
  const isPending = bracketPendingPick && bracketPendingPick.matchupId === matchup.matchupId;
  const hasUnsavedAdminChange = isAdmin && !!bracketAdminChanges[matchup.matchupId];

  const topWinner = isCompleted && matchup.winner === 'top';
  const bottomWinner = isCompleted && matchup.winner === 'bottom';

  // User picks — admin doesn't see pick indicators
  const savedPick = !isAdmin ? bracketPicks.find(p => p.matchupId === matchup.matchupId) : null;
  const stagedPick = !isAdmin ? bracketStagedPicks[matchup.matchupId] : null;
  const activePick = savedPick || stagedPick;
  const isSaved = !!savedPick;
  const isStaged = !savedPick && !!stagedPick;

  const pickedTop = activePick && activePick.pick === 'top';
  const pickedBottom = activePick && activePick.pick === 'bottom';
  const pickedGames = activePick && activePick.games ? activePick.games : null;
  const gamesCorrect = pickedGames && isCompleted && matchup.gamesPlayed && pickedGames === matchup.gamesPlayed;
  const gamesWrong = pickedGames && isCompleted && matchup.gamesPlayed && pickedGames !== matchup.gamesPlayed;
  const gamesClass = gamesCorrect ? 'bracket-team__games--correct' : (gamesWrong ? 'bracket-team__games--wrong' : '');

  const picksLocked = new Date() >= PICKS_LOCK_DATE;
  const canPick = currentUser && !isAdmin && !isViewingOther && hasTeams && !isCompleted && !isSaved && !picksLocked;
  const pendingTop = isPending && bracketPendingPick.pick === 'top';
  const pendingBottom = isPending && bracketPendingPick.pick === 'bottom';

  // Result: did the user's saved pick match the actual winner?
  // If the matchup has broken slots, check if the user's intended team actually matches
  // the team in that position. If not, the pick is invalid (teams shifted).
  const hasBrokenSlots = matchup._brokenTop || matchup._brokenBottom;
  const pickSlotBroken = hasBrokenSlots && savedPick && (
    (savedPick.pick === 'top' && matchup._brokenTop) ||
    (savedPick.pick === 'bottom' && matchup._brokenBottom)
  );
  const pickCorrect = isSaved && isCompleted && savedPick.pick === matchup.winner && !pickSlotBroken;
  const pickWrong = isSaved && isCompleted && (savedPick.pick !== matchup.winner || pickSlotBroken);
  const hasPrediction = isSaved && !isCompleted;

  // Play-in context: loser of playin_1 and playin_2 have different fates
  // playin_1 loser → plays in playin_3 (NOT eliminated)
  // playin_2 loser → eliminated
  // playin_3 loser → eliminated
  const isPlayin = matchup.round === 'playin';
  const isPlayin1 = matchup.matchupId.endsWith('_playin_1');
  // In play-in 1, the loser is NOT eliminated (they go to game 3)
  const loserEliminated = !isPlayin || !isPlayin1;

  function teamClasses(side) {
    const isWinner = isCompleted && matchup.winner === side;
    const isLoser = isCompleted && matchup.winner && matchup.winner !== side;
    const isPicked = side === 'top' ? pickedTop : pickedBottom;
    const isProjected = side === 'top' ? matchup._projectedTop : matchup._projectedBottom;
    const isPend = side === 'top' ? pendingTop : pendingBottom;

    const classes = [];
    const isBroken = side === 'top' ? matchup._brokenTop : matchup._brokenBottom;
    const eitherBroken = matchup._brokenTop || matchup._brokenBottom;

    if (isBroken) {
      classes.push('bracket-team--broken');
      // If this broken team was the user's pick AND the pick is actually wrong, guaranteed loss
      if (isPicked && isSaved && pickWrong) classes.push('bracket-team--pick-wrong');
    } else if (isWinner) {
      classes.push('bracket-team--winner');
    } else if (isLoser && loserEliminated) {
      classes.push('bracket-team--eliminated');
    } else if (isLoser && !loserEliminated) {
      classes.push('bracket-team--playin-loser');
    }

    // Show pick result indicators — even on broken matchups if the pick result is known
    if (isPicked && isSaved && pickCorrect) classes.push('bracket-team--pick-correct');
    if (!isBroken && isPicked && isSaved && pickWrong && loserEliminated) classes.push('bracket-team--pick-wrong');
    if (!isBroken && isPicked && isSaved && pickWrong && !loserEliminated) classes.push('bracket-team--pick-minor-wrong');
    if (isPicked && isSaved && !isCompleted && !eitherBroken) classes.push('bracket-team--picked');
    if (isPicked && isStaged) classes.push('bracket-team--staged');
    if (isPend) classes.push('bracket-team--selecting');
    if (isProjected) classes.push('bracket-team--projected');
    return classes.join(' ');
  }

  // CSS classes
  const stagedClass = isStaged ? 'bracket-matchup--unsaved' : '';
  const unsavedAdminClass = hasUnsavedAdminChange ? 'bracket-matchup--unsaved' : '';
  const hasBrokenSlot = matchup._brokenTop || matchup._brokenBottom;
  const guaranteedLoss = matchup._guaranteedLoss;
  // Pick result takes priority over broken state
  const resultClass = pickCorrect ? 'bracket-matchup--correct' :
    (guaranteedLoss ? 'bracket-matchup--wrong' :
    (pickWrong && loserEliminated ? 'bracket-matchup--wrong' :
    (pickWrong && !loserEliminated ? 'bracket-matchup--minor-wrong' :
    (hasBrokenSlot ? 'bracket-matchup--broken' :
    (hasPrediction ? 'bracket-matchup--predicted' : '')))));

  const tooltip = pickCorrect ? (hasBrokenSlot ? 'Correct! Different matchup than expected, but your pick was right' : 'Correct! You predicted the right winner')
    : guaranteedLoss ? 'Your pick can no longer win — the team you chose won\'t be in this matchup'
    : (pickWrong && pickSlotBroken) ? 'Incorrect — the team you picked wasn\'t in this matchup'
    : (pickWrong && loserEliminated) ? 'Incorrect — the team you picked lost this matchup'
    : (pickWrong && !loserEliminated) ? 'Incorrect pick, but the team still plays in the next play-in game'
    : hasBrokenSlot ? 'This matchup differs from your prediction — a different team advanced here'
    : hasPrediction ? 'Your prediction — waiting for this matchup to be decided'
    : isStaged ? 'Unsaved pick — hit Save Changes to lock it in'
    : '';

  // Build result badge HTML — shown inside the picked team's row
  const resultBadgeHtml = pickCorrect ? '<span class="bracket-team__result bracket-team__result--correct" data-tooltip="Correct prediction!">&#10003;</span>'
    : (guaranteedLoss ? '<span class="bracket-team__result bracket-team__result--wrong" data-tooltip="Guaranteed loss">&#10007;</span>'
    : (pickWrong && loserEliminated ? '<span class="bracket-team__result bracket-team__result--wrong" data-tooltip="Wrong prediction">&#10007;</span>'
    : (pickWrong && !loserEliminated ? '<span class="bracket-team__result bracket-team__result--minor-wrong" data-tooltip="Wrong pick, team still plays">&#10007;</span>'
    : (hasBrokenSlot ? '<span class="bracket-team__result bracket-team__result--broken" data-tooltip="Matchup differs from prediction">&#8800;</span>'
    : (hasPrediction ? '<span class="bracket-team__result bracket-team__result--predicted" data-tooltip="Awaiting result">&#9679;</span>'
    : '')))));

  return `
    <div class="bracket-matchup ${isCompleted ? 'bracket-matchup--completed' : ''} ${isPending ? 'bracket-matchup--pending' : ''} ${resultClass} ${stagedClass} ${unsavedAdminClass}" data-matchup-id="${matchup.matchupId}" data-round="${matchup.round}" ${tooltip ? `data-tooltip="${tooltip}"` : ''}>
      ${hasUnsavedAdminChange || isStaged ? '<div class="bracket-matchup__unsaved-dot" data-tooltip="Unsaved change"></div>' : ''}
      <div class="bracket-team ${teamClasses('top')}">
        ${pickedTop ? resultBadgeHtml : ''}
        <span class="bracket-team__seed">${matchup.seedTop || ''}</span>
        ${matchup._brokenTop ? `
          <div class="bracket-team__broken-wrap">
            <div class="bracket-team__expected-pick">${renderTeamName(matchup.teamTop)}</div>
            <div class="bracket-team__actual">${renderTeamName(matchup._actualTop)}</div>
          </div>
        ` : `
          ${renderTeamName(matchup.teamTop)}
        `}
        ${pickedTop && pickedGames ? `<span class="bracket-team__games ${gamesClass}" data-tooltip="${gamesCorrect ? 'Correct games prediction!' : (gamesWrong ? `Wrong — series went ${matchup.gamesPlayed} games` : `Your prediction: ${pickedGames} games`)}">in ${pickedGames}</span>` : ''}
        ${canPick && !pickedTop && !isPending ? `<button class="bracket-pick-btn js-bracket-pick" data-matchup="${matchup.matchupId}" data-pick="top" data-series="${isSeries}" data-tooltip="Pick ${matchup.teamTop}">Pick</button>` : ''}
      </div>
      <div class="bracket-team ${teamClasses('bottom')}">
        ${pickedBottom ? resultBadgeHtml : ''}
        <span class="bracket-team__seed">${matchup.seedBottom || ''}</span>
        ${matchup._brokenBottom ? `
          <div class="bracket-team__broken-wrap">
            <div class="bracket-team__expected-pick">${renderTeamName(matchup.teamBottom)}</div>
            <div class="bracket-team__actual">${renderTeamName(matchup._actualBottom)}</div>
          </div>
        ` : `
          ${renderTeamName(matchup.teamBottom)}
        `}
        ${pickedBottom && pickedGames ? `<span class="bracket-team__games ${gamesClass}" data-tooltip="${gamesCorrect ? 'Correct games prediction!' : (gamesWrong ? `Wrong — series went ${matchup.gamesPlayed} games` : `Your prediction: ${pickedGames} games`)}">in ${pickedGames}</span>` : ''}
        ${canPick && !pickedBottom && !isPending ? `<button class="bracket-pick-btn js-bracket-pick" data-matchup="${matchup.matchupId}" data-pick="bottom" data-series="${isSeries}" data-tooltip="Pick ${matchup.teamBottom}">Pick</button>` : ''}
      </div>
      ${isPending && isSeries ? renderGamesPicker(matchup.matchupId, bracketPendingPick.pick) : ''}
      ${matchup.seriesScore ? `<div class="bracket-matchup__score">${matchup.seriesScore}</div>` : ''}
      ${isAdmin ? renderAdminControls(matchup) : ''}
      ${!isAdmin && isCompleted ? renderOutcome(matchup) : ''}
    </div>
  `;
}

function renderOutcome(matchup) {
  const winnerName = matchup.winner === 'top' ? matchup._actualTop || matchup.teamTop : matchup._actualBottom || matchup.teamBottom;
  if (!winnerName) return '';
  const isSeries = matchup.round !== 'playin';
  const gamesText = isSeries && matchup.gamesPlayed ? ` in ${matchup.gamesPlayed}` : '';
  const verb = isSeries ? 'won' : 'advanced';
  return `<div class="bracket-matchup__outcome">${winnerName} ${verb}${gamesText}</div>`;
}

function renderGamesPicker(matchupId, pick) {
  return `
    <div class="bracket-games-picker">
      <div class="bracket-games-picker__label">Series ends in:</div>
      <div class="bracket-games-picker__options">
        ${[4, 5, 6, 7].map(g => `
          <button class="bracket-games-picker__btn js-games-pick" data-matchup="${matchupId}" data-pick="${pick}" data-games="${g}">${g}</button>
        `).join('')}
      </div>
      <button class="bracket-games-picker__cancel js-cancel-pick">Cancel</button>
    </div>
  `;
}

// =============================================
// Admin Controls
// =============================================

function renderTeamSelector(matchupId, field, currentValue) {
  const conf = matchupId.startsWith('west') ? 'west' : matchupId.startsWith('east') ? 'east' : null;
  // Show conference teams first, then the rest
  let teams = [...NBA_TEAMS];
  if (conf) {
    teams.sort((a, b) => {
      if (a.conference === conf && b.conference !== conf) return -1;
      if (a.conference !== conf && b.conference === conf) return 1;
      return 0;
    });
  }

  return `
    <div class="team-selector" data-field="${field}" data-matchup="${matchupId}">
      <input class="team-selector__search form-input" type="text" placeholder="Search team..." value="${currentValue || ''}" autocomplete="off" />
      <div class="team-selector__dropdown">
        ${teams.map(t => `
          <div class="team-selector__option js-team-option" data-team="${t.name}" data-matchup="${matchupId}" data-field="${field}">
            <img class="team-selector__option-logo" src="${t.logo}" alt="${t.name}" />
            <span class="team-selector__option-name">${t.city} ${t.name}</span>
            <span class="team-selector__option-id">${t.id}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAdminControls(matchup) {
  const { bracketAdminPendingWinner } = getState();
  const hasTeams = matchup.teamTop && matchup.teamBottom;
  const isSeries = matchup.round !== 'playin';
  const isPendingWinner = bracketAdminPendingWinner && bracketAdminPendingWinner.matchupId === matchup.matchupId;
  const pendingWinner = isPendingWinner ? bracketAdminPendingWinner.winner : null;

  if (!hasTeams) {
    return `
      <div class="bracket-admin bracket-admin--selectors">
        ${renderTeamSelector(matchup.matchupId, 'teamTop', matchup.teamTop)}
        ${renderTeamSelector(matchup.matchupId, 'teamBottom', matchup.teamBottom)}
      </div>
    `;
  }

  // Completed: show winner with change option
  if (matchup.winner && !isPendingWinner) {
    const winnerLabel = matchup.winner === 'top' ? matchup.teamTop : matchup.teamBottom;
    return `
      <div class="bracket-admin">
        <div class="bracket-admin__current">
          Winner: <strong>${winnerLabel}</strong>${matchup.gamesPlayed ? ` in ${matchup.gamesPlayed}` : ''}
          <button class="bracket-admin__reset js-admin-reset-winner" data-matchup="${matchup.matchupId}">Change</button>
        </div>
      </div>
    `;
  }

  // Step 2: games picker (after selecting winner on a series)
  if (isPendingWinner && isSeries) {
    const selectedTeam = pendingWinner === 'top' ? matchup.teamTop : matchup.teamBottom;
    return `
      <div class="bracket-games-picker">
        <div class="bracket-games-picker__label">${selectedTeam} wins in:</div>
        <div class="bracket-games-picker__options">
          ${[4, 5, 6, 7].map(g => `
            <button class="bracket-games-picker__btn js-admin-games-pick" data-matchup="${matchup.matchupId}" data-winner="${pendingWinner}" data-games="${g}">${g}</button>
          `).join('')}
        </div>
        <button class="bracket-games-picker__cancel js-admin-cancel-winner">Cancel</button>
      </div>
    `;
  }

  // Step 1: pick winner (or play-in where no games needed)
  return `
    <div class="bracket-admin bracket-admin--winner">
      <div class="bracket-admin__winner-row">
        <button class="btn btn--secondary bracket-admin__btn js-admin-set-winner" data-matchup="${matchup.matchupId}" data-winner="top">${matchup.teamTop}</button>
        <button class="btn btn--secondary bracket-admin__btn js-admin-set-winner" data-matchup="${matchup.matchupId}" data-winner="bottom">${matchup.teamBottom}</button>
      </div>
    </div>
  `;
}
