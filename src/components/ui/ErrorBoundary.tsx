/**
 * Error Boundary Components for Tensho Mahjong Roguelike
 *
 * Provides graceful error handling with beautiful fallback UIs
 * and optional error reporting capabilities.
 */

import React, { Component, ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

// =============================================================================
// ERROR REPORTING
// =============================================================================

/**
 * Error report data structure
 */
export interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  timestamp: Date
  url: string
  userAgent: string
  appVersion?: string
}

/**
 * Report an error to console and optionally to external service
 */
export function reportError(error: Error, componentStack?: string): ErrorReport {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    componentStack,
    timestamp: new Date(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    appVersion: import.meta.env.VITE_APP_VERSION || 'development',
  }

  // Log to console with styling
  console.group('%c🚨 Tensho Error Report', 'color: #FF5722; font-weight: bold; font-size: 14px')
  console.error('Error:', error.message)
  if (error.stack) {
    console.error('Stack:', error.stack)
  }
  if (componentStack) {
    console.error('Component Stack:', componentStack)
  }
  console.log('Timestamp:', report.timestamp.toISOString())
  console.log('URL:', report.url)
  console.groupEnd()

  // Store in localStorage for debugging (keep last 10 errors)
  try {
    const storedErrors = JSON.parse(localStorage.getItem('tensho_error_log') || '[]')
    storedErrors.unshift({
      ...report,
      timestamp: report.timestamp.toISOString(),
    })
    localStorage.setItem('tensho_error_log', JSON.stringify(storedErrors.slice(0, 10)))
  } catch {
    // Ignore storage errors
  }

  // TODO: Add external error reporting service integration here
  // Example: Sentry, LogRocket, etc.
  // if (import.meta.env.PROD) {
  //   sendToErrorService(report)
  // }

  return report
}

/**
 * Get stored error logs
 */
export function getErrorLogs(): ErrorReport[] {
  try {
    return JSON.parse(localStorage.getItem('tensho_error_log') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear stored error logs
 */
export function clearErrorLogs(): void {
  localStorage.removeItem('tensho_error_log')
}

// =============================================================================
// ERROR FALLBACK COMPONENTS
// =============================================================================

export interface ErrorFallbackProps {
  error: Error
  errorInfo?: React.ErrorInfo
  onRetry?: () => void
  onGoHome?: () => void
  variant?: 'full' | 'inline' | 'minimal'
}

/**
 * Beautiful error fallback UI
 */
export function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  variant = 'full',
}: ErrorFallbackProps) {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = useState(false)

  if (variant === 'minimal') {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
        <p className="text-red-400 text-sm mb-2">
          {t('error.somethingWentWrong', 'Something went wrong')}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-[var(--color-golden-yellow)] hover:underline"
          >
            {t('error.tryAgain', 'Try again')}
          </button>
        )}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="p-6 bg-[var(--color-dark-forest)] border-2 border-red-500/50 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="text-4xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-400 mb-2">
              {t('error.componentError', 'Component Error')}
            </h3>
            <p className="text-[var(--color-beige-white)] text-sm mb-4">
              {t('error.componentErrorDesc', 'This part of the app encountered an error.')}
            </p>
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                             text-white font-bold rounded-lg text-sm transition-colors"
                >
                  {t('error.retry', 'Retry')}
                </button>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
                           text-[var(--color-beige-white)] rounded-lg text-sm transition-colors
                           border border-[var(--color-metallic-gold)]"
              >
                {showDetails ? t('error.hideDetails', 'Hide Details') : t('error.showDetails', 'Show Details')}
              </button>
            </div>
            {showDetails && (
              <pre className="mt-4 p-3 bg-black/50 rounded text-xs text-red-300 overflow-auto max-h-40">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Full variant (default)
  return (
    <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)] p-4">
      <div className="max-w-md w-full text-center">
        {/* Error icon with animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-red-500/30 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            💥
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--color-golden-yellow)] mb-3">
          {t('error.oops', 'Oops! Something went wrong')}
        </h1>

        {/* Description */}
        <p className="text-[var(--color-beige-white)] mb-6">
          {t('error.description', "We're sorry, but something unexpected happened. The error has been logged.")}
        </p>

        {/* Error message preview */}
        <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
          <p className="text-red-400 text-sm font-mono break-all">
            {error.message}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                         text-white font-bold rounded-lg transition-all hover:scale-105
                         border-2 border-[var(--color-golden-yellow)]"
            >
              {t('error.tryAgain', 'Try Again')}
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-3 bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
                         text-[var(--color-beige-white)] font-bold rounded-lg transition-all
                         border-2 border-[var(--color-metallic-gold)]"
            >
              {t('error.goHome', 'Go to Menu')}
            </button>
          )}
        </div>

        {/* Show details toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-6 text-sm text-[var(--color-metallic-gold)] hover:text-[var(--color-golden-yellow)] transition-colors"
        >
          {showDetails ? t('error.hideDetails', 'Hide technical details') : t('error.showDetails', 'Show technical details')}
        </button>

        {/* Technical details */}
        {showDetails && (
          <div className="mt-4 text-left bg-black/50 rounded-lg p-4 max-h-60 overflow-auto">
            <p className="text-xs text-gray-400 mb-2">Stack trace:</p>
            <pre className="text-xs text-red-300 whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
            {errorInfo?.componentStack && (
              <>
                <p className="text-xs text-gray-400 mt-4 mb-2">Component stack:</p>
                <pre className="text-xs text-yellow-300 whitespace-pre-wrap break-all">
                  {errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        )}

        {/* Version info */}
        <p className="mt-6 text-xs text-gray-500">
          Tensho v{import.meta.env.VITE_APP_VERSION || 'dev'} | {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// =============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode)
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onRetry?: () => void
  onGoHome?: () => void
  variant?: 'full' | 'inline' | 'minimal'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report the error
    reportError(error, errorInfo.componentStack)

    // Update state with error info
    this.setState({ errorInfo })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onRetry?.()
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            errorInfo: this.state.errorInfo ?? undefined,
            onRetry: this.handleRetry,
            onGoHome: this.props.onGoHome,
            variant: this.props.variant,
          })
        }
        return this.props.fallback
      }

      // Default fallback
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo ?? undefined}
          onRetry={this.handleRetry}
          onGoHome={this.props.onGoHome}
          variant={this.props.variant}
        />
      )
    }

    return this.props.children
  }
}

// =============================================================================
// SPECIALIZED ERROR BOUNDARIES
// =============================================================================

/**
 * App-level error boundary with navigation to home
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const handleGoHome = useCallback(() => {
    window.location.href = '/'
  }, [])

  return (
    <ErrorBoundary onGoHome={handleGoHome} variant="full">
      {children}
    </ErrorBoundary>
  )
}

/**
 * Screen-level error boundary
 */
export function ScreenErrorBoundary({
  children,
  screenName,
}: {
  children: ReactNode
  screenName?: string
}) {
  const handleGoHome = useCallback(() => {
    window.location.href = '/'
  }, [])

  const handleError = useCallback(
    (error: Error) => {
      console.error(`Error in screen ${screenName || 'unknown'}:`, error)
    },
    [screenName]
  )

  return (
    <ErrorBoundary onGoHome={handleGoHome} onError={handleError} variant="full">
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component-level error boundary for non-critical UI sections
 */
export function ComponentErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ErrorBoundary
      variant="inline"
      fallback={
        fallback || (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
            <p className="text-red-400 text-sm">Failed to load component</p>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Silent error boundary - logs errors but shows nothing
 */
export function SilentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={null}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
