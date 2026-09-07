/** Authors may arrive as a string, a string[], or a nested object. */
export function getFirstAuthor(authors) {
  if (authors == null || authors === "") return "Unknown";
  if (typeof authors === "string") {
    const piece = authors.split(/[,;&]| and /i)[0].trim();
    return piece || "Unknown";
  }
  if (Array.isArray(authors)) {
    if (authors.length === 0) return "Unknown";
    return getFirstAuthor(authors[0]);
  }
  if (typeof authors === "object") {
    return (
      authors.display_name ||
      authors.name ||
      authors.author ||
      authors.first ||
      getFirstAuthor(authors.authors) ||
      "Unknown"
    );
  }
  return "Unknown";
}

export function authorLine(authors, limit = 4) {
  if (authors == null || authors === "") return "Unknown authors";
  const list = Array.isArray(authors)
    ? authors.map((a) => (typeof a === "string" ? a : getFirstAuthor(a))).filter(Boolean)
    : typeof authors === "string"
      ? authors
          .split(/;| and /i)
          .map((s) => s.trim())
          .filter(Boolean)
      : [getFirstAuthor(authors)];
  if (!list.length) return "Unknown authors";
  if (list.length <= limit) return list.join(", ");
  return `${list.slice(0, limit).join(", ")} +${list.length - limit}`;
}
