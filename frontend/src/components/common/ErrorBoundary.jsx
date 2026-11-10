import React from 'react'
import Button from '../ui/Button'
import { AlertCircle, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-[#06245B] mb-2">
              حدث خطأ غير متوقع / Something went wrong
            </h2>
            <p className="text-sm text-[#64748B] mb-6">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please try reloading the page.'}
            </p>
            <Button
              variant="primary"
              onClick={this.handleReset}
              icon={<RotateCcw size={16} />}
              className="mx-auto"
            >
              إعادة التحميل / Reload
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

