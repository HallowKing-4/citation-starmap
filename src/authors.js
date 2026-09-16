/** Authors arrive as string | string[] from mixed bibliographic sources. */
export function getFirstAuthor(authors) {
  if (authors == null || authors === '') return 'Unknown';
  if (Array.isArray(authors)) {
    for (const item of authors) {
      const name = getFirstAuthor(item);
      if (name && name !== 'Unknown') return name;
    }
    return 'Unknown';
  }
  if (typeof authors === 'string') {
    const chunk = authors
      .split(/\s+and\s+|;&|\s*;\s*|\s*,\s*(?=[A-Z])/)[0]
      .replace(/\.$/, '')
      .trim();
    return chunk || 'Unknown';
  }
  if (typeof authors === 'object') {
    return (
      authors.display_name ||
      authors.fullName ||
      authors.name ||
      getFirstAuthor(authors.author) ||
      'Unknown'
    );
  }
  return 'Unknown';
}

export function formatAuthors(authors) {
  if (authors == null || authors === '') return 'Unknown';
  const list = Array.isArray(authors)
    ? authors.map((a) => getFirstAuthor(a)).filter((n) => n && n !== 'Unknown')
    : [getFirstAuthor(authors)];
  if (!list.length) return 'Unknown';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} & ${list[1]}`;
  return `${list[0]} et al.`;
}
