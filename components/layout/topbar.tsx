'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  CheckCheck,
  User,
  Settings,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useSuperAdmin } from '@/context/super-admin-context';
import { formatCurrency, formatShortDate } from '@/lib/utils';

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname();
  const { settings, orders, admins } = useSuperAdmin();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/orders':
        return 'Orders Management';
      case '/products':
        return 'Menu & Products Catalog';
      case '/categories':
        return 'Menu Categories';
      case '/payments':
        return 'Payments & Settlements';
      case '/delivery-staff':
        return 'Delivery Staff & Fleets';
      case '/customers':
        return 'User Management (Optional)';
      case '/admins':
        return 'Admin Account Management';
      case '/permissions':
        return 'Custom Roles & Permissions';
      case '/reports':
        return 'Reports & Audit Logs';
      case '/settings':
        return 'Restaurant System Settings';
      default:
        return 'Super Admin Console';
    }
  };

  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'processing');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Tropical Gyros HQ • Miami Beach Kitchen
          </p>
        </div>
      </div>

      {/* Right: Quick Demo Tag, Notifications & User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Mode Pill matching Admin Screenshot */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Super Admin Live Mode
        </div>

        {/* Currency BSD Tag */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
          BSD Standard
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {pendingOrders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Orders & Kitchen Queue
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {pendingOrders.length} Pending
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Close
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto py-1">
                {pendingOrders.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    No pending orders in kitchen queue.
                  </p>
                ) : (
                  pendingOrders.map((order) => (
                    <div key={order.id} className="py-2.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs border border-amber-200">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{order.id}</span>
                          <span className="text-[10px] text-slate-400">{formatShortDate(order.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                          {order.customerName} • {formatCurrency(order.total)}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown matching Screenshot */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-amber-300">
              A
            </div>
            <span className="text-xs font-bold text-slate-800 hidden md:block">
              Admin
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
                  Super Administrator
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  superadmin@tropicalgyros.com
                </p>
                <span className="mt-1.5 inline-block text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  Master Authority
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/permissions"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Custom Permissions
                </Link>
                <Link
                  href="/admins"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Admin Accounts
                </Link>
                <a
                  href="https://tropical-admin-six.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  Existing Admin Panel
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
