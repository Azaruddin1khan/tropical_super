'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  KeyRound,
  Edit2,
  Trash2,
  Power,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/context/super-admin-context';
import { AdminAccount } from '@/types';
import { formatDate, PRESET_TEMPLATES } from '@/lib/utils';

export default function AdminsPage() {
  const { admins, addAdmin, editAdmin, toggleAdminStatus, deleteAdmin } = useSuperAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleTitle: 'Kitchen Supervisor',
    preset: 'kitchen_lead',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit modal states
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editPasswordError, setEditPasswordError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'TG#';
    for (let i = 0; i < 7; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const copyToClipboard = (text: string, keyName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      admin.name.toLowerCase().includes(q) ||
      admin.email.toLowerCase().includes(q) ||
      admin.roleTitle.toLowerCase().includes(q)
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Admin full name is required';
    if (!formData.email.trim()) errors.email = 'Admin email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.password) {
      errors.password = 'Initial sign-in password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const selectedPreset = PRESET_TEMPLATES[formData.preset] || PRESET_TEMPLATES.kitchen_lead;

    addAdmin({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password.trim(),
      roleTitle: formData.roleTitle.trim(),
      status: 'active',
      lastActive: new Date().toISOString(),
      permissions: selectedPreset.permissions,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      roleTitle: 'Kitchen Supervisor',
      preset: 'kitchen_lead',
    });
    setFormErrors({});
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    if (editPassword.trim()) {
      if (editPassword.length < 6) {
        setEditPasswordError('New password must be at least 6 characters');
        return;
      }
      editAdmin({ ...editingAdmin, password: editPassword.trim() });
    } else {
      editAdmin(editingAdmin);
    }

    setEditingAdmin(null);
    setEditPassword('');
    setEditPasswordError('');
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Account Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, activate, deactivate, and govern credentials for staff accessing the existing Admin Panel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-full border border-amber-300">
            {admins.length} Registered Admins
          </span>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Admin Account
          </Button>
        </div>
      </div>

      {/* Info Callout: Relationship to Existing Panel */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Central Access Control:</strong> The accounts listed below are credentials used by restaurant staff to log into the <strong>Existing Admin Panel</strong>. Super Admin holds sole authority to create accounts, toggle active status, and assign granular permissions.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search admin by name, role or email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Admins Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Admin Staff Member</th>
                <th className="py-3.5 px-4 font-semibold">Operational Role</th>
                <th className="py-3.5 px-4 font-semibold">Contact</th>
                <th className="py-3.5 px-4 font-semibold">Account Status</th>
                <th className="py-3.5 px-4 font-semibold">Last Active</th>
                <th className="py-3.5 px-4 font-semibold text-right">Supervisory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200 text-xs">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{admin.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{admin.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {admin.roleTitle}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5 text-slate-600">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{admin.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{admin.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {admin.status === 'active' ? (
                        <Badge variant="success" className="font-semibold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                          Active Access
                        </Badge>
                      ) : (
                        <Badge variant="slate" className="font-semibold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                          Deactivated
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatDate(admin.lastActive)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/permissions?adminId=${admin.id}`}>
                          <Button variant="outline" size="sm" className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300">
                            <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            Permissions
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAdmin(admin)}
                          title="Edit Admin Information"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAdminStatus(admin.id)}
                          title={admin.status === 'active' ? 'Deactivate Access' : 'Activate Access'}
                          className={admin.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE ADMIN MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Admin Account"
        description="Provision login credentials and baseline permissions for the existing Admin Panel."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Staff Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Johnathan Rolle"
            error={formErrors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Staff Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. j.rolle@tropicalgyros.com"
              error={formErrors.email}
            />
            <Input
              label="Phone Number *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +1 (242) 555-0123"
              error={formErrors.phone}
            />
          </div>

          {/* Sign-In Password Field with Generator & Toggle */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Temporary Sign-In Password *</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const newPass = generateRandomPassword();
                  setFormData({ ...formData, password: newPass });
                  if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-white hover:bg-amber-100/70 border border-amber-300 px-2.5 py-1 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>🎲 Generate Secure</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showCreatePassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                }}
                placeholder="e.g. TG#Admin@2026"
                className="w-full h-10 px-3.5 pr-20 text-sm font-mono bg-white border border-amber-300 rounded-lg text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                {formData.password && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.password, 'create_pass')}
                    className="p-1.5 hover:text-slate-800 rounded-md transition-colors"
                    title="Copy Password"
                  >
                    {copiedKey === 'create_pass' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="p-1.5 hover:text-slate-800 rounded-md transition-colors"
                  title={showCreatePassword ? 'Hide Password' : 'Show Password'}
                >
                  {showCreatePassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {formErrors.password && (
              <p className="text-xs text-rose-600 font-medium">{formErrors.password}</p>
            )}

            <p className="text-[11px] text-amber-900/80">
              Staff will use this password alongside their email to sign into the existing Admin Panel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Operational Role Title *"
              value={formData.roleTitle}
              onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
              placeholder="e.g. Kitchen Supervisor"
            />
            <Select
              label="Initial Permission Template"
              value={formData.preset}
              onChange={(e) => setFormData({ ...formData, preset: e.target.value })}
            >
              <option value="front_desk">Front Counter Clerk (Orders & Slip Print)</option>
              <option value="kitchen_lead">Kitchen Lead (Prep & Dispatch)</option>
              <option value="operations_manager">Operations Manager (Full Operational Access)</option>
            </Select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            <strong>Note:</strong> You can fine-tune every single module permission (Orders, Products, Categories, Payments, Staff, Customers) after creating the account via the <strong>Custom Permissions Matrix</strong>.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT ADMIN MODAL */}
      {editingAdmin && (
        <Modal
          isOpen={true}
          onClose={() => setEditingAdmin(null)}
          title={`Edit Admin: ${editingAdmin.name}`}
          description="Update staff profile and credentials."
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Staff Full Name *"
              value={editingAdmin.name}
              onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
            />
            <Input
              label="Email Address *"
              type="email"
              value={editingAdmin.email}
              onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
            />
            <Input
              label="Phone Number *"
              value={editingAdmin.phone}
              onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
            />
            <Input
              label="Operational Role Title"
              value={editingAdmin.roleTitle}
              onChange={(e) => setEditingAdmin({ ...editingAdmin, roleTitle: e.target.value })}
            />
            <Select
              label="Account Status"
              value={editingAdmin.status}
              onChange={(e) => setEditingAdmin({ ...editingAdmin, status: e.target.value as 'active' | 'inactive' })}
            >
              <option value="active">Active (Access Granted)</option>
              <option value="inactive">Inactive (Access Suspended)</option>
            </Select>

            {/* Reset / Change Password Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset / Change Password (Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newPass = generateRandomPassword();
                    setEditPassword(newPass);
                    setEditPasswordError('');
                  }}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>🎲 Generate New</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    if (editPasswordError) setEditPasswordError('');
                  }}
                  placeholder="Leave blank to keep existing password"
                  className="w-full h-10 px-3.5 pr-20 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                  {editPassword && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(editPassword, 'edit_pass')}
                      className="p-1.5 hover:text-slate-800 rounded-md transition-colors"
                      title="Copy Password"
                    >
                      {copiedKey === 'edit_pass' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="p-1.5 hover:text-slate-800 rounded-md transition-colors"
                    title={showEditPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showEditPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {editPasswordError && (
                <p className="text-xs text-rose-600 font-medium">{editPasswordError}</p>
              )}

              <p className="text-[11px] text-slate-500">
                Only enter a value if you wish to overwrite this staff member&apos;s current login credential.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setEditingAdmin(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </SuperAdminLayout>
  );
}

