Golf Game PWA v88 - Join Game manual publishing

PWA deployment:
1. Upload the PWA files (app.js, styles.css, index.html, sw.js, manifest.webmanifest, home-golf-hero.jpg, home-course.svg, icons/) to the GitHub Pages repository root, overwriting matching files.
2. Wait for GitHub Pages deployment and refresh the site.

Google Apps Script backend (IMPORTANT):
1. Open the Apps Script project currently deployed at the API URL used by app.js.
2. Back up the existing script, then replace its Code.gs contents with the included Code.gs file.
3. Run setupDatabase() once and authorize it. This creates the JOIN_ENTRIES sheet without changing COURSES or match data.
4. Deploy > Manage deployments > Edit the existing Web App deployment > select a new version > Deploy. Keep the same web app URL if possible.
5. Test publish, list, removal, and manual join before using in a real game.

Rules in v88:
- New game creation asks whether to publish the game to Join Game. Yes publishes; Cancel skips publishing. Both continue into the game.
- Only published games appear in Join Game; player names are listed and selectable.
- No expiry timer. The creator can remove the entry from the bottom of their P&L, with a second confirmation.
- Removing an entry does not delete the match, scores, or course.
- Manual Game ID + player name join remains available.

Security note:
This backend follows the existing project's current creator check (creator name compared with MATCHES.admin). That is consistent with the existing API but is not strong account authentication; anyone who knows the creator's name may potentially impersonate it. For stronger security, a secret admin token / per-match capability should be added before treating this as robust access control.
