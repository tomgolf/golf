# Golf Game PWA v36 — Match Lookup Confirmation

This package is based on v35 and updates the app/cache version to v36.

## Match lookup rules carried forward
- 1UP/1DW, 2UP/2DW, 3UP/3DW and 4UP/4DW use the same lookup-table structure.
- For the mirrored DW case, swap W and L, keep S unchanged, and reverse the sign of the result.
- Game, Tommy and Buy remain separate result components; Bonus is calculated separately.
- The v35 lookup-start fix is retained so the lookup uses the full sequence from the initial X-UP/X-TO-GO state.
- Confirmed 4UP 4TOGO example: L → L → W → S gives Game +3, Tommy -1, Buy 0, Bonus 0, Total +2. Mirrored 4DW sequence W → W → L → S gives the opposite result.
- Final-hole rule retained: if the first 8 holes are square and hole 9 decides the game, show G and settle Game ±3 only; Tommy and Buy are 0.

## Upload to GitHub Pages
1. Unzip this file.
2. Upload the files and folders inside the ZIP to the repository publishing root (not the ZIP itself and not an extra enclosing folder).
3. Commit the changes and wait for GitHub Pages to publish.
4. Close and reopen the PWA or refresh it so the v36 service-worker cache is used.

## Data safety
Keep the existing Google Sheet and permanent COURSES data. Match-data cleanup must not delete COURSES. The included Apps Script source is unchanged from v35; no backend redeployment is required for these front-end version/cache changes.


## v39 color updates
- F9/B9 stroke cells: deep red for disadvantage and deep blue for benefit; digits remain black.
- Baccarat: only cells where that player called UP on that hole are deep red; non-UP cells remain white. Digits remain black.


## v40 color correction
- F9/B9 give-stroke cells: white background, black numbers, deep-red border.
- F9/B9 receive-stroke cells: white background, black numbers, deep-blue border.
- Baccarat: only players who called UP on that hole receive a deep-red border; all cells remain white with black numbers.


## v41 match-status correction
- When a pair reaches X-UP/X-DW with X holes remaining, subsequent holes switch to Tommy tracking instead of continuing to show shrinking UP/DW states.
- Example: 4UP with four holes left, then losses on the next two holes, shows T-1 then T-2. A halved hole shows T0; wins show T+1.
- Cache and asset versions updated to v41. Google Apps Script and Sheets are unchanged.
