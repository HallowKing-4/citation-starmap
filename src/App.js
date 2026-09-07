import React, { useEffect, useMemo, useState } from 'react';
import StarMap from './StarMap.js';
import { getFirstAuthor } from './helpers.js';

export default function App() {
  const [graph, setGraph] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('./nodes-0.json'),
      fetch('./nodes-1.json'),
      fetch('./nodes-2.json'),
      fetch('./nodes-3.json'),
      fetch('./links.json'),
      fetch('./meta.json'),
    ])
      .then(async (resps) => {
        for (const r of resps) {
          if (!r.ok) throw new Error(`${r.url} ${r.status}`);
        }
        const [n0, n1, n2, n3, links, m] = await Promise.all(resps.map((r) => r.json()));
        return [[...n0, ...n1, ...n2, ...n3], links, m];
      })
      .then(([rawNodes, links, m]) => {
        if (cancelled) return;
        const nodes = (rawNodes || []).map((n) => ({
          ...n,
          first_author: getFirstAuthor(n.authors) || n.first_author || 'Unknown',
          fx: n.x,
          fy: n.y,
          fz: n.z,
        }));
        setGraph({ nodes, links: links || [] });
        setMeta(m);
        setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const completeness = useMemo(() => (meta && meta.completeness) || null, [meta]);

  if (error) {
    return React.createElement(
      'div',
      { className: 'fatal' },
      React.createElement(
        'div',
        null,
        React.createElement('p', { className: 'kicker' }, 'Corpus missing'),
        React.createElement('h1', null, 'Could not load the baked graph'),
        React.createElement('p', { className: 'muted' }, String(error.message || error))
      )
    );
  }

  if (!ready || !graph) {
    return React.createElement(
      'div',
      { className: 'boot' },
      React.createElement(
        'div',
        null,
        React.createElement('p', { className: 'kicker' }, 'Network neuroscience'),
        React.createElement('h1', null, 'Lighting the star-map'),
        React.createElement('p', { className: 'muted' }, 'Loading baked OpenAlex corpus…')
      )
    );
  }

  return React.createElement(StarMap, { graph, meta, completeness });
}
