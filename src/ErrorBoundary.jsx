import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Citation star-map failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal">
          <div className="fatal-card">
            <p className="eyebrow">Star-map failed to render</p>
            <h1>The 3D canvas hit an error.</h1>
            <p className="fatal-msg">{String(this.state.error.message || this.state.error)}</p>
            <p>
              The corpus is still available as static JSON. Use Download corpus in a
              fresh tab if the WebGL context is unavailable.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
