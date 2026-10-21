Golf Game PWA v108 — Double 3 / Double 5 second-hole marker

- F9/B9 Par-or-better scores use a larger neon-lime ring.
- Birdie, Eagle, Albatross or better, and a hole-in-one on Par 3 get a red dot on their own score cell.
- Double 3 is judged from that player's two Par-3 scores; if both are Par or better, show a red dot only on the second Par 3.
- Double 5 follows the same rule for the two Par-5 holes; dot only the second Par 5.
- Example: Par 3 scores 1 and 0 => no Double 3 dot. Scores 0 and 0 => dot on the second Par 3 only.
- Relative-to-Par input and backend gross-stroke conversion are preserved.
- Apps Script does not need redeployment.

Deployment: upload the website files from this ZIP to the existing GitHub repository, preserve the folder structure, wait for GitHub Pages, then hard refresh (Ctrl+F5).
