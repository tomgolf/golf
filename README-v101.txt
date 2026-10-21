Golf Game PWA v101 — Manual Game ID

Changes from v100:
- Game ID is now entered manually on New Game.
- Removed automatic Game ID lookup from New Game so it no longer waits on “Generating…”.
- Preserves the existing v100 features, including the Admin manual deletion option for matches older than 7 days; COURSES is not deleted.
- Updated asset and service-worker cache version to v101.

Deploy frontend:
1. Extract this ZIP.
2. Upload/replace the website files in the GitHub repository root, preserving the folder structure.
3. Wait for GitHub Pages to publish, then open https://tomgolf.github.io/golf/ and press Ctrl+F5.
4. If an installed PWA still shows old files, close it and reopen the website in the browser first.

Usage:
- On New Game, enter a unique Game ID manually (example format: 21-1).
- Choose the course and enter player names as usual.
- Make sure the ID is unique for the intended match; the backend remains responsible for validating/saving the match.

No Apps Script update is required for this frontend-only change. Do not replace the Apps Script backend for this change.
