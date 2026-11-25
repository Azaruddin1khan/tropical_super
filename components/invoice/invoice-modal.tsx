'use client';

import React, { useEffect } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@/types';

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: {
    id: string;
    orderId: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    transactionRef: string;
    notes?: string;
  } | null;
  order?: Order | null;
}

export function InvoiceModal({
  isOpen,
  onClose,
  transaction,
  order,
}: InvoiceModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve metadata
  const orderId = transaction?.orderId || order?.id || 'TRP-858573';
  const invoiceNum = transaction?.id?.replace('TXN-', '') || orderId.replace('TRP-', '').replace('TG-', '') || '858573';
  const customerName = order?.customerName || transaction?.customerName || 'Tropical Guest';
  const customerPhone = order?.customerPhone || transaction?.customerPhone || '+1 (242) 555-0192';
  const customerEmail = order?.customerEmail || 'guest@tropicalgyros.com';
  const paymentMethod = (transaction?.paymentMethod || order?.paymentMethod || 'card').toLowerCase();
  const paymentStatus = (transaction?.paymentStatus || order?.paymentStatus || 'paid').toLowerCase();
  const createdAt = transaction?.createdAt || order?.createdAt || new Date().toISOString();
  const transactionRef = transaction?.transactionRef || `REF-${orderId}-${paymentMethod.toUpperCase()}`;
  const notes = transaction?.notes || order?.deliveryAddress?.deliveryNotes || 'Settled via digital gateway';

  // Address
  const addressStr = order?.deliveryAddress
    ? `${order.deliveryAddress.street}${order.deliveryAddress.apartment ? `, ${order.deliveryAddress.apartment}` : ''}, ${order.deliveryAddress.city}`
    : 'Rosetta St & Mackey St, Palmdale, Nassau';

  const fulfillmentType = order?.deliveryType === 'pickup' ? 'In-Store Pickup' : 'Direct Doorstep Delivery';

  // Financials
  const totalAmount = transaction?.amount ?? order?.total ?? 14.54;
  const subtotal = order?.subtotal ?? Math.round((totalAmount / 1.1) * 100) / 100;
  const tax = order?.tax ?? Math.round((totalAmount - subtotal) * 100) / 100;
  const deliveryFee = order?.deliveryFee ?? (order?.deliveryType === 'pickup' ? 0 : 0);
  const discount = order?.discount ?? 0;

  const items = order?.items && order.items.length > 0 ? order.items : null;

  const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed';
  const isPending = paymentStatus === 'pending';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 modal-backdrop-print-hide">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col modal-dialog-print-expand">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tax Invoice & Payment Receipt</h2>
              <p className="text-xs text-slate-500 font-mono">INV-{invoiceNum} &bull; {orderId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-100/50 print:bg-white print:p-0">
          
          {/* Printable Sheet */}
          <div
            id="printable-invoice"
            className="printable-invoice-container bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 max-w-2xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {/* Official Logo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/tropical_gyros_logo.png"
                    alt="Tropical Gyros Logo"
                    className="h-14 w-auto object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                      TROPICAL GYROS
                    </h1>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                      Greek &bull; Mediterranean &bull; Island Grill
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    Rosetta St & Mackey St, Palmdale, Nassau, Bahamas
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    +1 (242) 325-GYRO &bull; accounts@tropicalgyros.com
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    VAT Reg: <span className="font-mono font-medium text-slate-600">BS-VAT-89210-TG</span>
                  </p>
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div className="sm:text-right space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg w-full sm:w-auto border sm:border-none border-slate-100">
                <div className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider rounded border border-amber-300">
                  Tax Invoice / Receipt
                </div>
                <p className="text-base font-extrabold font-mono text-slate-900 pt-1">
                  INV-{invoiceNum}
                </p>
                <p className="text-xs text-slate-500">
                  Date: <span className="font-medium text-slate-700">{formatDate(createdAt)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Order ID: <span className="font-bold text-amber-700 font-mono">{orderId}</span>
                </p>
                
                {/* Status Stamp */}
                <div className="pt-1.5 sm:flex sm:justify-end">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      PAID & SETTLED
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      PAYMENT PENDING
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      {paymentStatus.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Billed To & Transaction Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
              <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Billed To (Customer)
                </span>
                <p className="font-bold text-sm text-slate-900">{customerName}</p>
                <p className="text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {customerPhone}
                </p>
                <p className="text-slate-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> {customerEmail}
                </p>
                <p className="text-slate-600 flex items-center gap-1 pt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {addressStr}
                </p>
                <p className="text-amber-800 font-medium text-[11px] pt-0.5">
                  Mode: {fulfillmentType}
                </p>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Settlement & Gateway Details
                </span>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Channel / Method:</span>
                  <span className="font-bold text-slate-900 uppercase flex items-center gap-1">
                    {paymentMethod === 'card' ? (
                      <CreditCard className="w-3 h-3 text-sky-600" />
                    ) : (
                      <Banknote className="w-3 h-3 text-emerald-600" />
                    )}
                    {paymentMethod.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-mono text-slate-800 font-medium truncate max-w-[160px]">{transactionRef}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Terminal Dispatch:</span>
                  <span className="text-slate-700">HQ Front Register #01</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Notes / Memo:</span>
                  <span className="text-slate-700 italic truncate max-w-[160px]">{notes}</span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-5 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Order Items & Service Breakdown
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                      <th className="py-2 px-2 text-left w-8">#</th>
                      <th className="py-2 px-3 text-left">Item Description</th>
                      <th className="py-2 px-2 text-center w-14">Qty</th>
                      <th className="py-2 px-3 text-right w-24">Rate</th>
                      <th className="py-2 px-3 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items ? (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <p className="font-bold text-slate-800">{item.productName || (item as any).name || 'Menu Item'}</p>
                            {item.specialInstructions && (
                              <p className="text-[11px] text-amber-700 italic">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-2 text-slate-400 font-mono">1</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">
                            Restaurant Food & Beverage Service — Order #{orderId}
                          </p>
                          <p className="text-[11px] text-slate-500 italic">
                            Settled via {paymentMethod.toUpperCase()} &bull; Official Dine-In / Takeaway Dispatch
                          </p>
                        </td>
                        <td className="py-3 px-2 text-center font-semibold text-slate-700">1</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(subtotal)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Totals */}
            <div className="py-5 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column: Security & Terms */}
              <div className="space-y-3">
                {/* Barcode Strip */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center">
                  <div className="flex items-center gap-[2.5px] h-8 mb-1" aria-hidden="true">
                    {[2,1,3,1,2,4,1,3,2,1,4,1,2,3,1,4,2,1,3,2,4,1,2,3,1,4,2,1,3].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800 h-full rounded-[0.5px]"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-600 tracking-widest">
                    *{orderId}*
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p className="flex items-center gap-1 font-semibold text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Authentic Bahamas Registered Tax Receipt
                  </p>
                  <p>All items freshly prepared according to health & sanitation standards.</p>
                </div>
              </div>

              {/* Right Column: Financials */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between py-1 text-slate-600">
                  <span>Bahamas VAT (10%)</span>
                  <span className="font-mono font-medium">{formatCurrency(tax)}</span>
                </div>

                {deliveryFee > 0 && (
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Delivery Fee</span>
                    <span className="font-mono font-medium">{formatCurrency(deliveryFee)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-600">
                    <span>Promo / Discount</span>
                    <span className="font-mono font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-slate-900 mt-2">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-amber-900 tracking-wider block">
                        Total Settlement
                      </span>
                      <span className="text-[10px] text-slate-500">All taxes & fees included</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-5 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700">
                Thank you for choosing Tropical Gyros! We appreciate your patronage.
              </p>
              <p className="text-[11px]">
                Rosetta St & Mackey St &bull; Palmdale, Nassau &bull; Bahamas &bull; Tel: +1 (242) 325-GYRO
              </p>
              <p className="text-[10px] text-slate-400 pt-1 font-mono">
                Computer-generated official invoice &bull; Generated from Tropical Gyros Cloud ERP
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Ctrl+P</kbd> or click Print to download PDF.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
