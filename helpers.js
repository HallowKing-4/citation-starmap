export function getFirstAuthor(authors, fallback = "") {
  if (Array.isArray(authors)) {
    const first = authors.find((a) => typeof a === "string" && a.trim());
    if (first) return first.trim();
  }
  if (typeof authors === "string" && authors.trim()) {
    const chunk = authors.split(/,|;|\sand\s/i)[0];
    return (chunk || authors).trim();
  }
  if (fallback && typeof fallback === "string") return fallback.trim();
  return "Unknown";
}

export function authorLine(authors, firstAuthor) {
  const lead = getFirstAuthor(authors, firstAuthor);
  if (Array.isArray(authors) && authors.length > 1) return `${lead} et al.`;
  if (typeof authors === "string" && /[,;]| and /i.test(authors)) return `${lead} et al.`;
  return lead;
}

export function paperHref(node) {
  if (!node) return "";
  const doi = node.doi || "";
  if (doi) {
    return doi.startsWith("http")
      ? doi
      : `https://doi.org/${doi.replace(/^https?:\/\/doi.org\//, "")}`;
  }
  if (node.url) return node.url;
  if (node.oaUrl) return node.oaUrl;
  if (node.id) return `https://openalex.org/${node.id}`;
  return "";
}

export function makeGlowTexture(THREE, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.85)");
  g.addColorStop(0.42, "rgba(255,255,255,0.28)");
  g.addColorStop(0.7, "rgba(255,255,255,0.07)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function addStarfield(THREE, scene, count = 1600) {
  if (scene.getObjectByName("starfield-dust")) return scene.getObjectByName("starfield-dust");
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 520 + Math.random() * 780;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.78;
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.86;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xc9d4ee,
    size: 1.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.name = "starfield-dust";
  scene.add(points);
  return points;
}

export function neighborMap(links) {
  const map = new Map();
  const touch = (a, b) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };
  (links || []).forEach((l) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    if (s && t) {
      touch(s, t);
      touch(t, s);
    }
  });
  return map;
}

export function formatInt(n) {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
