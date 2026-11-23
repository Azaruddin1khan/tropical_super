'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Ban,
  CheckCircle2,
  ShieldCheck,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useSuperAdmin } from '@/context/super-admin-context';
import { Customer } from '@/types';
import { formatCurrency, formatShortDate } from '@/lib/utils';

export default function CustomersPage() {
  const { customers, orders, toggleCustomerStatus } = useSuperAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredUsers = useMemo(() => {
    return customers.filter((user) => {
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = user.name.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchPhone = user.phone.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [customers, statusFilter, searchQuery]);

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const bannedCount = customers.filter((c) => c.status === 'banned').length;
  const activeCount = customers.filter((c) => c.status === 'active').length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header matching Screenshot 5 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Management (Optional)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View registered customer accounts, order history & manage access (Ban / Unban)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-full border border-amber-300">
              {customers.length} Registered Users
            </span>
          </div>
        </div>

        {/* 3 Metric Summary Cards matching Screenshot 5 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Diners
                </span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {activeCount} Active
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Banned Accounts
                </span>
                <p className="text-2xl font-extrabold text-rose-600 mt-1">
                  {bannedCount} Banned
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Orders Placed
                </span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {totalOrdersAll} Orders
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter matching Screenshot 5 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name, email, or phone number..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All User Accounts ({customers.length})</option>
            <option value="active">Active Only ({activeCount})</option>
            <option value="banned">Banned Accounts ({bannedCount})</option>
          </select>
        </div>

        {/* Users Table matching Screenshot 5 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                  <th className="py-3.5 px-4 font-semibold">Favorite Category</th>
                  <th className="py-3.5 px-4 font-semibold">Orders Count</th>
                  <th className="py-3.5 px-4 font-semibold">Total Spent</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ban / Unban Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-xs">
                          <Users className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                          {customers.length === 0 ? 'No Customers Found' : 'No Matching Customers'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {customers.length === 0
                            ? 'Customer accounts registered via the mobile application will automatically appear here.'
                            : 'Try adjusting your status filter or search keywords.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 border border-slate-200">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{user.name}</span>
                            <span className="text-[11px] text-slate-400">
                              Joined: {user.registeredDate || '2026-02-15'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Favorite Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-slate-100 text-slate-700 font-medium text-xs px-2.5 py-1 rounded-full">
                          {user.favoriteCategory || 'Gyros'}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {user.totalOrders} Orders
                      </td>

                      {/* Total Spent in BSD */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-base">
                        {formatCurrency(user.totalSpent)}
                      </td>

                      {/* Account Status with dot */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            user.status === 'banned'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'banned' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          {user.status === 'banned' ? 'Banned' : 'Active'}
                        </span>
                      </td>

                      {/* Ban / Unban & View Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant={user.status === 'banned' ? 'success' : 'destructive'}
                            size="sm"
                            className="text-xs h-7 px-2.5 font-semibold"
                            onClick={() => toggleCustomerStatus(user.id)}
                          >
                            {user.status === 'banned' ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                Unban User
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                Ban User
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2 text-slate-700"
                            onClick={() => setSelectedCustomer(user)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`User Profile — ${selectedCustomer.name}`}
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Delivery Address: {selectedCustomer.address} ({selectedCustomer.distanceMiles} mi from kitchen)
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedCustomer.status === 'banned'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {selectedCustomer.status === 'banned' ? 'Account Banned' : 'Active Diner'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Total Fulfilled Orders</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{selectedCustomer.totalOrders}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Lifetime Spend (BSD)</span>
                <p className="text-xl font-bold text-amber-800 mt-0.5">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
              <Button
                variant={selectedCustomer.status === 'banned' ? 'success' : 'destructive'}
                onClick={() => {
                  toggleCustomerStatus(selectedCustomer.id);
                  setSelectedCustomer({
                    ...selectedCustomer,
                    status: selectedCustomer.status === 'banned' ? 'active' : 'banned',
                  });
                }}
              >
                {selectedCustomer.status === 'banned' ? 'Unban Account' : 'Ban Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SuperAdminLayout>
  );
}
