# Citation Star-Map

Fully static 3D citation map of ~200 real PubMed papers in network neuroscience / brain connectomics.

Edges are computed at build time from NCBI `pubmed_pubmed_refs` (direct citation, co-citation, bibliographic coupling). No invented edges.

```
python3 scripts/build_corpus.py
npm install
npm run build
```
