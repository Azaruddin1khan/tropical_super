'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  KeyRound,
  ShieldCheck,
  Save,
  RotateCcw,
  ShoppingBag,
  UtensilsCrossed,
  Tags,
  CreditCard,
  Bike,
  Users,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { AdminPermissions } from '@/types';
import { PRESET_TEMPLATES, FULL_PERMISSIONS_TEMPLATE } from '@/lib/utils';

function PermissionsContent() {
  const searchParams = useSearchParams();
  const requestedAdminId = searchParams.get('adminId');

  const { admins, updateAdminPermissions } = useSuperAdmin();

  // Selected Admin Account
  const [selectedAdminId, setSelectedAdminId] = useState<string>(
    requestedAdminId || (admins[0]?.id ?? '')
  );

  const selectedAdmin = admins.find((a) => a.id === selectedAdminId) || admins[0];

  // Working state for active permissions
  const [workingPermissions, setWorkingPermissions] = useState<AdminPermissions>(
    selectedAdmin ? selectedAdmin.permissions : FULL_PERMISSIONS_TEMPLATE
  );

  // Sync working state when selected admin changes
  useEffect(() => {
    if (selectedAdmin) {
      setWorkingPermissions(selectedAdmin.permissions);
    }
  }, [selectedAdmin]);

  // Update specific permission toggle
  const togglePermission = <M extends keyof AdminPermissions, K extends keyof AdminPermissions[M]>(
    module: M,
    key: K
  ) => {
    setWorkingPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [key]: !prev[module][key],
      },
    }));
  };

  // Apply a preset
  const applyPreset = (presetKey: string) => {
    if (presetKey === 'full') {
      setWorkingPermissions(FULL_PERMISSIONS_TEMPLATE);
    } else if (PRESET_TEMPLATES[presetKey]) {
      setWorkingPermissions(PRESET_TEMPLATES[presetKey].permissions);
    }
  };

  const handleSave = () => {
    if (!selectedAdmin) return;
    updateAdminPermissions(selectedAdmin.id, workingPermissions);
  };

  const handleReset = () => {
    if (selectedAdmin) {
      setWorkingPermissions(selectedAdmin.permissions);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Custom Roles & Permissions Engine
            </h1>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-300">
              Module 09
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Individually control what each Admin can access and perform in the existing Admin Panel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs text-slate-700">
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Reset
          </Button>
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm">
            <Save className="w-4 h-4 mr-1.5" />
            Save Permissions
          </Button>
        </div>
      </div>

      {/* Admin Selector & Preset Ribbon */}
      <Card className="border-amber-200/90 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Admin Profile Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label htmlFor="admin-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                Target Admin Account:
              </label>
              <select
                id="admin-select"
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                className="h-10 px-3 py-1 text-sm font-bold bg-white border border-slate-300 rounded-lg text-slate-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} — {admin.roleTitle} ({admin.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Presets:</span>
              </span>
              <button
                type="button"
                onClick={() => applyPreset('front_desk')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 transition-colors shadow-2xs"
              >
                Front Counter Clerk
              </button>
              <button
                type="button"
                onClick={() => applyPreset('kitchen_lead')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                Kitchen & Dispatch Lead
              </button>
              <button
                type="button"
                onClick={() => applyPreset('full')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
              >
                Full Access
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6 Modular Permission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. ORDERS PERMISSIONS */}
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="py-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-sm font-bold">1. Orders Permissions</CardTitle>
            </div>
            <CardDescription>Controls order view, workflow status, dispatch & invoices</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Switch
              label="View Orders"
              description="Access the Orders list page"
              checked={workingPermissions.orders.viewOrders}
              onChange={() => togglePermission('orders', 'viewOrders')}
            />
            <Switch
              label="View Order Details"
              description="Inspect customer address, items & customizations"
              checked={workingPermissions.orders.viewOrderDetails}
              onChange={() => togglePermission('orders', 'viewOrderDetails')}
            />
            <Switch
              label="Update Order Status"
              description="Progress status (Preparing, Dispatched, Delivered)"
              checked={workingPermissions.orders.updateOrderStatus}
              onChange={() => togglePermission('orders', 'updateOrderStatus')}
            />
            <Switch
              label="Assign Delivery Staff"
              description="Assign couriers to delivery orders"
              checked={workingPermissions.orders.assignDeliveryStaff}
              onChange={() => togglePermission('orders', 'assignDeliveryStaff')}
            />
            <Switch
              label="Cancel Orders"
              description="Reject/cancel orders with documented reason"
              checked={workingPermissions.orders.cancelOrders}
              onChange={() => togglePermission('orders', 'cancelOrders')}
            />
            <Switch
              label="Print Invoices"
              description="Print customer receipts and kitchen tickets"
              checked={workingPermissions.orders.printInvoice}
              onChange={() => togglePermission('orders', 'printInvoice')}
            />
            <Switch
              label="Export Orders"
              description="Download orders CSV or financial summary"
              checked={workingPermissions.orders.exportOrders}
              onChange={() => togglePermission('orders', 'exportOrders')}
            />
          </CardContent>
        </Card>

        {/* 2. PRODUCTS PERMISSIONS */}
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="py-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold">2. Products Permissions</CardTitle>
            </div>
            <CardDescription>Controls menu catalog, BSD pricing & stock availability</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Switch
              label="View Products"
              description="Browse restaurant menu items"
              checked={workingPermissions.products.viewProducts}
              onChange={() => togglePermission('products', 'viewProducts')}
            />
            <Switch
              label="Add New Products"
              description="Create new gyros, bowls, salads, smoothies"
              checked={workingPermissions.products.addProducts}
              onChange={() => togglePermission('products', 'addProducts')}
            />
            <Switch
              label="Edit Products & Prices"
              description="Modify ingredients, spiciness & BSD prices"
              checked={workingPermissions.products.editProducts}
              onChange={() => togglePermission('products', 'editProducts')}
            />
            <Switch
              label="Delete Products"
              description="Remove food dishes from menu"
              checked={workingPermissions.products.deleteProducts}
              onChange={() => togglePermission('products', 'deleteProducts')}
            />
            <Switch
              label="Update Stock Availability"
              description="Toggle In-Stock / Sold-Out status instantly"
              checked={workingPermissions.products.updateStockAvailability}
              onChange={() => togglePermission('products', 'updateStockAvailability')}
            />
          </CardContent>
        </Card>

        {/* 3. CATEGORIES PERMISSIONS */}
        <Card className="border-t-4 border-t-sky-500">
          <CardHeader className="py-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4 text-sky-600" />
              <CardTitle className="text-sm font-bold">3. Categories Permissions</CardTitle>
            </div>
            <CardDescription>Controls category hierarchy & menu organization</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Switch
              label="View Categories"
              description="Browse list of food categories"
              checked={workingPermissions.categories.viewCategories}
              onChange={() => togglePermission('categories', 'viewCategories')}
            />
            <Switch
              label="Add Categories"
              description="Create new menu categories"
              checked={workingPermissions.categories.addCategories}
              onChange={() => togglePermission('categories', 'addCategories')}
            />
            <Switch
              label="Edit Categories"
              description="Update category name, description & images"
              checked={workingPermissions.categories.editCategories}
              onChange={() => togglePermission('categories', 'editCategories')}
            />
            <Switch
              label="Delete Categories"
              description="Remove menu categories from customer app"
              checked={workingPermissions.categories.deleteCategories}
              onChange={() => togglePermission('categories', 'deleteCategories')}
            />
          </CardContent>
        </Card>

        {/* 4. PAYMENTS PERMISSIONS */}
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="py-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-sm font-bold">4. Payments Permissions</CardTitle>
            </div>
            <CardDescription>Controls financial records, transactions & COD settlement</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Switch
              label="View Payments"
              description="Access payment status overview"
              checked={workingPermissions.payments.viewPayments}
              onChange={() => togglePermission('payments', 'viewPayments')}
            />
            <Switch
              label="View Transactions"
              description="Inspect detailed payment transactions ledger"
              checked={workingPermissions.payments.viewTransactions}
              onChange={() => togglePermission('payments', 'viewTransactions')}
            />
            <Switch
              label="Mark Cash Received (COD)"
              description="Reconcile Cash on Delivery payments"
              checked={workingPermissions.payments.markCashReceived}
              onChange={() => togglePermission('payments', 'markCashReceived')}
            />
          </CardContent>
        </Card>

        {/* 5. DELIVERY STAFF PERMISSIONS */}
        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader className="py-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-cyan-600" />
              <CardTitle className="text-sm font-bold">5. Delivery Staff Permissions</CardTitle>
            </div>
            <CardDescription>Controls courier roster, vehicle details & assignments</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Switch
              label="View Staff"
              description="Access delivery courier list and statuses"
              checked={workingPermissions.deliveryStaff.viewStaff}
              onChange={() => togglePermission('deliveryStaff', 'viewStaff')}
            />
            <Switch
              label="Add Delivery Staff"
              description="Register new couriers to the fleet"
              checked={workingPermissions.deliveryStaff.addStaff}
              onChange={() => togglePermission('deliveryStaff', 'addStaff')}
            />
            <Switch
              label="Edit Delivery Staff"
              description="Update driver phone, vehicle & active status"
              checked={workingPermissions.deliveryStaff.editStaff}
              onChange={() => togglePermission('deliveryStaff', 'editStaff')}
            />
            <Switch
              label="Manage Assignments"
              description="Reassign orders between couriers"
              checked={workingPermissions.deliveryStaff.manageAssignments}
              onChange={() => togglePermission('deliveryStaff', 'manageAssignments')}
            />
          </CardContent>
        </Card>

        {/* 6. CUSTOMERS PERMISSIONS */}
        <Card className="border-t-4 border-t-rose-500">
          <CardHeader className="py-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              <CardTitle className="text-sm font-bold">6. Customers Permissions</CardTitle>
            </div>
            <CardDescription>Controls registered customer records & account status</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Switch
              label="View Customers"
              description="Browse customer names, emails & phone numbers"
              checked={workingPermissions.customers.viewCustomers}
              onChange={() => togglePermission('customers', 'viewCustomers')}
            />
            <Switch
              label="View Customer Details"
              description="Inspect lifetime order history & spend in BSD"
              checked={workingPermissions.customers.viewCustomerDetails}
              onChange={() => togglePermission('customers', 'viewCustomerDetails')}
            />
            <Switch
              label="Manage Customer Accounts"
              description="Toggle customer status (Active / Banned)"
              checked={workingPermissions.customers.manageCustomerAccounts}
              onChange={() => togglePermission('customers', 'manageCustomerAccounts')}
            />
          </CardContent>
        </Card>

      </div>

      {/* Floating Save Footer */}
      <div className="sticky bottom-4 z-20 p-4 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200/90 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs text-slate-700">
            Editing permissions for <strong>{selectedAdmin?.name}</strong> ({selectedAdmin?.roleTitle})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Cancel Changes
          </Button>
          <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md">
            <Save className="w-4 h-4 mr-1.5" />
            Apply & Save Permissions
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <SuperAdminLayout>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading Custom Permissions Engine...</div>}>
        <PermissionsContent />
      </Suspense>
    </SuperAdminLayout>
  );
}
