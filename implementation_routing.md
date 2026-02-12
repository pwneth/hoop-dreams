# Routing and "My Bets" Implementation

## Overview
We have implemented client-side routing and a new "My Bets" page to allow users to view their own betting history and easily navigate the application with unique URLs for each view.

## Changes

### 1. Routing System
- Implemented `navigateTo(path)` and `handleRoute()` functions to manage browser history and view switching.
- Updated `renderHeader` and `renderMobileNav` to use `data-path` attributes for navigation buttons instead of `data-view`.
- Updated `attachEventListeners` to handle clicks on `[data-path]` elements and call `navigateTo`.
- Added support for `import.meta.env.BASE_URL` to ensure routing works correctly when deployed to subdirectories (e.g., GitHub Pages).

### 2. My Bets Page
- Created `renderMyBetsView()` function that filters the global `bets` array for the current user's activity.
- Displays a summary of the user's stats (Wins, Losses, Net Profit) at the top.
- Includes status filters (Active, Paid, Pending, All) to toggle the view of the bet list.
- Lists all bets where the user is either `better1` or `better2`, filtered by the selected status.
- Handles empty states (no bets placed).

### 3. URL Structure
- `/` or `/dashboard` -> Dashboard View
- `/my-bets` -> My Bets View
- `/bets` -> All Bets View
- `/members` -> Members View

### 4. Integration
- "My Bets" added to Desktop and Mobile navigation menus.
- "See All Bets" button on Dashboard now navigates to `/bets`.
- Clicking a user on the Leaderboard now navigates to `/bets` with the filter pre-selected.

## Code Adjustments
- `src/main.js`:
  - Added `navigateTo`, `handleRoute`, `renderMyBetsView`.
  - Updated `renderMyBetsView` to support status filtering.
  - Updated `render` switch case.
  - Refactored `init` and `attachEventListeners` to cleaner logic and removed duplication.
  - Enabled `popstate` handling for browser Back/Forward buttons.

## Verification
- Verified that navigating between pages updates the URL.
- Verified that "My Bets" shows correct data for logged-in user.
- Verified that base path (e.g., `/hoop-dreams/`) is respected.
- Verified that status filters on "My Bets" page work correctly.
