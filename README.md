# Golf Game PWA v46 — Match Lookup Confirmation

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


## v45 color correction
- F9/B9 give-stroke cells: white background, black numbers, deep-red border.
- F9/B9 receive-stroke cells: white background, black numbers, deep-blue border.
- Baccarat: only players who called UP on that hole receive a deep-red border; all cells remain white with black numbers.


## v45 match-status correction
- When a pair reaches X-UP/X-DW with X holes remaining, subsequent holes switch to Tommy tracking instead of continuing to show shrinking UP/DW states.
- Example: 4UP with four holes left, then losses on the next two holes, shows T-1 then T-2. A halved hole shows T0; wins show T+1.
- Cache and asset versions updated to v45. Google Apps Script and Sheets are unchanged.


## v47 Baccarat participation
- Edit Handicap includes a Baccarat checkbox per player.
- Unticked players are excluded from pairwise Baccarat calculations and their Baccarat points total 0.
- The setting is stored in PLAYERS.baccarat_enabled. Existing players default to participating.
- Update Apps Script using `apps-script/Golf_Game_Apps_Script_v20_Baccarat_Participation.gs` and redeploy before using the v47 frontend.

## v48 GG / Satay and Fin
- Renamed the result-table label `Bonus` to `Fin`; the existing Fin/bonus calculation is unchanged.
- Added a separate `Satay` result column.
- GG is triggered only when a lead becomes greater than the number of holes remaining before the final hole (for example, 3UP with two holes left). The GG hole displays `nUP/GG` or `nDW/GG`.
- After GG, the match-status display resets for the remaining holes and tracks only those holes (UP/DW/SQ). Tommy and Buy are not calculated for that GG match.
- Satay compares wins in the holes remaining after GG: the side winning more remaining holes receives +2, the other side -2; equal wins means 0 for both.
- Existing `G/T+1` and `G/T-1` cases for the normal `?UP ?TOGO` flow remain unchanged. Final-hole decisions also remain on the existing path.
- Frontend cache and asset versions are v48. No Apps Script or Google Sheets schema change is required for this scoring update. Continue using the v47 Apps Script only if Baccarat participation checkboxes are wanted.


## v49 Match status fixes
- Display XUP XTOGO (and XDW XTOGO) when the current lead equals the remaining holes.
- If the next hole resolves a match after a TOGO state, preserve normal G/T then Tommy/Buy progression; do not mislabel it GG.
- GG/Satay is reserved for an uncatchable match that was not entered through a prior X-up/X-to-go trigger.
- Bump frontend and service-worker cache versions to v49.


## v50 Match status audit correction
- Fixed the root cause of missing TOGO and normal-decision detection: `pairOutcomes()` now stores `remainingAfter` on every hole row, which `matchStatus()` was already relying on.
- This allows `XUP XTOGO` / `XDW XTOGO` to render and allows the next-hole Game/Tommy transition to be detected.
- Cache versions bumped to v50.


## v51 audit fix
- Normal Game decision with a square hole now displays `G/T0` rather than plain `G`.
- Updated index asset query versions and service-worker cache asset versions to v51 (v50 had stale v48 asset references).
- Existing scoring lookup tables and backend remain unchanged.
- This patch is a targeted correction; it does not claim all score sequences have been exhaustively verified.
