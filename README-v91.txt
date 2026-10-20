Golf Game PWA v91 — COMPLETE PACKAGE

This archive includes ALL PWA frontend files and the Google Apps Script backend source.

GitHub Pages frontend:
1. Back up/download your current GitHub repository first.
2. Delete the old repository contents if you intend to replace the entire version.
3. Upload the CONTENTS of this archive to the repository root (not the ZIP itself, and do not put everything inside an extra parent folder).
4. Keep app.js, styles.css, index.html, sw.js, manifest.webmanifest, home-golf-hero.jpg, home-course.svg, icons/, and README-v91.txt at the repository root. The apps-script/ folder and the root .gs file are included as source copies for convenience.
5. Wait for GitHub Pages to publish, then refresh the PWA. If an old version is cached, close/reopen the app or refresh after the service worker updates.

Google Apps Script backend — MUST ALSO BE DEPLOYED SEPARATELY:
GitHub Pages does not execute .gs files. The Apps Script source is included at:
- apps-script/Code.gs
- Golf_Game_Apps_Script_Code_v91.gs

To deploy the backend:
1. Open the existing Google Apps Script project used by app.js.
2. Back up the current Code.gs, then replace its contents with the included v91 Apps Script source.
3. Run setupDatabase() once and authorize it. This creates JOIN_ENTRIES; it is intended to preserve existing COURSES and match data.
4. Deploy > Manage deployments > Edit the existing Web App deployment > select a new version > Deploy. Keep the same /exec URL if possible, because app.js uses the configured API URL.
5. Test creating a game, publishing it, listing it in Join Game, joining by player name, removing the entry, and the original manual Game ID + player name join.

Join Game rules in v91:
- After creating a game, the creator chooses whether to publish it to Join Game.
- Join Game lists only games whose creator published an entry, with player names selectable.
- No automatic 8-hour expiry. The creator removes the entry manually from the bottom of the creator's P&L page, then confirms again.
- Removing the Join Game entry does NOT delete the match, scores, or course.
- The original manual Game ID + player name join remains available.

Important security limitation:
The backend uses the project's existing creator check (creator name compared with MATCHES.admin). A name alone is not strong authentication. Consider adding a secret admin token or per-match capability before relying on this as robust access control.

Do not delete the Google Sheets spreadsheet or its data when replacing the GitHub frontend. COURSES is intended to remain permanent; match data and course data are stored separately.

P&L fix in v91: Baccarat amounts are calculated only between players who are enabled for Baccarat. Players who opted out do not create Baccarat transfers, and refresh normalizes saved participation flags.
