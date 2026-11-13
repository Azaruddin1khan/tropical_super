'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  Bike,
  CheckCircle2,
  Clock,
  Printer,
  XCircle,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  QrCode,
  Barcode,
  Eye,
  Check,
  Flame,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { OrderStatusBadge, PaymentStatusBadge, DriverStatusBadge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const ORDER_TABS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ORDER_LIFECYCLE_STEPS: OrderStatus[] = [
  'pending',
  'processing',
  'preparing',
  'out_for_delivery',
  'delivered',
  'completed',
];

export default function OrdersPage() {
  const { orders, drivers, updateOrderStatus, assignDriver, cancelOrder, markCodAsPaid } = useSuperAdmin();

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assigningDriverOrderId, setAssigningDriverOrderId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filter & Sort
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (activeTab !== 'all' && order.orderStatus !== activeTab) return false;
        if (paymentFilter !== 'all' && order.paymentMethod !== paymentFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = order.id.toLowerCase().includes(q);
          const matchBarcode = order.barcodeId.toLowerCase().includes(q);
          const matchName = order.customerName.toLowerCase().includes(q);
          const matchPhone = order.customerPhone.toLowerCase().includes(q);
          const matchStreet = order.deliveryAddress.street.toLowerCase().includes(q);
          if (!matchId && !matchBarcode && !matchName && !matchPhone && !matchStreet) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'total_desc') return b.total - a.total;
        if (sortBy === 'total_asc') return a.total - b.total;
        return 0;
      });
  }, [orders, activeTab, paymentFilter, searchQuery, sortBy]);

  const handleAssignDriver = () => {
    if (!assigningDriverOrderId || !selectedDriverId) return;
    const driver = drivers.find((d) => d.id === selectedDriverId);
    if (driver) {
      assignDriver(assigningDriverOrderId, driver.id, `${driver.name} (${driver.vehicleType})`);
      setAssigningDriverOrderId(null);
      setSelectedDriverId('');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header Title & Actions matching Screenshot 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Orders Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live orders dispatch, kitchen prep queue, customer addresses & delivery tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-full border border-amber-300">
              {orders.length} Active Simulated Orders
            </span>
          </div>
        </div>

        {/* Status Tabs Bar matching Screenshot 1 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
          {ORDER_TABS.map((tab) => {
            const count = tabCounts[tab.value] || 0;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar matching Screenshot 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (e.g. TG-1082), Customer Name, Phone, or Street..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">All Payment Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="card">Credit / Debit Card</option>
              <option value="qr_payment">Dynamic QR Payment</option>
              <option value="apple_pay">Apple Pay</option>
              <option value="google_pay">Google Pay</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="date_desc">Newest Orders First</option>
              <option value="date_asc">Oldest Orders First</option>
              <option value="total_desc">Highest Total Amount</option>
              <option value="total_asc">Lowest Total Amount</option>
            </select>
          </div>
        </div>

        {/* Orders Table matching Screenshot 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order</th>
                  <th className="py-3.5 px-4 font-semibold">Customer & Delivery</th>
                  <th className="py-3.5 px-4 font-semibold">Items</th>
                  <th className="py-3.5 px-4 font-semibold">Total</th>
                  <th className="py-3.5 px-4 font-semibold">Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Order Status</th>
                  <th className="py-3.5 px-4 font-semibold">Driver</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No orders found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-amber-50/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Order */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors block">
                          {order.id}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>

                      {/* Customer & Delivery */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-semibold text-slate-800 block truncate">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-slate-500 block truncate">
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {order.customerPhone} ({order.deliveryAddress.distanceMiles} mi)
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 block">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} items
                        </span>
                        <span className="text-xs text-slate-500 truncate block max-w-[160px]">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </span>
                      </td>

                      {/* Total in BSD */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <PaymentStatusBadge status={order.paymentStatus} />
                          <span className="block text-[10px] uppercase font-bold text-slate-500">
                            {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>

                      {/* Driver */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {order.assignedDriverName ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Bike className="w-3.5 h-3.5 text-sky-600" />
                            <span className="font-medium">{order.assignedDriverName}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                            onClick={() => {
                              setAssigningDriverOrderId(order.id);
                              setSelectedDriverId(drivers[0]?.id || '');
                            }}
                          >
                            + Assign Driver
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
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

      {/* Driver Assignment Modal */}
      {assigningDriverOrderId && (
        <Modal
          isOpen={!!assigningDriverOrderId}
          onClose={() => setAssigningDriverOrderId(null)}
          title="Assign Courier for Delivery"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select an available courier to dispatch Order #{assigningDriverOrderId}.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {drivers.map((driver) => (
                <label
                  key={driver.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedDriverId === driver.id
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="selected_driver"
                      checked={selectedDriverId === driver.id}
                      onChange={() => setSelectedDriverId(driver.id)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{driver.name}</p>
                      <p className="text-xs text-slate-500">
                        {driver.vehicleType} • {driver.vehicleNumber} ({driver.phone})
                      </p>
                    </div>
                  </div>
                  <DriverStatusBadge status={driver.status} />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={() => setAssigningDriverOrderId(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="bg-sky-600 hover:bg-sky-700 text-white"
                onClick={handleAssignDriver}
              >
                Confirm Dispatch
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Comprehensive Order Details Side Panel / Large Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Inspection & Dispatch — ${selectedOrder.id}`}
          size="xl"
        >
          <div className="space-y-6 text-sm">
            {/* Top Order Lifecycle Progress Stepper */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Super Admin Status Override
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Placed: {formatDate(selectedOrder.createdAt)}
                </span>
              </div>

              {/* Progress step bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = ORDER_LIFECYCLE_STEPS.indexOf(selectedOrder.orderStatus);
                  const isPassed = currentIdx >= idx;
                  const isCurrent = selectedOrder.orderStatus === step;

                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, step);
                        setSelectedOrder({ ...selectedOrder, orderStatus: step });
                      }}
                      className={`p-2 rounded-xl text-center border transition-all text-xs flex flex-col items-center justify-center gap-1 ${
                        isCurrent
                          ? 'bg-amber-500 text-white font-bold border-amber-600 shadow'
                          : isPassed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="capitalize font-semibold text-[11px]">
                        {step.replace('_', ' ')}
                      </span>
                      {isPassed && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer & Delivery vs Payment & Courier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Customer & Destination</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{selectedOrder.customerName}</p>
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedOrder.customerEmail}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                    Delivery Address ({selectedOrder.deliveryAddress.distanceMiles} Miles from Kitchen)
                  </span>
                  <p className="text-slate-800 font-medium">
                    {selectedOrder.deliveryAddress.street}
                    {selectedOrder.deliveryAddress.apartment ? `, Apt ${selectedOrder.deliveryAddress.apartment}` : ''}
                    , {selectedOrder.deliveryAddress.city} {selectedOrder.deliveryAddress.postalCode}
                  </p>
                </div>

                {/* Handover Barcode Pill */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Customer Handover Barcode
                    </span>
                    <span className="font-mono font-black text-slate-900 text-xs">
                      {selectedOrder.barcodeId}
                    </span>
                  </div>
                  <Barcode className="w-6 h-6 text-amber-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Payment & Settlement (BSD)</span>
                  </div>
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Method</span>
                    <span className="font-bold uppercase text-slate-800">
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Delivery Fee</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Tax</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-sm font-bold text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-base text-amber-800">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.paymentMethod === 'cod' && selectedOrder.paymentStatus === 'pending' && (
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() => {
                      markCodAsPaid(selectedOrder.id);
                      setSelectedOrder({ ...selectedOrder, paymentStatus: 'paid' });
                    }}
                  >
                    <ShieldCheck className="w-4 h-4 mr-1.5" />
                    Mark COD Paid ({formatCurrency(selectedOrder.total)})
                  </Button>
                )}
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-3">Order Items ({selectedOrder.items.length})</h4>
              <div className="divide-y divide-slate-100">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.quantity}x {item.productName}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-xs text-amber-700 italic mt-0.5">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-1.5 text-slate-500" />
                Print Order Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SuperAdminLayout>
  );
}
