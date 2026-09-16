import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    console.error('Citation star-map crashed', err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div className="fatal">
          <div>
            <h1>Star-map failed to render</h1>
            <p>{String(this.state.err?.message || this.state.err)}</p>
            <p className="muted">The corpus JSON is still downloadable if the 3D canvas cannot start.</p>
            <a className="btn" href="./corpus.zip" download>Download corpus</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
