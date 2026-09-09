import { createElement } from "react";

export function el(type, props, ...children) {
  const flat = [];
  const soak = (c) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(soak);
    else flat.push(c);
  };
  children.forEach(soak);
  return createElement(type, props || null, ...flat);
}
