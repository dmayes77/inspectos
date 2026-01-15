"use client";

import { Component, ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorFallbackProps extends FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>An unexpected error occurred. Please try again.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-mono text-destructive">{error.message}</p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">Stack trace</summary>
                  <pre className="mt-2 overflow-auto text-xs">{error.stack}</pre>
                </details>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} variant="default">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Error boundary component using react-error-boundary
 * Wrap your app or specific sections to catch and handle errors gracefully
 */
export function ErrorBoundary({ children, fallback, onReset }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : ErrorFallback}
      onReset={onReset}
      onError={(error, errorInfo) => {
        // Log error to error reporting service in production
        if (process.env.NODE_ENV === "production") {
          console.error("Error caught by boundary:", error, errorInfo);
          // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
