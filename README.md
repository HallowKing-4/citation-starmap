# Citation Star-Map

Fully static 3D citation star-map for network neuroscience / brain connectomics.

- 200 real papers from Crossref (abstracts filled from Europe PMC when missing)
- Edges computed at build time from real reference DOIs: direct citation + co-citation
- Display capped at 700 gold edges so links stay a faint background
- No backend. Open `index.html` or any static host.

Rebuild corpus:

```bash
python3 scripts/build_corpus.py
```
