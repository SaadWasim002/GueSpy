import { Component } from "react";
import { Button, EmptyState, Screen } from "../ui";

/**
 * Last line of defence for a render-time crash.
 *
 * Error boundaries must be class components — there is no hook equivalent.
 * Without one, a single bad render blanks the page mid-game with no way back;
 * this at least offers a reload.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // No error-reporting service is wired up yet; the console is what a
    // developer will actually look at.
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Screen center width="reading" title="Something broke">
        <EmptyState
          tone="error"
          icon="⚠"
          title="The app hit an unexpected error"
          description="Reloading usually clears it. If it keeps happening, the details are in the browser console."
          actions={<Button onClick={() => window.location.reload()}>Reload</Button>}
        />
      </Screen>
    );
  }
}

export default ErrorBoundary;
