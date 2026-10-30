import React from 'react';

type State = {failed: boolean};

/** Keep navigation available if a screen fails during rendering. */
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = {failed: false};

  static getDerivedStateFromError(): State {
    return {failed: true};
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return <main className="app-recovery" role="alert">
      <div>
        <h1>This screen could not open</h1>
        <p>Return to the dashboard or reload this page to try again.</p>
        <div className="button-row">
          <a className="btn primary" href="/">Go to dashboard</a>
          <button className="btn" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </div>
    </main>;
  }
}
