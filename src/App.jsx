import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StarMap from './StarMap.jsx';
import { formatAuthors, getFirstAuthor } from './authors.js';

const JEWELS = ['#f43f5e', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#818cf8'];

export default function App() {
  const wrapRef = useRef(null);
  const graphApiRef = useRef(null);
  const [graph, setGraph] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoverComm, setHoverComm] = useState(null);
  const [pinnedComm, setPinnedComm] = useState(null);
  const [neighborSet, setNeighborSet] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('./graph.json')
      .then((r) => { if (!r.ok) throw new Error('graph.json HTTP ' + r.status); return r.json(); })
      .then((data) => { if (!cancelled) setGraph(data); })
      .catch((err) => { if (!cancelled) setLoadError(err); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const onWheel = (event) => { event.preventDefault(); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const activeComm = pinnedComm != null ? pinnedComm : hoverComm;

  const neighborLookup = useMemo(() => {
    const map = new Map();
    if (!graph?.links) return map;
    for (const link of graph.links) {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s).add(t);
      map.get(t).add(s);
    }
    return map;
  }, [graph]);

  const selected = useMemo(() => {
    if (!graph || !selectedId) return null;
    return graph.nodes.find((n) => n.id === selectedId) || null;
  }, [graph, selectedId]);

  const onNodeClick = useCallback((node) => {
    if (!node) { setSelectedId(null); setNeighborSet(null); return; }
    setSelectedId(node.id);
    const neigh = new Set(neighborLookup.get(node.id) || []);
    neigh.add(node.id);
    setNeighborSet(neigh);
  }, [neighborLookup]);

  const onBackgroundClick = useCallback(() => { setSelectedId(null); setNeighborSet(null); }, []);
  const refreshObjects = useCallback(() => { graphApiRef.current?.refresh?.(); }, []);
  useEffect(() => { refreshObjects(); }, [activeComm, neighborSet, selectedId, refreshObjects]);

  const completeness = graph?.completeness;
  const communities = graph?.communities || [];

  return (
    <div className="hero" ref={wrapRef}>
      {loadError ? (<div className="fatal inner"><div><h1>Could not load corpus</h1><p>{String(loadError.message || loadError)}</p><a className="btn" href="./corpus.zip" download>Download corpus</a></div></div>) : null}
      {!loadError && !graph ? <div className="boot">Igniting star-map…</div> : null}
      {graph ? (<StarMap graph={graph} jewels={JEWELS} activeComm={activeComm} selectedId={selectedId} neighborSet={neighborSet} onNodeClick={onNodeClick} onBackgroundClick={onBackgroundClick} apiRef={graphApiRef} />) : null}
      <header className="hud top-left"><p className="kicker">Citation star-map</p><h1>Network neuroscience</h1><p className="sub">{graph ? graph.nodes.length : '—'} real papers · edges baked at build time · never invented</p></header>
      <aside className="hud legend"><p className="legend-title">Louvain communities</p><ul>{communities.map((c) => { const color = JEWELS[c.id % JEWELS.length]; const on = activeComm == null || activeComm === c.id; return (<li key={c.id}><button type="button" className={on && activeComm === c.id ? 'comm on' : 'comm'} style={{ opacity: on ? 1 : 0.35 }} onMouseEnter={() => setHoverComm(c.id)} onMouseLeave={() => setHoverComm(null)} onClick={() => setPinnedComm((prev) => (prev === c.id ? null : c.id))}><span className="swatch" style={{ background: color }} /><span className="comm-label">{c.label}</span><span className="comm-n">{c.size}</span></button></li>); })}</ul><p className="hint">Hover to isolate · click to pin</p></aside>
      <div className="hud meta">{completeness ? (<dl><div><dt>Direct citations</dt><dd>{completeness.direct_citation_pairs}</dd></div><div><dt>Edges shown</dt><dd>{completeness.edges_emitted}/{completeness.cap}</dd></div><div><dt>Invented</dt><dd>{completeness.invented_edges}</dd></div><div><dt>Fallback</dt><dd>{completeness.fallback_used ? 'keyword co-occ.' : 'off'}</dd></div></dl>) : null}<a className="btn" href="./corpus.zip" download>Download corpus</a></div>
      {selected ? (<article className="card"><button type="button" className="close" onClick={() => { setSelectedId(null); setNeighborSet(null); }} aria-label="Close paper">×</button><p className="card-kicker">{selected.year || '—'} · {selected.journal || 'journal'}</p><h2>{selected.title}</h2><p className="byline">{formatAuthors(selected.authors)}<span className="first"> · first {getFirstAuthor(selected.authors)}</span></p><p className="abstract">{selected.abstract}</p><div className="card-actions"><a className="btn primary" href={selected.url} target="_blank" rel="noreferrer">Open paper</a>{selected.doi ? <span className="doi">{selected.doi}</span> : <span className="doi">PMID {selected.id}</span>}</div></article>) : null}
    </div>
  );
}
