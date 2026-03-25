import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
          <div className="glass p-12 rounded-[40px] max-w-lg w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Something went wrong</h1>
            <p className="text-slate-400 font-medium">
              The application encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
            </p>
            {this.state.error && (
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-left overflow-auto max-h-40">
                <code className="text-xs text-red-400 font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black font-black py-5 px-8 rounded-2xl text-xl hover:bg-blue-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <RefreshCcw className="w-6 h-6" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
