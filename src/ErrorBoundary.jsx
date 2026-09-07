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
    console.error("Star-map crashed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <div className="crash-card">
            <p className="crash-kicker">error boundary</p>
            <h1>The star-map failed to render</h1>
            <p className="crash-msg">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
