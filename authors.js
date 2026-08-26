export function getFirstAuthor(authors) {
  if (authors == null || authors === "") return "Unknown";
  if (typeof authors === "string") {
    const first = authors.split(/;|,|&|\band\b/)[0].trim();
    return first || "Unknown";
  }
  if (Array.isArray(authors)) {
    if (!authors.length) return "Unknown";
    return getFirstAuthor(authors[0]);
  }
  if (typeof authors === "object") {
    return (
      authors.display_name ||
      authors.name ||
      authors.fullName ||
      [authors.given, authors.family].filter(Boolean).join(" ") ||
      "Unknown"
    );
  }
  return "Unknown";
}

export function formatAuthors(authors, limit = 8) {
  if (authors == null || authors === "") return "Unknown";
  if (typeof authors === "string") return authors;
  if (!Array.isArray(authors)) return getFirstAuthor(authors);
  const names = authors.map((a) => getFirstAuthor(a)).filter(Boolean);
  if (names.length <= limit) return names.join(", ");
  return `${names.slice(0, limit).join(", ")} +${names.length - limit}`;
}
