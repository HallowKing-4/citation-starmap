import { useEffect, useMemo, useState } from "react";
import StarMap from "./StarMap.js";
import { el } from "./htm.js";

export default function App() {
  const [graph, setGraph] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("./graph.json")
      .then((r) => {
        if (!r.ok) throw new Error(`graph.json ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setGraph(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = useMemo(() => Boolean(graph?.nodes?.length), [graph]);

  if (loadError) {
    return el(
      "div",
      { className: "fatal" },
      el(
        "div",
        { className: "fatal-card" },
        el("p", { className: "kicker" }, "Corpus missing"),
        el("h1", null, "Could not load the baked star catalog."),
        el("p", { className: "fatal-msg" }, String(loadError.message || loadError))
      )
    );
  }

  if (!ready) {
    return el(
      "div",
      { className: "boot" },
      el("div", { className: "boot-mark" }),
      el("p", null, "Aligning the connectome…")
    );
  }

  return el(StarMap, { graph });
}
