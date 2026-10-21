Golf Game PWA v103

Changes:
- Preserves the v102 mobile Join Game two-column Garmin-style layout.
- Preserves v101 manual Game ID entry and existing 7-day manual deletion feature.
- In F9 and B9 scorecards, adds a rightmost 9-hole total column.
- Player score rows show the sum of recorded strokes for the selected nine holes.
- The existing Gameplay 1 hole-by-hole result row remains in place; its final cell shows that segment's result (F9 +/− score or B9 +/− score), from the current player's perspective and respecting the existing DB multiplier.
- COURSES data and Apps Script backend are unchanged.

Deployment:
Upload the website files to the existing GitHub repository, preserving folder structure. Apps Script does not need redeployment for this frontend-only change. After GitHub Pages publishes, refresh the PWA; if installed as a PWA, close and reopen it or refresh after the new service worker activates.
