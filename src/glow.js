import * as THREE from "three";
import { hexToRgb } from "./helpers";

const textureCache = new Map();

export function glowTexture(hex) {
  if (textureCache.has(hex)) return textureCache.get(hex);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const { r, g, b } = hexToRgb(hex);
  const gdt = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gdt.addColorStop(0.0, "rgba(255,255,255,1)");
  gdt.addColorStop(0.12, `rgba(${r},${g},${b},0.95)`);
  gdt.addColorStop(0.32, `rgba(${r},${g},${b},0.45)`);
  gdt.addColorStop(0.62, `rgba(${r},${g},${b},0.12)`);
  gdt.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = gdt;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  textureCache.set(hex, tex);
  return tex;
}

export function makeStarSprite(color, scale = 10, opacity = 0.95) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(color),
    color: 0xffffff,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

export function addStarfield(scene, count = 1400) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const radius = 520 + Math.random() * 780;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.62;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const t = Math.random();
    colors[i * 3] = 0.75 + 0.25 * t;
    colors[i * 3 + 1] = 0.78 + 0.18 * t;
    colors[i * 3 + 2] = 0.92;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.15,
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
