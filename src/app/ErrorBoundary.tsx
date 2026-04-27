import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional friendly label for the area being protected (e.g. "Optimizer"). */
  area?: string
  /** Custom fallback. Receives the caught error so callers can format it. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time errors thrown by child components and shows a friendly
 * fallback UI with a "Try again" affordance. Without this, any uncaught
 * exception in any descendant unmounts the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
     
    console.error(`[ErrorBoundary${this.props.area ? `:${this.props.area}` : ""}]`, error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)
    return (
      <div
        role="alert"
        className="flex min-h-[40vh] items-center justify-center p-6"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <div className="max-w-md rounded-2xl border border-rose-300 bg-rose-50 p-6 text-center shadow-md dark:border-rose-700/50 dark:bg-rose-500/10">
          <div className="text-4xl">⚠️</div>
          <h2 className="mt-3 text-lg font-semibold text-rose-900 dark:text-rose-100">
            Something went wrong{this.props.area ? ` in ${this.props.area}` : ""}
          </h2>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
            We hit an unexpected error. Your data is safe — you can try again or reload the page.
          </p>
          <details className="mt-3 text-left text-xs text-rose-600 dark:text-rose-400">
            <summary className="cursor-pointer">Technical details</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-rose-100/50 p-2 dark:bg-rose-900/30">
              {error.message}
              {error.stack && `\n\n${error.stack.split("\n").slice(0, 5).join("\n")}`}
            </pre>
          </details>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 dark:border-rose-700/50 dark:bg-zinc-900 dark:text-rose-300"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
