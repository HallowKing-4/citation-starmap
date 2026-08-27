export function getFirstAuthor(authors) {
  if (authors == null || authors === "") return "Unknown";
  if (Array.isArray(authors)) {
    const first = authors.find((a) => typeof a === "string" && a.trim());
    return first ? first.trim() : "Unknown";
  }
  if (typeof authors === "string") {
    const piece = authors.split(/;|,/)[0];
    return (piece || authors).trim() || "Unknown";
  }
  if (typeof authors === "object") {
    const name = authors.lastName || authors.name || authors.fullName || authors.display_name;
    if (name) return String(name);
  }
  return "Unknown";
}

export function authorLine(authors, limit = 4) {
  if (authors == null) return "Unknown authors";
  const list = Array.isArray(authors) ? authors.filter(Boolean).map((a) => String(a)) : [String(authors)];
  if (!list.length) return "Unknown authors";
  if (list.length <= limit) return list.join(", ");
  return `${list.slice(0, limit).join(", ")} +${list.length - limit}`;
}

export function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function placeOnEllipsoid(nodes, { rx = 220, ry = 150, rz = 180, minDist = 18 } = {}) {
  const placed = [];
  const min2 = minDist * minDist;
  nodes.forEach((node, idx) => {
    const seed = hash32(node.id + ":" + idx);
    let x = 0, y = 0, z = 0;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const s = hash32(`${seed}:${attempt}`);
      const u = ((s & 0xffff) / 0xffff) * 2 - 1;
      const v = (((s >>> 16) & 0xffff) / 0xffff) * 2 * Math.PI;
      const r = Math.cbrt(((hash32(`${s}:r`) & 0xffff) / 0xffff) * 0.72 + 0.28);
      const sinT = Math.sqrt(Math.max(0, 1 - u * u));
      x = r * rx * sinT * Math.cos(v);
      y = r * ry * u;
      z = r * rz * sinT * Math.sin(v);
      let ok = true;
      for (let i = 0; i < placed.length; i += 1) {
        const dx = x - placed[i].x, dy = y - placed[i].y, dz = z - placed[i].z;
        if (dx * dx + dy * dy + dz * dz < min2) { ok = false; break; }
      }
      if (ok) break;
    }
    placed.push({ ...node, x, y, z, fx: x, fy: y, fz: z });
  });
  return placed;
}

export function makeRadialSpriteTexture(hex, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2, cy = size / 2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  g.addColorStop(0.0, "#ffffff");
  g.addColorStop(0.12, hex);
  g.addColorStop(0.28, hex + "cc");
  g.addColorStop(0.55, hex + "44");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}
