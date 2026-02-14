import { getState } from '../../lib/store/store.js';
import { renderMemberCard } from '../../components/MemberCard/MemberCard.js';

export function renderMembersView() {
  const { memberStats } = getState();

  if (!memberStats || memberStats.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">👥</div>No members found</div>';
  }
  return `
    <div class="member-grid">
      ${memberStats.map(member => renderMemberCard(member)).join('')}
    </div>
  `;
}
