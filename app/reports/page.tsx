'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  Clock,
  Printer,
  Download,
  AlertCircle,
  KeyRound,
  DollarSign,
  UtensilsCrossed,
  Bike,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { formatDate } from '@/lib/utils';
import { ActivityActionType } from '@/types';

export default function ReportsPage() {
  const { activityLogs, orders, admins } = useSuperAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = activityLogs.filter((log) => {
    if (actionFilter !== 'all' && log.actionType !== actionFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.adminName.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      (log.targetEntity && log.targetEntity.toLowerCase().includes(q))
    );
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Reports & Operational Activity Logs
            </h1>
            <Badge variant="warning" className="text-[10px] font-bold">
              Module 10
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete audit trail capturing administrative modifications, actor attribution, and timestamps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print Audit Log
          </Button>
        </div>
      </div>

      {/* Backend Required Banner */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-900 leading-snug">
            <strong>Audit Traceability Active:</strong> All changes to permissions, order statuses, driver assignments, and menu prices are logged with the executing user and timestamp.
          </div>
        </div>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase border border-emerald-200">
          Real-time Audit Logs
        </span>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-8 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">All Action Types</option>
            <option value="permissions_updated">Permissions Updated</option>
            <option value="order_status_update">Order Status Changed</option>
            <option value="driver_assigned">Driver Assigned</option>
            <option value="price_updated">Price Updated</option>
            <option value="cod_marked_paid">COD Reconciled</option>
            <option value="admin_created">Admin Created</option>
            <option value="settings_updated">Settings Updated</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Admin name or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Audit Log Card Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Timestamp & IP</th>
                <th className="py-3.5 px-4">Executing Admin</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Description of Operation</th>
                <th className="py-3.5 px-4">Target Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No activity logs found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Administrative events and system updates will appear here</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{formatDate(log.timestamp)}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{log.ipAddress || '192.168.1.1'}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.adminName}</div>
                      <div className="text-[11px] text-slate-500">{log.adminRole}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200 uppercase tracking-wide">
                        {log.actionType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {log.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.targetEntity ? (
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-900 text-[11px] font-semibold border border-amber-200/80">
                          {log.targetEntity}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

