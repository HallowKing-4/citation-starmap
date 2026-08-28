import * as THREE from "three";

const texCache = new Map();

function makeGlowTexture(hex, seed = 0) {
  const key = `${hex}:${seed}`;
  if (texCache.has(key)) return texCache.get(key);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0.0, "#ffffff");
  g.addColorStop(0.12, hex);
  g.addColorStop(0.28, hex);
  g.addColorStop(0.55, hex + "88");
  g.addColorStop(0.78, hex + "22");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

export function makeStarSprite(hex, scale = 8, opacity = 1) {
  const mat = new THREE.SpriteMaterial({
    map: makeGlowTexture(hex),
    color: new THREE.Color(hex),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

export function addStarfield(scene, count = 1800) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 90 + Math.random() * 160;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const t = Math.random();
    colors[i * 3] = 0.72 + t * 0.28;
    colors[i * 3 + 1] = 0.68 + t * 0.22;
    colors[i * 3 + 2] = 0.55 + t * 0.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.55,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.name = "starfield-dust";
  scene.add(points);
  return points;
}
