import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { authorLine, getFirstAuthor, neighborSet, paperHref, placeOnEllipsoid } from "./helpers";
import { addStarfield, makeStarSprite } from "./glow";
import { downloadZip } from "./zip";

const GOLD = "rgba(212,175,55,0.11)";
const GOLD_HOT = "rgba(255,214,90,0.55)";

export default function App() {
  const fgRef = useRef(null);
  const wrapRef = useRef(null);
  const bloomRef = useRef(false);
  const nodeObjectFn = useRef(null);
  const wheelBound = useRef(false);
  const [raw, setRaw] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [dims, setDims] = useState(() => ({
    w: typeof window === "undefined" ? 1280 : window.innerWidth,
    h: typeof window === "undefined" ? 720 : window.innerHeight,
  }));
  const [hoverComm, setHoverComm] = useState(null);
  const [pinnedComm, setPinnedComm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [highlight, setHighlight] = useState(null);

  useEffect(() => {
    let alive = true;
    const grab = (url, fallback) =>
      fetch(url).then((r) => {
        if (!r.ok) {
          if (fallback !== undefined) return fallback;
          throw new Error(`${url} ${r.status}`);
        }
        return r.json();
      });
    Promise.all([
      grab("./data/nodes-a.json"),
      grab("./data/nodes-b.json"),
      grab("./data/links.json"),
      grab("./data/meta.json"),
      grab("./data/abstracts-a.json", {}),
      grab("./data/abstracts-b.json", {}),
    ])
      .then(([nodesA, nodesB, links, meta, absA, absB]) => {
        if (!alive) return;
        const abstracts = { ...(absA || {}), ...(absB || {}) };
        const nodes = [...(nodesA || []), ...(nodesB || [])];
        for (const node of nodes) {
          if (!node.abstract && abstracts[node.id]) node.abstract = abstracts[node.id];
        }
        placeOnEllipsoid(nodes);
        setRaw({
          nodes,
          links: links || [],
          communities: meta.communities || [],
          completeness: meta.completeness || {},
        });
      })
      .catch((err) => {
        if (alive) setLoadError(err);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    const lockWheel = (e) => { e.preventDefault(); };
    window.addEventListener("resize", onResize);
    document.addEventListener("wheel", lockWheel, { passive: false });
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("wheel", lockWheel);
    };
  }, []);

  const colorByComm = useMemo(() => {
    const map = new Map();
    (raw?.communities || []).forEach((c) => map.set(c.id, c.color));
    return map;
  }, [raw]);
  const activeComm = pinnedComm ?? hoverComm;
  const graphData = useMemo(() => {
    if (!raw) return { nodes: [], links: [] };
    return { nodes: raw.nodes, links: raw.links };
  }, [raw]);

  const buildNodeObject = useCallback((node) => {
    const color = colorByComm.get(node.community) || "#8aa4ff";
    const isSel = selected && node.id === selected.id;
    const inNeigh = highlight ? highlight.has(node.id) : true;
    const commDim = activeComm == null ? false : node.community !== activeComm;
    const dim = commDim || (highlight && !inNeigh);
    const cites = node.cited_by_count || 1;
    const base = 9 + Math.min(16, Math.log1p(cites) * 1.35);
    const scale = isSel ? base * 1.65 : dim ? base * 0.72 : base;
    const opacity = dim ? 0.16 : isSel ? 1 : 0.95;
    return makeStarSprite(color, scale, opacity);
  }, [activeComm, colorByComm, highlight, selected]);

  nodeObjectFn.current = buildNodeObject;

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !raw) return undefined;
    if (typeof fg.refresh === "function") fg.refresh();
    return undefined;
  }, [activeComm, highlight, selected, raw, buildNodeObject]);

  const handleEngineStop = useCallback(() => {
    const fg = fgRef.current;
    if (!fg || bloomRef.current) return;
    try {
      const composer = fg.postProcessingComposer();
      const bloom = new UnrealBloomPass(new THREE.Vector2(dims.w, dims.h), 1.25, 0.52, 0.22);
      composer.addPass(bloom);
      addStarfield(fg.scene(), 1800);
      bloomRef.current = true;
    } catch (err) {
      console.warn("bloom/starfield skipped", err);
    }
  }, [dims.w, dims.h]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !raw) return undefined;
    const controls = fg.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = true;
      controls.enableZoom = true;
    }
    fg.cameraPosition({ x: 0, y: 28, z: 430 }, { x: 0, y: 0, z: 0 }, 1800);
    const el = fg.renderer()?.domElement;
    if (!el || wheelBound.current) return undefined;
    const onWheel = (e) => { e.preventDefault(); };
    el.addEventListener("wheel", onWheel, { passive: false });
    wheelBound.current = true;
    return () => {
      el.removeEventListener("wheel", onWheel);
      wheelBound.current = false;
    };
  }, [raw]);

  const onNodeClick = useCallback((node) => {
    if (!node || !raw) return;
    setSelected(node);
    setHighlight(neighborSet(raw.links, node.id));
    const fg = fgRef.current;
    if (fg && Number.isFinite(node.x)) {
      const dist = 90;
      const cam = fg.camera();
      const view = cam.position.clone().sub(new THREE.Vector3(node.x, node.y, node.z)).setLength(dist);
      fg.cameraPosition({ x: node.x + view.x, y: node.y + view.y, z: node.z + view.z }, { x: node.x, y: node.y, z: node.z }, 900);
    }
  }, [raw]);

  const onBackgroundClick = useCallback(() => {
    setSelected(null);
    setHighlight(null);
  }, []);

  const linkColor = useCallback((link) => {
    if (!highlight) return GOLD;
    const s = typeof link.source === "object" ? link.source.id : link.source;
    const t = typeof link.target === "object" ? link.target.id : link.target;
    return highlight.has(s) && highlight.has(t) ? GOLD_HOT : "rgba(212,175,55,0.03)";
  }, [highlight]);
  const linkWidth = useCallback((link) => {
    if (!highlight) return 0.16;
    const s = typeof link.source === "object" ? link.source.id : link.source;
    const t = typeof link.target === "object" ? link.target.id : link.target;
    return highlight.has(s) && highlight.has(t) ? 0.55 : 0.07;
  }, [highlight]);
  const linkVisibility = useCallback((link) => {
    if (activeComm == null) return true;
    const s = typeof link.source === "object" ? link.source : null;
    const t = typeof link.target === "object" ? link.target : null;
    if (!s || !t) return true;
    return s.community === activeComm || t.community === activeComm;
  }, [activeComm]);
  const nodeLabel = useCallback((node) => {
    const author = getFirstAuthor(node.authors ?? node.firstAuthor);
    return `${author} (${node.year || "n.d."})\n${node.title}`;
  }, []);

  const handleDownload = useCallback(() => {
    Promise.all([
      fetch("./data/corpus.json").then((r) => (r.ok ? r.text() : "")),
      fetch("./data/graph-core.json").then((r) => (r.ok ? r.text() : "")),
      fetch("./data/nodes-a.json").then((r) => (r.ok ? r.text() : "[]")),
      fetch("./data/nodes-b.json").then((r) => (r.ok ? r.text() : "[]")),
      fetch("./data/links.json").then((r) => (r.ok ? r.text() : "[]")),
      fetch("./data/meta.json").then((r) => (r.ok ? r.text() : "{}")),
      fetch("./data/abstracts-a.json").then((r) => (r.ok ? r.text() : "{}")),
      fetch("./data/abstracts-b.json").then((r) => (r.ok ? r.text() : "{}")),
    ]).then((texts) => {
      const names = ["corpus.json","graph-core.json","nodes-a.json","nodes-b.json","links.json","meta.json","abstracts-a.json","abstracts-b.json"];
      const files = [{ name: "README.txt", text: "Citation Star-Map corpus from OpenAlex.\nNo invented edges.\n\n" + JSON.stringify(raw?.completeness || {}, null, 2) + "\n" }];
      texts.forEach((t, i) => { if (t && t !== "[]" && t !== "{}") files.push({ name: names[i], text: t }); });
      downloadZip("connectomics-corpus.zip", files);
    });
  }, [raw]);

  const completeness = raw?.completeness || {};
  const selectedHref = paperHref(selected);

  if (loadError) {
    return (
      <div className="fatal">
        <div className="fatal-card">
          <p className="eyebrow">Corpus missing</p>
          <h1>Could not load graph.json</h1>
          <p className="fatal-msg">{String(loadError.message || loadError)}</p>
        </div>
      </div>
    );
  }
  if (!raw) {
    return (
      <div className="hero loading-hero">
        <p className="eyebrow">Network neuroscience</p>
        <h1>Lighting the citation star-map…</h1>
      </div>
    );
  }

  return (
    <div className="hero" ref={wrapRef}>
      <ForceGraph3D
        ref={fgRef}
        width={dims.w}
        height={dims.h}
        graphData={graphData}
        backgroundColor="#05060c"
        showNavInfo={false}
        nodeThreeObject={(node) => nodeObjectFn.current(node)}
        nodeThreeObjectExtend={false}
        nodeLabel={nodeLabel}
        nodeVal={(n) => Math.log1p(n.cited_by_count || 1)}
        onNodeClick={onNodeClick}
        onBackgroundClick={onBackgroundClick}
        onEngineStop={handleEngineStop}
        cooldownTicks={0}
        warmupTicks={0}
        enableNodeDrag={false}
        enableNavigationControls
        linkColor={linkColor}
        linkOpacity={1}
        linkWidth={linkWidth}
        linkVisibility={linkVisibility}
        linkDirectionalParticles={0}
      />
      <header className="hud hud-tl">
        <p className="eyebrow">Citation star-map</p>
        <h1>Network neuroscience / brain connectomics</h1>
        <p className="lede">
          {completeness.papersRetrieved} real papers from OpenAlex. Edges baked at
          build time from in-corpus citations and co-citation — never invented.
        </p>
        <button type="button" className="btn" onClick={handleDownload}>Download corpus</button>
      </header>
      <aside className="hud hud-bl completeness">
        <p className="eyebrow">Data completeness</p>
        <ul>
          <li><span>Abstracts</span><b>{completeness.papersWithAbstract}/{completeness.papersRetrieved}</b></li>
          <li><span>DOIs</span><b>{completeness.papersWithDoi}/{completeness.papersRetrieved}</b></li>
          <li><span>Papers with in-corpus refs</span><b>{completeness.papersWithInCorpusReferences}</b></li>
          <li><span>Direct citation edges</span><b>{completeness.directCitationEdgesKept}<em> / {completeness.directCitationEdgesFound} found</em></b></li>
          <li><span>Co-citation edges</span><b>{completeness.cocitationEdgesKept}<em> / {completeness.cocitationEdgesFound} found</em></b></li>
          <li><span>Keyword fallback</span><b>{completeness.keywordFallbackUsed ? "used" : "not needed"}</b></li>
          <li><span>Edges after cap</span><b>{completeness.edgesAfterCap}<em> / {completeness.edgeCap}</em></b></li>
        </ul>
        <p className="tiny">{completeness.source}</p>
      </aside>
      <aside className="hud hud-br legend">
        <p className="eyebrow">Louvain communities</p>
        <ul>
          {(raw.communities || []).map((c) => {
            const on = activeComm == null || activeComm === c.id;
            return (
              <li key={c.id}>
                <button type="button" className={on ? "comm on" : "comm dim"} onMouseEnter={() => setHoverComm(c.id)} onMouseLeave={() => setHoverComm(null)} onClick={() => setPinnedComm((cur) => (cur === c.id ? null : c.id))}>
                  <i style={{ background: c.color }} />
                  <span>{c.label}</span>
                  <em>{c.size}</em>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="tiny">Hover to isolate · click to pin</p>
      </aside>
      {selected && (
        <article className="detail">
          <button type="button" className="close" onClick={onBackgroundClick} aria-label="Close">×</button>
          <p className="eyebrow">{getFirstAuthor(selected.authors ?? selected.firstAuthor)} · {selected.year || "n.d."}</p>
          <h2>{selected.title}</h2>
          <p className="meta">{authorLine(selected.authors)} · cited {selected.cited_by_count}{selected.doi ? ` · ${selected.doi}` : ""}</p>
          <p className="abstract">{selected.abstract || "No abstract in the baked corpus."}</p>
          {selectedHref ? <a className="btn" href={selectedHref} target="_blank" rel="noopener noreferrer">Open paper</a> : null}
        </article>
      )}
    </div>
  );
}
