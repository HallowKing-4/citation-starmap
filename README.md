# Citation Star-Map

Fully static 3D citation atlas of real network-neuroscience / brain-connectomics papers.

- `data/graph.json` — baked nodes, Louvain communities, ellipsoid coordinates, edges
- `corpus.zip` — downloadable corpus

Edges come from Crossref reference lists only (direct citation + co-citation). No citations are invented. Keyword co-occurrence is a fallback only if the citation graph is sparse.

Open `index.html` on any static host (`*.kimi.page`, GitHub Pages, Vercel).
