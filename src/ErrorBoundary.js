import React from "react";
import { el } from "./htm.js";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Citation Star-Map failed", error, info);
  }
  render() {
    if (this.state.error) {
      return el(
        "div",
        { className: "fatal" },
        el(
          "div",
          { className: "fatal-card" },
          el("p", { className: "kicker" }, "Star-map fault"),
          el("h1", null, "The constellation could not ignite."),
          el("p", { className: "fatal-msg" }, String(this.state.error?.message || this.state.error)),
          el("button", { type: "button", onClick: () => window.location.reload() }, "Reload")
        )
      );
    }
    return this.props.children;
  }
}
