'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Super Admin Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-lg space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="text-sm text-slate-500">
          {error?.message || 'An unexpected error occurred while loading this section.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              try {
                localStorage.removeItem('tg_super_admins');
              } catch {}
              reset();
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload & Recover
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
