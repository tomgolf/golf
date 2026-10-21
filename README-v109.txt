Golf Game PWA v109 — Score ring alignment fix

- Corrects F9/B9 neon score circles to be centered and fully contained inside each score cell, matching the approved second reference image.
- Red reward dots are positioned at the upper-right of the score marker/cell and should no longer be cut by grid lines.
- Preserves relative-to-Par score display and backend gross-stroke conversion.
- Preserves Double 3 / Double 5 logic: evaluate both matching par holes per player and mark only the second Par 3 / Par 5 when both scores are Par or better.
- Preserves other scoring and Total column behavior.

Deploy by uploading the website files from this ZIP to the existing GitHub repository with folder structure preserved. Wait for GitHub Pages, then Ctrl+F5. Apps Script redeployment is not required.
