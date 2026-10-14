import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Error clearing cache:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-slate-100 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Kutilmagan xatolik yuz berdi
            </h2>
            <p className="text-xs text-slate-600 mt-2">
              Dasturda vaqtinchalik muammo yuzaga keldi. Xavotir olmang, quyidagi tugmalar yordamida ilovani tiklashingiz mumkin.
            </p>

            {this.state.error && (
              <details className="mt-4 text-left p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono">
                <summary className="cursor-pointer font-semibold text-slate-700">
                  Xatolik tafsilotlari
                </summary>
                <p className="mt-2 text-rose-600 break-words">
                  {this.state.error.toString()}
                </p>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Qayta yuklash</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Keshni tozalash"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Keshni tozalash</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
