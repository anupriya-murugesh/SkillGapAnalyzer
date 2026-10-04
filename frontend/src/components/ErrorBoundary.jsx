import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-200 text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">Oops! Something went wrong.</h2>
            <p className="text-gray-600 mb-8 font-medium">
              We encountered an unexpected error. Don't worry, your data is safely backed up locally.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
