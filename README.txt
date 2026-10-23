Golf Game PWA — v114 Personal Mobile Garmin UI

Base
- Built directly from the user-supplied `Golf_Game_PWA_v113_white background.zip`.
- This is a frontend UI update package. It does not deploy or modify GitHub Pages, Apps Script, or Google Sheets automatically.

Requested presentation changes
- Dark Garmin-inspired black/green palette with neon-lime highlights, teal course metadata rows, white score text, red FIN dots.
- Mobile scorecard header uses Hole / Index / PAR and a Status column instead of the previous Total column.
- Scorecard rows remain visible for all players. The per-hole status detail row is initially collapsed and can be expanded from the right-side control; a blank spacer row is kept under each player.
- Red and blue small triangles at the bottom-left of score cells indicate give/receive handicap; the markers do not display stroke numbers.
- Front 9 Result is lower on the page and uses the dark theme.
- Existing score calculation functions and the original API endpoint were retained; the UI calls the existing score and handicap functions.

Important
- The supplied v113 Apps Script reference file is included unchanged. Do not redeploy Apps Script for this frontend styling update.
- Course data, match data, access rules, and backend API are not intentionally changed.
- The visual mockup is a design target; generated example scores/markers in the image are illustrative only.
- Live browser tests, live Google Sheets read/write tests, and regression tests with a real match were not performed. Test a copy/development deployment before replacing the live site.

Deploying
1. Keep the existing online v113 untouched until you finish testing this package.
2. Extract this ZIP and upload the frontend files to the existing GitHub Pages repository, preserving file structure.
3. Do not redeploy the `apps-script/Code.gs` reference file.
4. After GitHub Pages publishes, close and reopen the PWA. If stale assets remain, clear the site's cached data and reload.
