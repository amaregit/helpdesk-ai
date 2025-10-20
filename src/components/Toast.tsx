'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type];

        return (
          <div
            key={toast.id}
            className={`
              ${toastStyles[toast.type]}
              border rounded-lg p-4 shadow-lg
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-right-2 fade-in
              max-w-sm
            `}
            role="alert"
          >
            <div className="flex items-start space-x-3">
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{toast.title}</h4>
                {toast.message && (
                  <p className="text-sm opacity-90 mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-2 p-1 rounded hover:bg-black/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            {toast.duration !== 0 && (
              <div className="mt-3 bg-black/10 rounded-full h-1">
                <div
                  className="bg-current h-1 rounded-full transition-all duration-5000 ease-linear"
                  style={{
                    width: '100%',
                    animation: `shrink ${toast.duration || 5000}ms linear forwards`
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Add CSS animation for progress bar
const styles = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}