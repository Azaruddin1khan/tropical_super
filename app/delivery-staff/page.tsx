'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Bike,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Search,
  Shield,
  Eye,
  Edit,
  AlertCircle,
  Truck,
  MapPin,
  Compass,
  List,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { DriverStatusBadge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { DeliveryStaff, DriverStatus } from '@/types';
import { formatCurrency, formatShortDate } from '@/lib/utils';

// Dynamic import for Leaflet map (disables SSR to prevent window errors)
const LiveFleetMap = dynamic(
  () => import('@/components/maps/live-fleet-map').then((mod) => mod.LiveFleetMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading Nassau Fleet Radar Map...</p>
        </div>
      </div>
    ),
  }
);

export default function DeliveryStaffPage() {
  const { drivers, orders, addDriver, editDriver, toggleDriverStatus, toggleDriverActive } = useSuperAdmin();

  const [activeView, setActiveView] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DeliveryStaff | null>(null);
  const [viewingOrdersDriver, setViewingOrdersDriver] = useState<DeliveryStaff | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Electric Scooter',
    vehicleNumber: '',
  });

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      if (statusFilter !== 'all' && driver.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = driver.name.toLowerCase().includes(q);
        const matchPhone = driver.phone.toLowerCase().includes(q);
        const matchPlate = driver.vehicleNumber.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchPlate) return false;
      }
      return true;
    });
  }, [drivers, statusFilter, searchQuery]);

  const openAddModal = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicleType: 'Electric Scooter',
      vehicleNumber: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (driver: DeliveryStaff) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingDriver) {
      editDriver({
        ...editingDriver,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber.trim(),
      });
      setEditingDriver(null);
    } else {
      addDriver({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber.trim() || 'BS-SCOOT-01',
        status: 'available',
        isActive: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Delivery Staff & Couriers
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Dispatch fleet managing Tropical Gyros customer deliveries across South Beach
            </p>
          </div>

          <Button
            onClick={openAddModal}
            className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Courier
          </Button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Available for Dispatch
                </span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {drivers.filter((d) => d.status === 'available').length} Couriers
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
                  Currently on Delivery
                </span>
                <p className="text-2xl font-bold text-sky-600 mt-1">
                  {drivers.filter((d) => d.status === 'on_delivery').length} Couriers
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Fleet
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {drivers.length} Couriers
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Switcher: Fleet Radar Map vs Directory Table */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-600" />
              <span>🛰️ Live Fleet Radar (Map)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4 text-slate-600" />
              <span>📋 Couriers Directory ({drivers.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
            {activeView === 'map' ? '🛰️ Real-time GPS Telemetry Active' : 'Staff profiles & accounts'}
          </span>
        </div>

        {activeView === 'map' ? (
          <LiveFleetMap drivers={drivers} orders={orders} />
        ) : (
          <>
            {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courier by name, phone, or license plate..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">All Courier Statuses</option>
            <option value="available">Available Only</option>
            <option value="on_delivery">On Delivery</option>
            <option value="offline">Offline / Off Shift</option>
          </select>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Courier</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                  <th className="py-3.5 px-4 font-semibold">Vehicle & Plate</th>
                  <th className="py-3.5 px-4 font-semibold">Status Toggle</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No couriers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Courier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200 shrink-0">
                            {driver.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{driver.name}</span>
                            <span className="text-[11px] text-slate-400">ID: {driver.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{driver.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500">{driver.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle & Plate */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {driver.vehicleType}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {driver.vehicleNumber}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <DriverStatusBadge status={driver.status} />
                          <select
                            value={driver.status}
                            onChange={(e) => toggleDriverStatus(driver.id, e.target.value as DriverStatus)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="available">Available</option>
                            <option value="on_delivery">On Delivery</option>
                            <option value="offline">Offline</option>
                          </select>
                        </div>
                      </td>

                      {/* Account Status Switch */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleDriverActive(driver.id)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                              driver.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                driver.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-medium text-slate-600">
                            {driver.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-sky-700 hover:text-sky-800 hover:bg-sky-50 px-2"
                            onClick={() => setViewingOrdersDriver(driver)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Orders
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-600"
                            onClick={() => openEditModal(driver)}
                          >
                            <Edit className="w-3.5 h-3.5" />
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
        </>
      )}
      </div>

      {/* Add / Edit Courier Modal */}
      {(isAddModalOpen || editingDriver) && (
        <Modal
          isOpen={isAddModalOpen || !!editingDriver}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingDriver(null);
          }}
          title={editingDriver ? `Edit Courier — ${editingDriver.name}` : 'Register New Courier'}
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Leo Santos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number *"
                placeholder="+1 (555) 019-2831"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label="Email"
                type="email"
                placeholder="courier@tropicalgyros.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Vehicle Type"
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                options={[
                  { label: 'Electric Scooter', value: 'Electric Scooter' },
                  { label: 'Motorcycle', value: 'Motorcycle' },
                  { label: 'Compact Car', value: 'Compact Car' },
                  { label: 'Bicycle', value: 'Bicycle' },
                ]}
              />

              <Input
                label="License Plate / ID"
                placeholder="BS-SCOOT-04"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDriver(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-semibold">
                {editingDriver ? 'Save Changes' : 'Register Courier'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Viewing Driver's Assigned Orders Modal */}
      {viewingOrdersDriver && (
        <Modal
          isOpen={!!viewingOrdersDriver}
          onClose={() => setViewingOrdersDriver(null)}
          title={`Assigned Deliveries — ${viewingOrdersDriver.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{viewingOrdersDriver.name}</p>
                <p className="text-slate-500">{viewingOrdersDriver.vehicleType} • {viewingOrdersDriver.vehicleNumber}</p>
              </div>
              <DriverStatusBadge status={viewingOrdersDriver.status} />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Active Assignments
              </h4>
              {orders.filter((o) => o.assignedDriverId === viewingOrdersDriver.id).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No active delivery assignments at the moment.
                </p>
              ) : (
                orders
                  .filter((o) => o.assignedDriverId === viewingOrdersDriver.id)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{order.id}</span>
                        <span className="text-slate-500">{order.customerName} • {order.deliveryAddress?.street || 'Store Pickup'}</span>
                      </div>
                      <span className="font-bold text-amber-800">{formatCurrency(order.total)}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setViewingOrdersDriver(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SuperAdminLayout>
  );
}
