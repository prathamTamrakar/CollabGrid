import React from 'react';

export function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="CollabGrid logo"
            className="h-10 w-auto object-contain mx-auto mb-3"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600 mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-indigo-600 mb-2"></div>
      {message && <p className="text-xs font-medium text-slate-500">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
