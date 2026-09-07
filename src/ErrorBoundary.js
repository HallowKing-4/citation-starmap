import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Citation star-map crashed', error, info);
  }

  render() {
    if (this.state.error) {
      const message = String(
        (this.state.error && this.state.error.message) || this.state.error
      );
      return React.createElement(
        'div',
        { className: 'fatal' },
        React.createElement(
          'div',
          null,
          React.createElement('p', { className: 'kicker' }, 'Star-map fault'),
          React.createElement('h1', null, 'The canvas could not ignite'),
          React.createElement('p', { className: 'muted' }, message),
          React.createElement(
            'button',
            { type: 'button', onClick: () => window.location.reload() },
            'Reload'
          )
        )
      );
    }
    return this.props.children;
  }
}
