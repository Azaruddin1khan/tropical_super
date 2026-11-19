/**
 * Tropical Gyros Super Admin Backend API Client
 * Connects Super Admin frontend directly to the centralized backend API server
 * with fallback to local state for zero downtime.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5001`
    : 'http://localhost:5001');

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn(`Backend API notice [${endpoint}]:`, err?.message || err);
    return { success: false, error: err?.message || 'Network request failed' };
  }
}

export const SuperAdminApi = {
  // 1. Dashboard
  getDashboard: () => apiRequest<any>('/api/superadmin/dashboard'),

  // 2. Admins
  getAdmins: () => apiRequest<any[]>('/api/superadmin/admins'),
  createAdmin: (admin: any) => apiRequest<any>('/api/superadmin/admins', { method: 'POST', body: JSON.stringify(admin) }),
  updateAdmin: (id: string, updates: any) => apiRequest<any>(`/api/superadmin/admins/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  toggleAdminStatus: (id: string) => apiRequest<any>(`/api/superadmin/admins/${id}/status`, { method: 'PATCH' }),
  updateAdminPermissions: (id: string, permissions: any) => apiRequest<any>(`/api/superadmin/admins/${id}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissions }) }),
  deleteAdmin: (id: string) => apiRequest<any>(`/api/superadmin/admins/${id}`, { method: 'DELETE' }),

  // 3. Custom Roles
  getRoles: () => apiRequest<any[]>('/api/superadmin/roles'),
  createRole: (role: any) => apiRequest<any>('/api/superadmin/roles', { method: 'POST', body: JSON.stringify(role) }),
  updateRole: (id: string, updates: any) => apiRequest<any>(`/api/superadmin/roles/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteRole: (id: string) => apiRequest<any>(`/api/superadmin/roles/${id}`, { method: 'DELETE' }),

  // 4. Orders
  getOrders: (params?: { status?: string; search?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any[]>(`/api/superadmin/orders${query ? `?${query}` : ''}`);
  },
  getOrder: (id: string) => apiRequest<any>(`/api/superadmin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => apiRequest<any>(`/api/superadmin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignDriver: (id: string, driverId: string, driverName: string) => apiRequest<any>(`/api/superadmin/orders/${id}/assign-driver`, { method: 'PATCH', body: JSON.stringify({ driverId, driverName }) }),
  markCodPaid: (id: string) => apiRequest<any>(`/api/superadmin/orders/${id}/mark-cod-paid`, { method: 'PATCH' }),
  cancelOrder: (id: string, reason?: string) => apiRequest<any>(`/api/superadmin/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // 5. Categories
  getCategories: () => apiRequest<any[]>('/api/superadmin/categories'),
  createCategory: (cat: any) => apiRequest<any>('/api/superadmin/categories', { method: 'POST', body: JSON.stringify(cat) }),
  updateCategory: (id: string, updates: any) => apiRequest<any>(`/api/superadmin/categories/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  toggleCategoryActive: (id: string) => apiRequest<any>(`/api/superadmin/categories/${id}/toggle-active`, { method: 'PATCH' }),
  deleteCategory: (id: string) => apiRequest<any>(`/api/superadmin/categories/${id}`, { method: 'DELETE' }),

  // 6. Products
  getProducts: (params?: { categoryId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any[]>(`/api/superadmin/products${query ? `?${query}` : ''}`);
  },
  createProduct: (prod: any) => apiRequest<any>('/api/superadmin/products', { method: 'POST', body: JSON.stringify(prod) }),
  updateProduct: (id: string, updates: any) => apiRequest<any>(`/api/superadmin/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  toggleProductAvailability: (id: string) => apiRequest<any>(`/api/superadmin/products/${id}/toggle-availability`, { method: 'PATCH' }),
  deleteProduct: (id: string) => apiRequest<any>(`/api/superadmin/products/${id}`, { method: 'DELETE' }),

  // 7. Delivery Staff & Fleet Radar
  getDrivers: () => apiRequest<any[]>('/api/superadmin/delivery-staff'),
  createDriver: (drv: any) => apiRequest<any>('/api/superadmin/delivery-staff', { method: 'POST', body: JSON.stringify(drv) }),
  updateDriverStatus: (id: string, status: string) => apiRequest<any>(`/api/superadmin/delivery-staff/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getFleetRadar: () => apiRequest<any[]>('/api/superadmin/delivery-staff/fleet-radar'),

  // 8. Customers
  getCustomers: () => apiRequest<any[]>('/api/superadmin/customers'),
  toggleCustomerStatus: (id: string) => apiRequest<any>(`/api/superadmin/customers/${id}/status`, { method: 'PATCH' }),

  // 9. Payments
  getPayments: () => apiRequest<any[]>('/api/superadmin/payments'),
  getPaymentSummary: () => apiRequest<any>('/api/superadmin/payments/summary'),

  // 10. Audit Logs
  getActivityLogs: () => apiRequest<any[]>('/api/superadmin/activity-logs'),
  createActivityLog: (log: any) => apiRequest<any>('/api/superadmin/activity-logs', { method: 'POST', body: JSON.stringify(log) }),

  // 11. Settings
  getSettings: () => apiRequest<any>('/api/superadmin/settings'),
  updateSettings: (settings: any) => apiRequest<any>('/api/superadmin/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};
