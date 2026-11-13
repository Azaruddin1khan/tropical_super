'use client';

import React, { useState } from 'react';
import {
  Settings,
  Store,
  MapPin,
  Clock,
  Save,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { RestaurantSettings } from '@/types';

export default function SettingsPage() {
  const { settings, updateSettings } = useSuperAdmin();

  const [formData, setFormData] = useState<RestaurantSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <SuperAdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Restaurant System Settings
            </h1>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-300">
              Module 11
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global store configuration, operating hours, and 3.0-mile delivery perimeter enforcement
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {savedSuccess ? 'Settings Saved!' : 'Save System Settings'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Store Identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-bold">1. Restaurant Identity & Branding</CardTitle>
            </div>
            <CardDescription>Primary restaurant branding and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Restaurant Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Brand Tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Operations Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Store Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Physical Location & 3-Mile Delivery Radius */}
        <Card className="border-emerald-200/90">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold">2. Location & 3-Mile Delivery Radius</CardTitle>
            </div>
            <CardDescription>Strict geographic enforcement for mobile delivery orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Kitchen Street Address *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="State / Island *"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              <Input
                label="Postal Code *"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </div>

            {/* Strict Radius Highlight */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Maximum Delivery Radius (Miles)
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Strict 3.0 Miles Policy
                </span>
              </div>
              <Input
                type="number"
                step="0.1"
                value={formData.maxDeliveryRadiusMiles}
                onChange={(e) => setFormData({ ...formData, maxDeliveryRadiusMiles: parseFloat(e.target.value) || 3.0 })}
              />
              <p className="text-[11px] text-emerald-700 leading-snug">
                Customer mobile app calculates distance from this kitchen address. Addresses greater than 3.0 miles are restricted to Store Pickup only.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Financial & Fee Defaults (BSD) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-sm font-bold">3. Financial & Fee Defaults (BSD)</CardTitle>
            </div>
            <CardDescription>Default checkout fees applied in Bahamian Dollars</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Delivery Fee (BSD)"
                type="number"
                step="0.01"
                value={formData.deliveryFeeBsd}
                onChange={(e) => setFormData({ ...formData, deliveryFeeBsd: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="VAT / Tax Rate (Decimal e.g. 0.08 = 8%)"
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Platform Fee (BSD)"
                type="number"
                step="0.01"
                value={formData.platformFeeBsd}
                onChange={(e) => setFormData({ ...formData, platformFeeBsd: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Operating Hours & Support */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <CardTitle className="text-sm font-bold">4. Store Operating Schedule & Support</CardTitle>
            </div>
            <CardDescription>Active operating hours and customer service contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Business Operating Hours"
                value={formData.businessHours}
                onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
              />
              <Input
                label="Customer Support Contact"
                value={formData.supportContact}
                onChange={(e) => setFormData({ ...formData, supportContact: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 shadow-md">
            <Save className="w-4 h-4 mr-1.5" />
            {savedSuccess ? 'Settings Saved Successfully!' : 'Save System Settings'}
          </Button>
        </div>
      </form>
    </SuperAdminLayout>
  );
}

