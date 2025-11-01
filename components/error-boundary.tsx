'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-red-100 p-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            className="mt-6"
          >
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
