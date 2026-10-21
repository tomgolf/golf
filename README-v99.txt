Golf Game PWA COMPLETE v99 — Manual 7-Day Data Deletion

Based on v98. Changes:
- Automatic cleanup is disabled; no daily cleanup trigger is installed by this package.
- P&L Admin screen: under “Remove Join Game Entry”, added “Delete Data (7+ Days)”.
- Button requires browser confirmation and then verifies the current game creator on the server.
- Deletes MATCHES records older than 7 full days, plus matching PLAYERS, SCORES, HANDICAPS, and JOIN_ENTRIES rows.
- COURSES is permanent and is never read, changed, cleared, or deleted by the cleanup operation. Saved course name, PAR, and Index/SI remain intact.
- The cleanup response reports counts of each deleted record type.
- The legacy 3-day delete API action and trigger installer were removed from the included Apps Script source.
- No Google Sheets data is changed by building this package. GitHub and the deployed Apps Script project have not been modified.

Deployment:
1. Back up the current project.
2. Upload the frontend files to the GitHub Pages root.
3. In Apps Script, replace Code.gs with apps-script/Code.gs and deploy as a new Web App version.
4. Do NOT run any cleanup function manually; the new feature is only initiated by the Admin P&L button and confirmation.
5. Test first with no records older than 7 days, or with a backed-up test copy.

Important:
- The backend action requires the admin name to match the creator of the currently open game.
- Existing time-driven triggers, if any were created previously in the live Apps Script project, must be reviewed and deleted manually in the Triggers page. This package does not have access to your live trigger settings.
- COURSES remains permanent.
