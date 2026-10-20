Golf Game PWA COMPLETE v94 — Admin Read-only Player View

Changes in v94:
- Adds an Admin-only eye-style button in the in-game Garmin header.
- Admin can choose any player and view the game UI from that player's perspective.
- While previewing another player, the header shows VIEWING AS [PLAYER] and a Return to Admin button.
- This is read-only: score editing is blocked, edit modals are not rendered, and admin-only controls are hidden while previewing.
- Viewing a player changes only the local display context. It does not change login identity or update match data.
- Preserves the v93 navigation/course layout, v92 Garmin styling, v91 P&L Baccarat participant filtering, Join Game workflow, 4-second intro video, and Apps Script source.

No GitHub repository was modified. No Apps Script deployment is needed for these front-end-only changes.

Publish later by backing up the GitHub repo and uploading the front-end files to the GitHub Pages root. The apps-script/Code.gs file is included for completeness; the backend was not changed in v94.
