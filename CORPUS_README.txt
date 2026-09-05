Citation Star-Map corpus
========================
Field: network neuroscience / brain connectomics
Built: from Europe PMC + Crossref (no invented citations)

Files
-----
papers.json         200 real papers (title, authors, year, DOI, abstract, referenced DOIs)
graph.json          baked 3D graph (nodes, capped edges, Louvain communities, positions)
completeness.json   coverage metrics for abstracts, DOIs, reference lists, edge types

Edge policy
-----------
1. Direct citation: paper A in corpus lists paper B's DOI in its Crossref reference list.
2. Co-citation: a third corpus paper cites both A and B.
3. Keyword co-occurrence is used ONLY if (1)+(2) yield fewer than 80 undirected edges.
   This build did NOT need the keyword fallback.

Displayed edges are capped to the top 700 by weight × degree. This build had 576
undirected merged edges, so all of them are shown.

Never invented: an edge exists only when the bibliographic record supports it.
