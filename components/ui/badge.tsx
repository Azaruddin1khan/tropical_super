import React from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus, PaymentStatus, DriverStatus } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'outline'
    | 'purple'
    | 'slate';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-amber-100 text-amber-900 border-amber-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-sky-100 text-sky-800 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'bg-white text-slate-700 border-slate-300',
    purple: 'bg-amber-100 text-amber-900 border-amber-200', // Mapped to Tropical Amber standard
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium border',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors leading-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="neutral">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Pending
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Processing
        </Badge>
      );
    case 'preparing':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Preparing
        </Badge>
      );
    case 'out_for_delivery':
      return (
        <Badge variant="info">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          Out for Delivery
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Delivered
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Completed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case 'paid':
      return <Badge variant="success">Paid</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'refunded':
      return <Badge variant="info">Refunded</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  switch (status) {
    case 'available':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Available
        </Badge>
      );
    case 'on_delivery':
      return (
        <Badge variant="info">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          On Delivery
        </Badge>
      );
    case 'offline':
      return (
        <Badge variant="neutral">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Offline
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
