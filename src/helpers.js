export const JEWEL = ['#C4A1FF','#3DDC97','#5DA9E9','#E85D75','#F4C95D','#2EC4B6','#9B5DE5','#F15BB5','#7BDFF2','#F7A072'];

export function jewelColor(community) {
  const i = Number.isFinite(community) ? community : 0;
  return JEWEL[((i % JEWEL.length) + JEWEL.length) % JEWEL.length];
}

export function getFirstAuthor(authors) {
  if (authors == null) return 'Unknown';
  if (typeof authors === 'string') {
    const part = authors.split(/[,;&]| and /i)[0].trim();
    return part || 'Unknown';
  }
  if (Array.isArray(authors)) {
    const first = authors[0];
    if (!first) return 'Unknown';
    if (typeof first === 'string') return first.trim() || 'Unknown';
    if (typeof first === 'object') {
      const nested = first.author && typeof first.author === 'object' ? first.author : null;
      return first.display_name || first.name || first.full_name || (nested && (nested.display_name || nested.name)) || 'Unknown';
    }
  }
  if (typeof authors === 'object') return authors.display_name || authors.name || 'Unknown';
  return 'Unknown';
}

export function authorLine(authors, fallback) {
  const first = getFirstAuthor(authors) || fallback || 'Unknown';
  if (typeof authors === 'string') return authors;
  if (Array.isArray(authors) && authors.length > 1) {
    const rest = authors.length - 1;
    return rest === 1 ? `${first} & 1 other` : `${first} & ${rest} others`;
  }
  return first;
}

export function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function neighborMap(links) {
  const map = new Map();
  for (const l of links || []) {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (!map.has(s)) map.set(s, new Set());
    if (!map.has(t)) map.set(t, new Set());
    map.get(s).add(t);
    map.get(t).add(s);
  }
  return map;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function strBytes(str) { return new TextEncoder().encode(str); }
function u16(n) { const b = new Uint8Array(2); b[0] = n & 255; b[1] = (n >> 8) & 255; return b; }
function u32(n) { const b = new Uint8Array(4); b[0] = n & 255; b[1] = (n >> 8) & 255; b[2] = (n >> 16) & 255; b[3] = (n >> 24) & 255; return b; }

export function zipStore(files) {
  const locals = []; const centrals = []; let offset = 0;
  for (const file of files) {
    const name = strBytes(file.name);
    const data = typeof file.data === 'string' ? strBytes(file.data) : file.data;
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    local.set([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0);
    local.set(u32(crc), 14); local.set(u32(data.length), 18); local.set(u32(data.length), 22);
    local.set(u16(name.length), 26); local.set(name, 30); local.set(data, 30 + name.length);
    locals.push(local);
    const central = new Uint8Array(46 + name.length);
    central.set([0x50, 0x4b, 0x01, 0x02, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0);
    central.set(u32(crc), 16); central.set(u32(data.length), 20); central.set(u32(data.length), 24);
    central.set(u16(name.length), 28); central.set(u32(offset), 42); central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((s, a) => s + a.length, 0);
  const end = new Uint8Array(22);
  end.set([0x50, 0x4b, 0x05, 0x06], 0);
  end.set(u16(files.length), 8); end.set(u16(files.length), 10);
  end.set(u32(centralSize), 12); end.set(u32(offset), 16);
  const out = new Uint8Array(offset + centralSize + 22);
  let p = 0;
  for (const part of locals) { out.set(part, p); p += part.length; }
  for (const part of centrals) { out.set(part, p); p += part.length; }
  out.set(end, p);
  return new Blob([out], { type: 'application/zip' });
}

export function downloadCorpus(graph, meta) {
  const papers = (graph.nodes || []).map((n) => ({
    id: n.id, doi: n.doi, title: n.title, year: n.year, authors: n.authors,
    first_author: getFirstAuthor(n.authors) || n.first_author, abstract: n.abstract,
    url: n.url, cited_by_count: n.cited_by_count, concepts: n.concepts,
    community: n.community, community_name: n.community_name,
  }));
  const used = meta && meta.completeness ? meta.completeness.keyword_fallback_used : false;
  const readme = `Citation Star-Map corpus\nSource: OpenAlex Works API\nPapers: ${papers.length}\nEdges: referenced_works only.\nKeyword fallback used: ${used}\n`;
  const blob = zipStore([
    { name: 'README.txt', data: readme },
    { name: 'papers.json', data: JSON.stringify({ source: 'OpenAlex', papers }, null, 2) },
    { name: 'graph.json', data: JSON.stringify(graph) },
    { name: 'meta.json', data: JSON.stringify(meta || {}, null, 2) },
  ]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'connectome-citation-corpus.zip';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
