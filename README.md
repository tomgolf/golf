# Golf Game PWA v34 — Clean Complete Package

This package is prepared for a clean GitHub Pages upload.

## Contents

- `index.html`, `app.js`, `styles.css`: PWA entry point and main front-end.
- `style.css`, `manifest.json`, `manifest.webmanifest`, `service-worker.js`, `sw.js`, `home-course.svg`: companion/compatibility assets retained from the current project.
- `apps-script/Golf_Game_Apps_Script_v19.gs`: Google Apps Script backend source.

## GitHub Pages clean upload

1. Download and unzip this package on your computer.
2. Open the extracted folder. **Upload the files and folders inside it** to the GitHub repository's Pages publishing root (usually the repository root). Do not upload the ZIP itself and do not put the files inside an extra `golf-main` folder.
3. If replacing the old front-end, you may delete the old front-end files in the GitHub repository first, then upload all contents of this package. Keep the `apps-script` folder if you want the backend source stored in the repository.
4. Commit the changes and wait for GitHub Pages to publish.
5. Close/reopen the PWA or refresh it after deployment to load the new service-worker cache.

## Important data safety

- Deleting files from GitHub does **not** require deleting or recreating the Google Sheet.
- Do not delete the existing Google Sheet or its `COURSES` data. Course data is meant to be permanent; match data retention is separate.
- The front-end currently points to the existing Apps Script Web App URL. If that deployment is already working, you do not need to redeploy the `.gs` file just to clean GitHub.
- If you choose to update Apps Script, open the existing Apps Script project attached to the current database, review the included source, save, and deploy a new Web App version. Keep the same spreadsheet and ensure the deployed `/exec` URL matches the URL in `app.js`.
- Do not run any cleanup or delete data from Google Sheets as part of the GitHub cleanup.

## Current version

Front-end assets use version/cache v34. This package is a clean packaging of the current v34 project; the scoring rules and existing database schema are not intentionally changed by repackaging.
