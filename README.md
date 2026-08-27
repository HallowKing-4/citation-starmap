# Citation Star-Map

A fully static, no-backend single-page 3D citation map of network neuroscience / brain connectomics.

~200 real Europe PMC papers. Edges computed at build time from reference lists (direct citation + co-citation). Never invented. Keyword co-occurrence only as a labelled fallback.

```bash
python3 scripts/build_corpus.py
npm install
npm run dev
```
