# Citation Star-Map

Fully static, no-backend 3D citation star-map of **200 real papers** in network neuroscience / brain connectomics.

Corpus from the [OpenAlex](https://openalex.org) Works API. Edges are baked at build time from `referenced_works` only:

1. **Direct citation** — both endpoints are in the corpus and A lists B.
2. **Co-citation** — a third corpus paper cites both A and B.
3. **Keyword co-occurrence** — used only if (1)+(2) yield fewer than 80 undirected edges.

No edges are invented. Displayed edges are capped to the top 700 by weight × log(degree).

```bash
npm install
npm run dev
```
