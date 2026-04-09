const LOADING_MESSAGES = [
  'Loading your bets...',
  'Checking the scores...',
  'Warming up the court...',
  'Getting the latest odds...',
  'Crunching the numbers...',
  'Pulling up the stats...',
];

const LOADING_ICONS = ['🏀', '🎲', '🏆', '📊', '💰', '🎯'];

export function renderLoading() {
  const msgIdx = Math.floor(Math.random() * LOADING_MESSAGES.length);
  const iconIdx = Math.floor(Math.random() * LOADING_ICONS.length);

  return `
    <div class="app-loader">
      <div class="app-loader__icon">${LOADING_ICONS[iconIdx]}</div>
      <div class="app-loader__spinner"></div>
      <p class="app-loader__text">${LOADING_MESSAGES[msgIdx]}</p>
    </div>
  `;
}
