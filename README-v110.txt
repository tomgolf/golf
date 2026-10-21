Golf Game PWA v110 — Mobile score rings and reward markers

Fixes:
- Score rings are smaller and sized for mobile score cells, with the number centered inside the ring.
- Red dots are anchored to the upper-right edge of the circle/score marker, not positioned relative to the whole cell.
- Double 3 / Double 5 calculation is restricted to the active nine-hole section (holes 1–9 for F9, holes 10–18 for B9). If both corresponding Par 3 / Par 5 scores are Par or better, the dot appears only on the second matching hole in that nine.
- Individual Birdie, Eagle, Albatross-or-better and Par-3 hole-in-one dots remain on their own score cells.
- Relative-to-Par input and backend gross-stroke storage/calculations are preserved.

Deployment: upload website files from this ZIP to the existing GitHub repository, preserving folder structure. Wait for GitHub Pages and hard refresh (Ctrl+F5). Apps Script redeployment is not required.
