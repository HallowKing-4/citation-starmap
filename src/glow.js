import * as THREE from "three";

const texCache = new Map();

export function hexToRgb(hex) {
  const h = String(hex || "#ffffff").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 255, g: 255, b: 255 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function glowTexture(hex) {
  const key = String(hex || "#ffffff").toLowerCase();
  if (texCache.has(key)) return texCache.get(key);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const { r, g, b } = hexToRgb(hex);
  const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0.0, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.12, `rgba(${r},${g},${b},1)`);
  grd.addColorStop(0.32, `rgba(${r},${g},${b},0.65)`);
  grd.addColorStop(0.58, `rgba(${r},${g},${b},0.18)`);
  grd.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

export function makeStarSprite(hex, scale = 8, opacity = 1) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(hex),
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

export const makeGlowSprite = makeStarSprite;

export function addStarfield(scene, count = 2200) {
  if (!scene || scene.getObjectByName("starfield-dust")) return;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 480 + Math.random() * 520;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi) * 0.62;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xd7def8,
    size: 1.05,
    transparent: true,
    opacity: 0.42,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = "starfield-dust";
  scene.add(pts);
}
