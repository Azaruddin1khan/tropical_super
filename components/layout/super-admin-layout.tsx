'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { ToastContainer } from '@/components/ui/toast';

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 print:pl-0">
        <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
          {children}
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
}
