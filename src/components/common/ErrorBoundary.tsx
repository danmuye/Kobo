import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="alert">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            {this.state.error?.message ?? "An unexpected error occurred. Please try again."}
          </p>
          <Button onClick={this.handleRetry} className="mt-6 gap-1.5">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
