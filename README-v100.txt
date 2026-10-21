Golf Game PWA v100 - Game ID loading fix

Based on v99 manual deletion (7+ days). Keeps manual deletion behavior.
Fixes New Game Game ID loading by using JSONP for getNextGameId to avoid CORS/fetch hangs.
Shows an explicit error if the active Apps Script deployment does not return match_id.

Deploy:
1. Publish frontend files to your existing GitHub Pages location.
2. Deploy apps-script/Code.gs (or Golf_Game_Apps_Script_Code_v99.gs) as a NEW Apps Script Web App version.
3. Verify the API URL in app.js matches the deployed Web App URL. If the URL changes, update API in app.js.
4. Reload the PWA and, if stale content remains, close/reopen or refresh the installed PWA to pick up service worker v100.

Safety:
- No deletion runs automatically.
- Manual Delete Data (7+ Days) remains a user-confirmed action.
- COURSES is not touched by the manual delete endpoint.
