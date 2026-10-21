Golf Game PWA v106 — Relative-to-PAR scoring input

F9/B9 score input and scorecard display now use relative-to-PAR values:
- PAR 3 range: -2 through 5
- PAR 4 range: -2 through 6
- PAR 5 range: -3 through 7
- Negative scores display with minus (e.g. -1, -2, -3); Par displays 0; over-par scores display as 1, 2, 3... without plus signs.
- Backend/storage remains gross strokes: actual strokes = PAR + relative input.
- Existing match scoring, handicaps, F9/B9 Total, result rows, Baccarat, P&L, course data and 7-day manual delete are otherwise unchanged.

Deploy:
1. Upload website files to the existing GitHub repository, preserving folder structure.
2. Wait for GitHub Pages to publish.
3. Reload; desktop Ctrl+F5.
4. Apps Script backend does not need redeployment.
