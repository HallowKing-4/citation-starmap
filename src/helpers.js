/** Authors may arrive as a string, a string[], or missing. */
export function getFirstAuthor(authors) {
  if (authors == null || authors === "") return "Unknown";
  if (Array.isArray(authors)) {
    const first = authors.find((a) => typeof a === "string" && a.trim());
    return first ? first.trim() : "Unknown";
  }
  if (typeof authors === "string") {
    const piece = authors.split(/;|,/)[0];
    return piece.trim() || "Unknown";
  }
  return "Unknown";
}

export function authorLine(authors) {
  if (authors == null || authors === "") return "Unknown authors";
  const list = Array.isArray(authors)
    ? authors.filter((a) => typeof a === "string" && a.trim())
    : String(authors)
        .split(/;/)
        .map((s) => s.trim())
        .filter(Boolean);
  if (!list.length) return "Unknown authors";
  if (list.length <= 3) return list.join(", ");
  return `${list.slice(0, 3).join(", ")} et al.`;
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function placeOnEllipsoid(nodes, { rx = 220, ry = 130, rz = 190, minDist = 16 } = {}) {
  const n = nodes.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i += 1) {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    nodes[i].x = Math.cos(theta) * radius * rx;
    nodes[i].y = y * ry;
    nodes[i].z = Math.sin(theta) * radius * rz;
  }
  const min2 = minDist * minDist;
  for (let iter = 0; iter < 40; iter += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        let dz = nodes[j].z - nodes[i].z;
        const d2 = dx * dx + dy * dy + dz * dz || 0.0001;
        if (d2 >= min2) continue;
        const d = Math.sqrt(d2);
        const push = ((minDist - d) / d) * 0.5;
        dx *= push; dy *= push; dz *= push;
        nodes[i].x -= dx; nodes[i].y -= dy; nodes[i].z -= dz;
        nodes[j].x += dx; nodes[j].y += dy; nodes[j].z += dz;
      }
    }
    for (let i = 0; i < n; i += 1) {
      const nx = nodes[i].x / rx;
      const ny = nodes[i].y / ry;
      const nz = nodes[i].z / rz;
      const mag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const target = 0.82 + 0.18 * ((i % 7) / 6);
      nodes[i].x = (nx / mag) * rx * target;
      nodes[i].y = (ny / mag) * ry * target;
      nodes[i].z = (nz / mag) * rz * target;
    }
  }
  for (const node of nodes) {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }
  return nodes;
}

export function neighborSet(links, nodeId) {
  const set = new Set([nodeId]);
  for (const link of links) {
    const s = typeof link.source === "object" ? link.source.id : link.source;
    const t = typeof link.target === "object" ? link.target.id : link.target;
    if (s === nodeId) set.add(t);
    if (t === nodeId) set.add(s);
  }
  return set;
}
