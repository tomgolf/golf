Live Golf Game v1.5 — New Game Layout Update

Base package: Live_Golf_Game_v1.zip

Included
- PWA frontend: index.html, app.js, styles.css, sw.js, manifest.webmanifest, icons and media assets.
- Updated Google Apps Script source: apps-script/Code.gs.

Course management changes
- Add Course supports 18 or 27 holes.
- Each 9-hole section has an independent section name and nine PAR/SI inputs.
- An 18-hole course is selected directly, with no section checkboxes.
- A 27-hole course shows three sections. Exactly two complete 9-hole sections must be selected to start a match. Selecting one or three sections is rejected.
- The first selected section is Front 9; the second is Back 9.
- Course records remain in the permanent COURSES sheet and are not part of match-data cleanup.
- Existing 18-hole course rows are retained and default to Front 9 / Back 9 section labels if no section names exist yet.
- The selected 18 holes are snapshotted into MATCHES for each new game so refresh/rejoin keeps the selected PAR/SI layout.

Important deployment notes
1. Back up the current GitHub Pages files and Google Apps Script source before updating.
2. Upload the PWA files to the existing GitHub Pages repository, preserving folders.
3. Open Apps Script and replace the deployed source with apps-script/Code.gs. Deploy a new Web App version using the same access settings and API endpoint pattern. The new frontend and backend must both be updated for 27-hole courses.
4. The code adds the new section_name and selected_holes_json headers when needed. Do not delete or recreate the COURSES sheet.
5. Do not run any cleanup or deletion action for this update.
6. Reload the PWA after GitHub Pages publishes. If stale UI remains, close the installed PWA and reopen it.

Validation performed
- JavaScript syntax checks passed for app.js and sw.js.
- Apps Script source passed a JavaScript syntax check after copying Code.gs to a .js check file.
- ZIP integrity check performed after packaging.
- No live Apps Script deployment, Google Sheets read/write test, GitHub Pages update, or iPhone browser test was performed here.


New Game layout update (v1.5)
- Match Details: Game ID first, Course second; 27-hole courses show only compact F9 / B9 / T9 checkboxes in one row. Exactly two sections are required.
- Players: player count and names remain; individual handicap fields are not added. Baccarat participation checkbox is placed to the right of each player name.
- Handicap Matrix is displayed directly on the New Game page; no Open Matrix button or modal is required for setup.
- Matrix headers and row labels synchronize with player-name inputs.
- Existing pair-handicap values and reverse-side calculation are retained.
- Existing game modes, start flow, scoring calculations, and backend API source are otherwise unchanged.

Validation performed for v1.5
- app.js JavaScript syntax check passed.
- ZIP integrity check performed after packaging.
- Real-device and live Google Sheets integration tests have not been performed.


Live Golf Game v1.8 — New Game player layout refinement
- Number of Players label stays on the left; player count buttons align to the right on the same row.
- Player Names and Baccarat checkboxes remain unchanged below.
- No scoring, matrix, course-selection, or backend logic changed.
