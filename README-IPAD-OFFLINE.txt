Golf Game — iPad Offline Edition v3
Based on the user's Golf Game PWA v111 source.

WHAT THIS VERSION DOES
- Keeps the existing Golf interface and scoring calculations (Game/Tommy/Buy, Handicap Matrix, Baccarat, score markers and course management).
- Replaces Google Apps Script / Google Sheets runtime access with local-only browser storage on this iPad.
- Stores courses, matches, players, scores, handicaps and local Join Game entries in localStorage.
- Keeps COURSES permanently when match data expires.
- Automatically removes match-linked data older than 3 days when the app next reads its local database.
- Does not include backup/export controls, as requested.
- This is a single-device version: other phones do not sync or join the same live match.

IMPORTANT STORAGE RISK
- The browser's localStorage is the database. If Safari website data is cleared, or the home-screen web app/site data is removed, stored courses and game data may be lost. Re-adding the icon does not restore deleted data.
- iPadOS may evict website data in some circumstances. No browser storage is guaranteed permanent.
- Because backup is disabled by request, data deleted this way may be unrecoverable.

INSTALLATION
1. Keep the current online v111 site unchanged until you have tested this offline package.
2. Publish the files INSIDE this folder to an HTTPS static host (for example, the existing GitHub Pages site). This first publishing/install step requires internet; no paid server is required if using an existing free static host.
3. On iPad, open the HTTPS address in Safari while online. Wait for the app and resources to load.
4. Share -> Add to Home Screen -> Add.
5. Open the new home-screen icon once while online, then turn on Airplane Mode and test it.
6. Add a test course, create a test game and save a score; close/reopen while offline to confirm data remains. Remove test records before real use if desired.

NOTES
- Offline support depends on successful Service Worker installation from HTTPS. A ZIP or file:// URL cannot install a PWA by itself.
- The service worker caches the app shell and required local assets. The app makes no runtime requests to Google Apps Script or Google Sheets.
- The automatic 3-day cleanup runs when the app reads its database; records older than 3 days may be deleted at the next app use. COURSES are not deleted.


Version 4 fix: restored missing UI state and helper declarations that caused the page to turn blank after the intro video. Cache version bumped to v5. Existing localStorage key is unchanged, so this update does not intentionally clear locally saved course or match data.


v9 compatibility fix: CSS inset shorthand has been expanded to top/right/bottom/left properties for older iOS Safari. Asset cache version bumped to v124. This preserves the existing localStorage database key.


v9 update: Baccarat scorecard cells and fonts enlarged specifically for iPad mini 2 tablet widths. Existing local database key is unchanged.

V10: Header displays every player name as a direct perspective button, with Admin first. Update retained. No database changes.


v11 changes: portrait-only spacing between player name buttons and F9/B9 mode buttons; player name buttons wrap/fit up to six players. Landscape layout unchanged.


V12 HOME SCREEN STARTUP FIX
- Startup error handler now loads before app.js.
- Added visible startup fallback for standalone Home Screen mode.
- Cache and asset versions bumped to v129.
- Local database key remains golf-game-offline-db-v1.
