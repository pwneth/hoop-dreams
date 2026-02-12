# Bet Verification Feature Implementation

## Overview
Implemented a "Proposal and Confirmation" workflow for bet outcomes and payments. This ensures that any status change (Winner declaration or Payment completion) must be verified by the other party involved in the bet.

## Changes

### 1. Backend (`Code.gs`)
- Updated `getBets` to read up to column 17 (Q) to support new proposal fields.
- Updated `updateBet`:
  - Checks if a proposal exists from the other user matching the request.
  - If match found: Confirms the bet (updates actual Winner/Status columns and clears proposal).
  - If no match/mismatch: Sets/Overwrites the proposal (Cols N, O).
- Updated `markPaid`:
  - Similar logic for payment Confirmation.
  - Sets proposal in Cols P, Q if not confirming.

### 2. Frontend Data (`src/api.js`)
- Updated `parseBetsFromAPI` to parse the new proposal fields: `proposerWinner`, `proposedWinnerValue`, `proposerPaid`, `proposedPaidValue`.
- Maintained backward compatibility for column key names.

### 3. Frontend UI (`src/main.js`)
- **Notifications**: Added a notification badge in the Header and Mobile Menu showing the count of actions requiring user attention.
- **Bet Card**: Completely rewrote `renderBetCard` and added `renderBetActions`.
  - **Winner State**: 
    - Shows "Waiting for [User] to verify" if you proposed.
    - Shows "Verify Winner?" button if the other user proposed.
    - Shows "Who won?" buttons if no proposal exists.
  - **Payment State** (after winner confirmed):
    - Shows "Waiting for payment verification" if you proposed active status -> paid.
    - Shows "Verify Payment" button if the other user marked as paid.
    - Shows "Mark Paid" button otherwise.
- **Helpers**: Added `getPendingActionCount` and `getOtherBetter`.

### 4. Styling (`src/style.css`)
- Added styles for `.bet-actions-row` (new action container), `.nav-badge` (notifications), and `.btn-group`.

## Workflow
1. User A clicks "Resolve Winner" -> Backend saves proposal.
2. User A sees "Waiting for verification".
3. User B sees notification "1".
4. User B navigates to bet, sees "Verify Winner" action.
5. User B clicks "Confirm" -> Backend updates Winner columns.
6. Bet moves to "Unpaid/Pending Payment" status.
7. User A marks "Paid" -> Backend saves proposal.
8. User B sees notification and "Verify Payment".
9. User B confirms -> Bet moves to "Paid" status.
