# Golf Game v57 — GG Priority Fix

Based on the prior v55 project. This update corrects continuous TO-GO challenge handling and mobile status layout.

## Match-status cases checked
- F9 TO-GO example: `2DW/2GO` followed by a loss => `G/T-1`, final hole => `T-1`.
- B9 TO-GO example: `3DW/3GO` followed by a win => `T+1`; square on next hole => `G/T+1`; final hole => `T+1/B0`.
- A normal TO-GO challenge does not switch to GG/Satay merely because the match becomes mathematically uncatchable after the challenge began.
- TO-GO states render on two lines (e.g. `1UP` above `1GO`) to prevent overlap on mobile.

JavaScript syntax checked with `node --check app.js`. The match-status scenarios above were run in a local mocked-outcome harness. This is not a live Google Sheets end-to-end test; verify against real saved scores before publishing.


## v55 Match regression fix
- Tommy after a TO-GO baseline is derived from the handicap-adjusted match-margin change, not a fresh raw hole win/loss count.
- Buy after Game is derived from match-margin change since the Game-decision hole.
- Service-worker registration, cache name, and asset query versions updated to v55.


## v57 GG fix
- GG has priority over normal TO-GO / Tommy / Buy calculation once lead margin is greater than holes remaining after a completed hole.
- On GG, Tommy and Buy are zero; Satay compares the remaining holes after GG and settles +2 / -2 / 0.
- Service worker cache bumped to v57.

## v65 Baccarat participation persistence fix

This release updates both the PWA frontend and the Google Apps Script backend.

Important: updating GitHub Pages alone is not enough for this fix. Copy `apps-script/Golf_Game_Apps_Script_v20_Baccarat_Participation.gs` into the Apps Script project connected to the Google Sheet, save, then create a new deployment version of the Web App and ensure the PWA's API URL points to that deployment. The save action now verifies that every selected match player row was updated and reports a failure instead of silently accepting a partial save.


## v66 Baccarat participation fix (important)

This release fixes the New Game Handicap Matrix so reopening it preserves the Baccarat player selections during setup.

The live Apps Script must also be updated: the frontend uses the `saveBaccaratPlayers` POST action. If the site shows `Unknown action: saveBaccaratPlayers`, the deployed Apps Script version is older than this package. Open `apps-script/Golf_Game_Apps_Script_v20_Baccarat_Participation.gs`, replace the code in the Apps Script project, save, then Deploy > Manage deployments > Edit > select New version > Deploy. Keep the same `/exec` deployment URL configured in `app.js` (or update it if you created a new deployment).

Test: in New Game, enter all player names, open Handicap, untick Piew and Dennis, Save, reopen Handicap and verify they remain unticked, then Start. For an existing match, repeat in the in-game Handicap Matrix and verify the PLAYERS sheet `baccarat_enabled` column stores TRUE/FALSE.

## v67 Join Game remembered details
- Join Game restores the last successful Game ID and player name from this device.
- Successful Join Game and New Game actions update the remembered Game ID/name.
- The fields remain editable, so a different game can be entered at any time.
- This is device-local storage; it does not automatically log the user in or bypass server validation.


## v78 DB checkbox placement and Apps Script deployment
- The DB checkbox/DB marker is now in a dedicated column immediately after Opponent, as in the approved design. It is no longer inside the Total cell.
- The Apps Script source in `apps-script/Golf_Game_Apps_Script_v20_Baccarat_Participation.gs` includes the `saveResultDouble` action. The screenshot error `Unknown action: saveResultDouble` means the deployed Apps Script Web App is still running an older version (or a different script project). Replace the deployed script source with this file, then use Deploy > Manage deployments > Edit > New version > Deploy. Keep the same Web App URL configured in the frontend.


## v83 P&L
- Adds P&L tab after Baccarat. Creator can view all players and change shared multipliers; regular players can view only their own P&L.
- Default Game multiplier 10 and Baccarat multiplier 5. Settings are stored in the MATCHES sheet in the `pnl_settings` column.
- Update both GitHub Pages frontend and Apps Script backend, then redeploy Apps Script as a new Web App version.


## v84 Join Game feedback fix
- Join now shows validation, API errors, and a timeout message instead of failing silently.
- The Join button shows “Joining…” while the request is in progress.
