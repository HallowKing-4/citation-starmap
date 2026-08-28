# Citation Star-Map

Fully static, no-backend 3D citation constellation for **network neuroscience / brain connectomics**.

## What is baked

- ~200 real papers from EuropePMC.
- Direct citation and co-citation edges from observed reference lists only.
- Keyword fallback only if bibliographic graph is sparse.
- Louvain communities, ellipsoid coordinates, 700-edge cap at build time.
- Completeness counts; gaps shown, never imputed.

```bash
python3 scripts/build_corpus.py
npm install
npm run dev
```

Static `dist/` publishes to Kimi Websites (`*.kimi.page` / `*.ok.kimi.link`), Vercel, Netlify, or GitHub Pages.
