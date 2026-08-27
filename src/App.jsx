import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import JSZip from "jszip";
import { authorLine, getFirstAuthor, makeRadialSpriteTexture, placeOnEllipsoid } from "./lib.js";

const GOLD = "rgba(232, 200, 114, 0.16)";
const GOLD_HOT = "rgba(255, 214, 110, 0.85)";

function addStarfield(scene) {
  const count = 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = 420 + Math.random() * 980;
    const u = Math.random() * 2 - 1;
    const v = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(v);
    positions[i * 3 + 1] = r * u * 0.72;
    positions[i * 3 + 2] = r * s * Math.sin(v);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xb7c4ff,
    size: 1.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const dust = new THREE.Points(geom, mat);
  dust.name = "starfield-dust";
  scene.add(dust);
  return dust;
}

export default function App() {
  const fgRef = useRef(null);
  const wrapRef = useRef(null);
  const bloomRef = useRef(null);
  const highlightRef = useRef({
    community: null,
    hoverCommunity: null,
    nodeId: null,
    neighbors: new Set(),
  });
  const texCache = useRef(new Map());
  const setupDone = useRef(false);

  const [corpus, setCorpus] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [community, setCommunity] = useState(null);
  const [hoverCommunity, setHoverCommunity] = useState(null);
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("./corpus.json");
        if (!res.ok) throw new Error(`corpus.json HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const placed = placeOnEllipsoid(data.nodes || [], {
          rx: 240, ry: 155, rz: 200, minDist: 18,
        });
        setCorpus(data);
        setGraphData({ nodes: placed, links: data.links || [] });
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const onWheel = (event) => { event.preventDefault(); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [loading]);

  const getTexture = useCallback((hex) => {
    const key = hex || "#ffffff";
    if (texCache.current.has(key)) return texCache.current.get(key);
    const canvas = makeRadialSpriteTexture(key);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.current.set(key, tex);
    return tex;
  }, []);

  const nodeThreeObject = useCallback((node) => {
    const hl = highlightRef.current;
    const focusComm = hl.community ?? hl.hoverCommunity;
    const isNeighbor = !!hl.nodeId && (node.id === hl.nodeId || hl.neighbors.has(node.id));
    let dim = false;
    if (hl.nodeId) dim = !isNeighbor;
    else if (focusComm != null) dim = node.community !== focusComm;
    const color = dim ? "#3a3a4a" : node.color || "#e8c872";
    const mat = new THREE.SpriteMaterial({
      map: getTexture(color),
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: dim ? 0.18 : 1,
    });
    const sprite = new THREE.Sprite(mat);
    const cites = Math.log1p(node.cited_by_count || 1);
    let scale = 10 + cites * 1.6;
    if (hl.nodeId === node.id) scale *= 1.55;
    else if (isNeighbor) scale *= 1.18;
    sprite.scale.set(scale, scale, 1);
    sprite.userData = { id: node.id };
    return sprite;
  }, [getTexture]);

  const refreshGraph = useCallback(() => {
    const api = fgRef.current;
    if (api && typeof api.refresh === "function") api.refresh();
  }, []);

  useEffect(() => {
    const neighbors = new Set();
    if (selected && graphData.links) {
      graphData.links.forEach((link) => {
        const s = typeof link.source === "object" ? link.source.id : link.source;
        const t = typeof link.target === "object" ? link.target.id : link.target;
        if (s === selected.id) neighbors.add(t);
        if (t === selected.id) neighbors.add(s);
      });
    }
    highlightRef.current = {
      community,
      hoverCommunity,
      nodeId: selected?.id ?? null,
      neighbors,
    };
    refreshGraph();
  }, [community, hoverCommunity, selected, graphData.links, refreshGraph]);

  const onEngineStop = useCallback(() => {
    const api = fgRef.current;
    if (!api || setupDone.current) return;
    setupDone.current = true;
    try {
      const scene = api.scene();
      if (!scene.getObjectByName("starfield-dust")) addStarfield(scene);
      const composer = api.postProcessingComposer();
      if (composer && !bloomRef.current) {
        const pass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          1.35, 0.55, 0.18
        );
        composer.addPass(pass);
        bloomRef.current = pass;
      }
      const controls = api.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.42;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
      }
      api.cameraPosition({ x: 0, y: 36, z: 430 }, { x: 0, y: 0, z: 0 }, 2200);
      window.setTimeout(() => {
        api.cameraPosition({ x: 18, y: 22, z: 292 }, { x: 0, y: 0, z: 0 }, 2400);
      }, 700);
    } catch (err) {
      console.warn("postprocess setup", err);
    }
  }, []);

  useEffect(() => {
    if (!graphData.nodes.length) return undefined;
    const t = window.setTimeout(() => {
      if (!setupDone.current && fgRef.current) onEngineStop();
    }, 400);
    return () => window.clearTimeout(t);
  }, [graphData.nodes.length, onEngineStop]);

  const linkColor = useCallback((link) => {
    const hl = highlightRef.current;
    if (!hl.nodeId) return GOLD;
    const s = typeof link.source === "object" ? link.source.id : link.source;
    const t = typeof link.target === "object" ? link.target.id : link.target;
    if (s === hl.nodeId || t === hl.nodeId) return GOLD_HOT;
    return "rgba(232, 200, 114, 0.035)";
  }, []);

  const linkWidth = useCallback((link) => {
    const hl = highlightRef.current;
    if (!hl.nodeId) return 0.18;
    const s = typeof link.source === "object" ? link.source.id : link.source;
    const t = typeof link.target === "object" ? link.target.id : link.target;
    return s === hl.nodeId || t === hl.nodeId ? 0.7 : 0.08;
  }, []);

  const onNodeClick = useCallback((node) => {
    setSelected(node);
    setCommunity(null);
    const api = fgRef.current;
    if (api && node) {
      api.cameraPosition(
        { x: node.x, y: node.y + 12, z: node.z + 90 },
        { x: node.x, y: node.y, z: node.z },
        900
      );
    }
  }, []);

  const onBackgroundClick = useCallback(() => {
    setSelected(null);
    setCommunity(null);
    setHoverCommunity(null);
  }, []);

  const downloadCorpus = useCallback(async () => {
    if (!corpus) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      zip.file("corpus.json", JSON.stringify(corpus, null, 2));
      zip.file("corpus-meta.json", JSON.stringify(corpus.meta || {}, null, 2));
      zip.file("papers.jsonl", (corpus.nodes || []).map((n) => JSON.stringify(n)).join("\n"));
      zip.file("README.txt", "Citation Star-Map corpus. Europe PMC. No invented citations.\n");
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "connectomics-citation-starmap-corpus.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }, [corpus]);

  const communities = corpus?.communities || [];
  const meta = corpus?.meta;
  const counts = meta?.counts || {};
  const completeness = meta?.completeness;
  const statsLine = useMemo(() => {
    if (!meta) return "";
    return `${counts.papers || 0} papers · ${counts.edges_kept || 0} edges · ${counts.citation || 0} citations · ${counts.co_citation || 0} co-citations`;
  }, [meta, counts]);

  if (loading) {
    return (
      <div className="hero">
        <div className="status">
          <p className="eyebrow">Network neuroscience</p>
          <h2>Igniting the citation star-map…</h2>
          <p>Loading baked corpus and lighting the sprites.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="hero">
        <div className="status">
          <h2>Corpus missing</h2>
          <p>{String(loadError.message || loadError)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero">
      <div className="canvas-wrap" ref={wrapRef}>
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          backgroundColor="#03040a"
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          nodeLabel={(n) => `${n.title}\n${getFirstAuthor(n.authors)} · ${n.year || "n.d."}`}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkOpacity={0.22}
          cooldownTicks={0}
          d3AlphaDecay={1}
          enableNodeDrag={false}
          enableNavigationControls
          showNavInfo={false}
          onEngineStop={onEngineStop}
          onNodeClick={onNodeClick}
          onBackgroundClick={onBackgroundClick}
        />
      </div>
      <div className="hud">
        <header className="brand">
          <p className="eyebrow">Citation star-map</p>
          <h1>Network neuroscience &amp; the connectome</h1>
          <p>Real papers. Edges computed at build time from Europe PMC reference lists — never invented. Gold threads stay faint so the jewels can breathe.</p>
        </header>
        <div className="toolbar">
          <button type="button" onClick={downloadCorpus} disabled={downloading}>
            {downloading ? "Packing…" : "Download corpus"}
          </button>
        </div>
        {selected ? (
          <aside className="card">
            <p className="eyebrow">{selected.journal || "Journal"} · {selected.year || "n.d."}</p>
            <h3>{selected.title}</h3>
            <p className="byline">{authorLine(selected.authors)} · cited {selected.cited_by_count || 0}</p>
            <div className="abstract">{selected.abstract || "No abstract recovered for this record."}</div>
            <div className="card-actions">
              <a className="btn" href={selected.url} target="_blank" rel="noreferrer">Open paper</a>
              <button type="button" onClick={() => setSelected(null)}>Close</button>
            </div>
            <p className="meta-line">Refs retrieved: {selected.reference_count_retrieved || 0}{selected.doi ? ` · ${selected.doi}` : ""}</p>
          </aside>
        ) : null}
        <div className="legend">
          <h2>Louvain communities</h2>
          <div className="legend-row">
            {communities.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${community === c.id ? "active" : ""}`}
                onMouseEnter={() => setHoverCommunity(c.id)}
                onMouseLeave={() => setHoverCommunity(null)}
                onClick={() => setCommunity((cur) => (cur === c.id ? null : c.id))}
              >
                <span className="swatch" style={{ background: c.color, color: c.color }} />
                {c.label}
                <span style={{ opacity: 0.55 }}>{c.size}</span>
              </button>
            ))}
          </div>
          <div className="meta-line">{statsLine}</div>
          {completeness ? (
            <div className="completeness">
              <span>Abstracts <b>{completeness.abstracts.pct}%</b></span>
              <span>DOIs <b>{completeness.doi.pct}%</b></span>
              <span>Reference lists <b>{completeness.reference_lists.pct}%</b></span>
              <span>Fallback keywords <b>{meta?.edge_policy?.fallback_used ? "used" : "not needed"}</b></span>
            </div>
          ) : null}
        </div>
        <div className="hint">Drag to orbit · scroll to zoom · click a star</div>
      </div>
    </div>
  );
}
