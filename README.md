# Citation Star-Map

Fully static, no-backend 3D citation atlas of **real** network-neuroscience / brain-connectomics papers.

- Corpus retrieved from [OpenAlex](https://openalex.org) at build time (`scripts/fetch_and_build.py`)
- Edges are **never invented**: intra-corpus direct citation, co-citation, and bibliographic coupling
- Keyword co-occurrence is used only as a fallback so isolates are not left unexplained
- Completeness stats are baked into `data/graph.json`
- One full-viewport WebGL hero: `react-force-graph-3d` + Three.js sprites, UnrealBloomPass, starfield dust

Open `index.html` on any static host (Kimi Websites / `*.kimi.page`, GitHub Pages, Vercel). No backend.

## Refresh the corpus

```bash
python3 scripts/fetch_and_build.py
```
