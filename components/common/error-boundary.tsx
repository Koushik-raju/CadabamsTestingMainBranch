/**
 * FILE: components/common/error-boundary.tsx
 *
 * PURPOSE:
 *   A React error boundary component that catches unhandled errors in descendant components
 *   and displays a fallback UI instead of crashing the entire application.
 *
 * LOGIC OVERVIEW:
 *   Uses React's error boundary lifecycle methods (getDerivedStateFromError, componentDidCatch)
 *   to catch errors in child components. When an error is caught, sets hasError state to true
 *   and renders a fallback UI. Logs the error to console for debugging.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   children          — Child components to be wrapped by the error boundary
 *   fallback          — Optional custom fallback UI to display on error (renders default if omitted)
 *   hasError          — State boolean tracking whether an error has been caught
 *   ErrorBoundary     — Main export; class component that wraps children and catches errors
 *
 * DEPENDENCIES:
 *   React: Component (class component base), ErrorInfo, ReactNode types
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: file header added
 */

"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center min-h-screen p-4">
            <p className="text-muted-foreground">Something went wrong. Please reload.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
