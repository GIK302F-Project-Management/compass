import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { failed: boolean }

// The last safety net: if a page crashes while drawing, show a way out instead of a blank screen.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Compass crashed while drawing a page:', error, info.componentStack)
  }

  override render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="status-page" role="alert">
        <p className="kicker">Off the map</p>
        <h1>Something went wrong.</h1>
        <p>Compass hit an unexpected problem. Your saved data is safe.</p>
        <a href="/" className="button button-primary">
          Start again
        </a>
      </main>
    )
  }
}
