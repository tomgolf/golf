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
