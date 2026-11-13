'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  KeyRound,
  ShoppingBag,
  UtensilsCrossed,
  Tags,
  CreditCard,
  Bike,
  Users,
  FileSpreadsheet,
  Settings,
  ExternalLink,
  ChevronRight,
  Flame,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuperAdmin } from '@/context/super-admin-context';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isHighlight?: boolean;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { orders, admins } = useSuperAdmin();

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const activeAdminsCount = admins.filter((a) => a.status === 'active').length;

  const navSections: NavSection[] = [
    {
      group: 'SUPERVISORY CORE',
      items: [
        { label: 'Dashboard Overview', href: '/', icon: LayoutDashboard },
        { label: 'Admin Management', href: '/admins', icon: ShieldCheck, badge: `${activeAdminsCount} Active` },
        { label: 'Custom Permissions', href: '/permissions', icon: KeyRound, isHighlight: true },
      ],
    },
    {
      group: 'RESTAURANT OPERATIONS',
      items: [
        { label: 'Orders Management', href: '/orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : undefined },
        { label: 'Products & Dishes', href: '/products', icon: UtensilsCrossed },
        { label: 'Categories Catalog', href: '/categories', icon: Tags },
        { label: 'Payments & COD', href: '/payments', icon: CreditCard },
      ],
    },
    {
      group: 'PEOPLE & TRACEABILITY',
      items: [
        { label: 'Delivery Staff', href: '/delivery-staff', icon: Bike },
        { label: 'Customer Records', href: '/customers', icon: Users },
        { label: 'Reports & Audit Logs', href: '/reports', icon: FileSpreadsheet },
        { label: 'Restaurant Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-16 h-10 rounded-xl overflow-hidden border border-amber-300 shadow-xs bg-white shrink-0">
              <Image
                src="/images/tropical_gyros_logo.png"
                alt="Tropical Gyros Official Logo"
                fill
                className="object-contain p-0.5 group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  Tropical Gyros
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-amber-500 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                  SUPER
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Super Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Supervisory Status Chip */}
        <div className="mx-4 my-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">Supervisory Live</span>
          </div>
          <span className="text-[11px] font-semibold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-700" />
            BSD Standard
          </span>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-2 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.group}
              </div>
              {section.items.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group',
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : item.isHighlight
                        ? 'text-amber-950 bg-amber-50/90 border border-amber-200/80 font-bold hover:bg-amber-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'w-5 h-5 transition-colors shrink-0',
                          isActive
                            ? 'text-slate-950'
                            : item.isHighlight
                            ? 'text-amber-700'
                            : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-black leading-none',
                            isActive
                              ? 'bg-slate-950 text-white'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-slate-950/70" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Coexistence Notice Card */}
        <div className="mx-4 my-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
          <div className="flex items-center justify-between text-slate-800 font-semibold text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Two-Panel Coexistence
            </span>
            <span className="text-[10px] text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded font-bold">
              ACTIVE
            </span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1 leading-snug">
            Existing Admin Panel operates normally for daily kitchen & counter staff.
          </p>
        </div>

        {/* Current User & Master Identity Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                Super Administrator
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold truncate">
                Master Authority
              </p>
            </div>
          </div>

          <a
            href="https://tropical-admin-six.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Existing Admin Panel"
            className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </aside>
    </>
  );
}
