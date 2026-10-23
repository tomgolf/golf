Golf Game PWA — v113 Safe Cleanup Build

Purpose
- Online PWA frontend for GitHub Pages.
- Google Apps Script remains the backend; Google Sheets remains the data store.
- This package does not deploy or modify GitHub, Apps Script, or Google Sheets automatically.

What is included
- index.html, styles.css, app.js: website frontend.
- sw.js: service worker and resource caching.
- manifest.webmanifest and icons/: PWA metadata and icons.
- home-golf-hero.jpg, home-course.svg, tom-jerry-golf-intro.mp4: referenced home-page assets.
- apps-script/Code.gs: reference copy of Apps Script source; it is not automatically deployed by uploading the website files.

Safe cleanup changes in this package
- Removed obsolete version-specific README files and historical Apps Script source copies that duplicated or could be confused with the current reference copy.
- Aligned the service-worker registration query and pre-cached CSS/JavaScript resource query strings with v113 to avoid stale/mismatched asset keys.
- Kept app.js, styles.css, manifest.webmanifest, all referenced media/icons, and apps-script/Code.gs byte-for-byte unchanged.
- No scoring rules, permissions, data model, API endpoint, or backend request code were intentionally changed.

Deploying the online frontend
1. Keep a backup of the currently working website files.
2. Extract this ZIP.
3. Upload the website files and folders to the existing GitHub repository, preserving the directory structure. The apps-script folder is reference source only; it is not needed for the GitHub Pages website deployment unless you intentionally keep it in the repository.
4. Wait for GitHub Pages to publish, then reload the PWA.
5. If an installed PWA continues showing old assets, close it fully and reopen it. If necessary, clear the site's cached data in the browser and reload.

Important protections
- Do not redeploy Apps Script as part of this frontend update.
- Do not change the Apps Script /exec endpoint or Google Sheets configuration.
- Course records (course name, 18-hole PAR and SI) are intended to remain permanent; match-data cleanup must not delete course records.
- This README describes the package contents; it does not claim that a live browser/API regression test has been performed.

Validation performed on this package
- JavaScript syntax checks for app.js and sw.js.
- ZIP integrity and file-reference checks.
- API endpoint/configuration comparison against the uploaded v113 source.
- Functional browser tests, live Google Sheets read/write tests, and measured performance benchmarks were not performed as part of this package build.
