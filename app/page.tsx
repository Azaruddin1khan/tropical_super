'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Bike,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Users,
  Flame,
  FileText,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge, PaymentStatusBadge, DriverStatusBadge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { formatCurrency, formatShortDate, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { orders, admins, products, drivers, customers, activityLogs } = useSuperAdmin();

  // Calculations in Bahamian Dollars (BSD)
  const totalRevenueBsd = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCodTotalBsd = orders
    .filter((o) => o.paymentMethod === 'cod' && o.paymentStatus === 'pending')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
  const preparingOrders = orders.filter((o) => o.orderStatus === 'preparing').length;
  const inTransitOrders = orders.filter((o) => o.orderStatus === 'out_for_delivery').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered' || o.orderStatus === 'completed').length;

  const activeAdmins = admins.filter((a) => a.status === 'active').length;
  const activeDrivers = drivers.filter((d) => d.status === 'available' || d.status === 'on_delivery').length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Top Banner: Tropical Amber Brand Theme */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-end pr-6">
          <Flame className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-950 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Central Supervisory Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Tropical Gyros Super Admin Console
            </h1>
            <p className="text-slate-900/80 text-xs sm:text-sm mt-1 max-w-xl font-medium">
              Supervising restaurant operations, Admin accounts, and custom granular permissions. Existing Admin Panel is running concurrently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/admins">
              <Button className="bg-slate-950 hover:bg-slate-900 text-white font-bold shadow-md">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Manage Admins
              </Button>
            </Link>
            <Link href="/permissions">
              <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-950 font-bold border-amber-300 shadow-md">
                <KeyRound className="w-4 h-4 mr-2 text-amber-700" />
                Permission Matrix
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales in BSD */}
        <Card className="border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled Revenue (BSD)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                BSD
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalRevenueBsd)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Strict Bahamian Dollar Standard</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {orders.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {deliveredOrders} delivered • {pendingOrders} pending
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Cash on Delivery */}
        <Card className="border-rose-200/80 bg-gradient-to-br from-white to-rose-50/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uncollected COD (BSD)</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                {formatCurrency(pendingCodTotalBsd)}
              </div>
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                Field collection pending driver handover
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Staff & Admin Overview */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff & Fleet</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {activeAdmins} Admins • {activeDrivers} Drivers
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Governed via Super Admin Permissions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Order Pipeline Funnel */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base font-bold">Live Order Fulfillment Funnel</CardTitle>
            <CardDescription>Real-time status progression across kitchen preparation and courier dispatch</CardDescription>
          </div>
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              View All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">1. Pending</div>
              <div className="text-3xl font-black text-amber-900 mt-1">{pendingOrders}</div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">Awaiting acceptance</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-100/70 border border-amber-300 text-center">
              <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">2. In Preparation</div>
              <div className="text-3xl font-black text-amber-950 mt-1">{preparingOrders}</div>
              <div className="text-[11px] text-amber-800 mt-1 font-medium">Kitchen active</div>
            </div>
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 text-center">
              <div className="text-xs font-semibold text-sky-800 uppercase tracking-wider">3. Out For Delivery</div>
              <div className="text-3xl font-black text-sky-900 mt-1">{inTransitOrders}</div>
              <div className="text-[11px] text-sky-700 mt-1 font-medium">En route with courier</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">4. Completed</div>
              <div className="text-3xl font-black text-emerald-900 mt-1">{deliveredOrders}</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">Barcode verified</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid: Admin Accounts & Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Accounts Summary */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>Managed Admin Accounts</span>
              </CardTitle>
              <CardDescription>Accounts provisioned for the existing Admin Panel</CardDescription>
            </div>
            <Link href="/admins">
              <Button variant="outline" size="sm" className="text-xs">
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs border border-slate-200">
                      {admin.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{admin.name}</span>
                        {admin.status === 'active' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{admin.roleTitle} • {admin.email}</div>
                    </div>
                  </div>

                  <Link href={`/permissions?adminId=${admin.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                      <KeyRound className="w-3.5 h-3.5 mr-1" />
                      Permissions
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail & Activity Logs */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                <span>Recent Operational Activity</span>
              </CardTitle>
              <CardDescription>Audit trail capturing administrative actions with timestamps</CardDescription>
            </div>
            <Link href="/reports">
              <Button variant="outline" size="sm" className="text-xs">
                All Logs
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {activityLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800">{log.adminName}</span>
                    <span>{formatDate(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {log.description}
                  </p>
                  {log.targetEntity && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                      {log.targetEntity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </SuperAdminLayout>
  );
}

