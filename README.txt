Golf Game v84 - Mobile P&L Update

This package contains the two replacement files based on the files provided:
- app.js
- styles.css

Changes:
- Updated the Google Apps Script API endpoint to the new URL supplied by the user.
- Creator view keeps the full P&L matrix on desktop/tablet.
- On screens <= 640px, Creator view switches to independent player cards.
- Positive P&L values are blue; negative values are red; zero/dash values are dark neutral.
- Existing scoring calculations and multiplier settings are retained from the provided app.js.

How to deploy:
1. Back up the current app.js and styles.css from your GitHub repository.
2. Replace the repository's app.js with this package's app.js.
3. Replace the repository's styles.css with this package's styles.css.
4. Commit the two files and wait for GitHub Pages to publish.
5. Reload the site on your phone. If an old version remains cached, close the page and reopen it, or clear the site's cache.

Important:
This package only includes the two files uploaded in the conversation and the changes applied to them. It does not include index.html, icons, manifest, service worker, or other repository assets because those files were not provided here. Keep all other project files unchanged.
