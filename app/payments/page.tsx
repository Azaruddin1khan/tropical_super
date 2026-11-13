'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Eye,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PaymentStatusBadge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order, PaymentMethod, PaymentStatus } from '@/types';

interface TransactionRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  transactionRef: string;
  notes?: string;
}

export default function PaymentsPage() {
  const { orders, markCodAsPaid } = useSuperAdmin();

  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);

  // Generate transaction records from orders
  const transactions: TransactionRecord[] = useMemo(() => {
    const liveFromOrders: TransactionRecord[] = orders.map((o) => ({
      id: `TXN-${o.id.replace('TRP-', '').replace('TG-', '')}`,
      orderId: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      amount: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      transactionRef: `REF-${o.id}-${o.paymentMethod.toUpperCase()}`,
      notes: o.paymentMethod === 'cod' ? 'Cash collected on delivery' : 'Settled via digital gateway',
    }));

    const extraHistorical: TransactionRecord[] = [
      {
        id: 'TXN-9011',
        orderId: 'TRP-884910',
        customerName: 'Marcus Vance',
        customerPhone: '+1 (555) 234-8899',
        amount: 28.50,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        createdAt: '2026-10-27T18:15:00.000Z',
        transactionRef: 'REF-884910-STRIPE',
        notes: 'Pre-authorized via online checkout',
      },
      {
        id: 'TXN-9013',
        orderId: 'TRP-884905',
        customerName: 'Brian Taylor',
        customerPhone: '+1 (555) 789-0011',
        amount: 34.20,
        paymentMethod: 'card',
        paymentStatus: 'failed',
        createdAt: '2026-10-25T19:40:00.000Z',
        transactionRef: 'REF-884905-FAIL-DEC',
        notes: 'Customer card expired / declined by issuer',
      },
    ];

    return [...liveFromOrders, ...extraHistorical];
  }, [orders]);

  // Financial KPIs
  const totalSettled = transactions
    .filter((t) => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.amount, 0) + 3420.0;

  const pendingCodTotal = transactions
    .filter((t) => t.paymentMethod === 'cod' && t.paymentStatus === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const qrVolumeTotal = transactions
    .filter((t) => t.paymentMethod === 'qr_payment')
    .reduce((sum, t) => sum + t.amount, 0);

  const digitalCardVolume = transactions
    .filter((t) => t.paymentMethod === 'card' || t.paymentMethod === 'apple_pay' || t.paymentMethod === 'google_pay')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (activeTab === 'paid' && t.paymentStatus !== 'paid') return false;
      if (activeTab === 'pending' && t.paymentStatus !== 'pending') return false;
      if (activeTab === 'failed' && t.paymentStatus !== 'failed' && t.paymentStatus !== 'refunded') return false;
      if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id.toLowerCase().includes(q);
        const matchOrder = t.orderId.toLowerCase().includes(q);
        const matchName = t.customerName.toLowerCase().includes(q);
        const matchRef = t.transactionRef.toLowerCase().includes(q);
        if (!matchId && !matchOrder && !matchName && !matchRef) return false;
      }
      return true;
    });
  }, [transactions, activeTab, methodFilter, searchQuery]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header matching Screenshot 4 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Payments & Settlements
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track customer transactions, credit card settlements, Dynamic QR payments & Cash on Delivery
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full border border-emerald-300">
              Gateway Simulation Active
            </span>
          </div>
        </div>

        {/* 4 Financial Metric Cards matching Screenshot 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Settled Revenue
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalSettled)}
                </div>
                <div className="flex items-center text-xs font-medium text-emerald-600 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>+11.4% vs last week</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-amber-200 bg-amber-50/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-amber-800 tracking-wider">
                  Pending COD Cash
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-amber-900">
                  {formatCurrency(pendingCodTotal)}
                </div>
                <div className="text-xs text-amber-700 mt-1 font-medium">
                  Awaiting driver cash hand-over
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Dynamic QR Volume
                </span>
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(qrVolumeTotal)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  16% of total customer transactions
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Cards & Wallets
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(digitalCardVolume)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Visa, Mastercard, Apple/Google</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Bar matching Screenshot 4 */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
          {(
            [
              { label: 'All Transactions', value: 'all' },
              { label: 'Settled / Paid', value: 'paid' },
              { label: 'Pending Collections', value: 'pending' },
              { label: 'Failed / Declined', value: 'failed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Method Filter matching Screenshot 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID, Order #, Customer, or Ref..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Payment Channels</option>
            <option value="cod">Cash on Delivery</option>
            <option value="card">Credit / Debit Card</option>
            <option value="qr_payment">Dynamic QR Payment</option>
            <option value="apple_pay">Apple Pay</option>
            <option value="google_pay">Google Pay</option>
          </select>
        </div>

        {/* Transactions Table matching Screenshot 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Txn ID / Ref</th>
                  <th className="py-3.5 px-4 font-semibold">Order</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Payment Channel</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No payment records found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* TXN ID / Ref */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{txn.id}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {txn.transactionRef}
                        </span>
                      </td>

                      {/* Order link in bold amber */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-700">{txn.orderId}</span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block">{txn.customerName}</span>
                        <span className="text-xs text-slate-400">{txn.customerPhone}</span>
                      </td>

                      {/* Payment Channel with icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {txn.paymentMethod === 'cod' && (
                            <Banknote className="w-4 h-4 text-amber-600" />
                          )}
                          {txn.paymentMethod === 'qr_payment' && (
                            <QrCode className="w-4 h-4 text-sky-600" />
                          )}
                          {txn.paymentMethod === 'card' && (
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                          )}
                          <span className="text-xs font-semibold text-slate-700 uppercase">
                            {txn.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(txn.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge status={txn.paymentStatus} />
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(txn.createdAt)}
                      </td>

                      {/* Actions with Mark Paid green button for COD */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {txn.paymentMethod === 'cod' && txn.paymentStatus === 'pending' && (
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5"
                              onClick={() => markCodAsPaid(txn.orderId)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={() => setSelectedTxn(txn)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
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

      {/* Payment Receipt / Inspection Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title={`Payment Receipt — ${selectedTxn.id}`}
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">Settlement Amount</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(selectedTxn.amount)}
              </p>
              <div className="mt-2 flex justify-center">
                <PaymentStatusBadge status={selectedTxn.paymentStatus} />
              </div>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Transaction Ref</span>
                <span className="font-mono font-medium text-slate-900">{selectedTxn.transactionRef}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Order ID</span>
                <span className="font-bold text-amber-700">{selectedTxn.orderId}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-semibold text-slate-900">{selectedTxn.customerName}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Channel / Method</span>
                <span className="uppercase font-bold text-slate-800">{selectedTxn.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Processed At</span>
                <span>{formatDate(selectedTxn.createdAt)}</span>
              </div>
              {selectedTxn.notes && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Notes</span>
                  <span className="text-slate-700 italic">{selectedTxn.notes}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedTxn(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-1 text-slate-500" />
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SuperAdminLayout>
  );
}
