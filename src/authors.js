/** Accept string | string[] | {name}[] and never throw. */
export function getFirstAuthor(authors) {
  if (!authors) return "Unknown";
  if (typeof authors === "string") {
    const first = authors.split(",")[0]?.trim();
    return first || "Unknown";
  }
  if (Array.isArray(authors)) {
    const a0 = authors[0];
    if (!a0) return "Unknown";
    if (typeof a0 === "string") return a0.trim() || "Unknown";
    if (typeof a0 === "object") {
      return (
        a0.name ||
        a0.fullName ||
        [a0.lastName, a0.firstName].filter(Boolean).join(" ") ||
        "Unknown"
      );
    }
  }
  return "Unknown";
}

export function formatAuthors(authors) {
  if (!authors) return "Unknown authors";
  if (typeof authors === "string") return authors;
  if (Array.isArray(authors)) {
    return authors
      .map((a) => (typeof a === "string" ? a : a?.name || a?.fullName || ""))
      .filter(Boolean)
      .join(", ");
  }
  return "Unknown authors";
}
