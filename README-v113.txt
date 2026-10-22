Golf Game PWA v113 — Safe UI patch based on working v111

UI changes:
- Holes, Index, PAR header rows (including Total header cell) use dark gray background and light text.
- PAR row Total cell is blank; no summed value such as 36.
- Current logged-in player's row uses pale mint #DDF8EE with neon-lime left accent #B8FF00.
- F9/B9 and Baccarat tables adapt to phone portrait and landscape layouts.

Safety:
- app.js API endpoint and all request functions are retained from v111; only the scorecard markup class and PAR Total display were changed.
- Apps Script does not need redeployment.

Deploy:
1. Unzip this package.
2. Upload the website files to the existing GitHub repository, preserving directory structure.
3. Wait for GitHub Pages to publish.
4. Refresh the app; if old styles remain, close and reopen or clear site cache.
