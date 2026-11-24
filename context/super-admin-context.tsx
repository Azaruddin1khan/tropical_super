'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  AdminAccount,
  AdminPermissions,
  CustomRole,
  Order,
  OrderStatus,
  Product,
  Category,
  DeliveryStaff,
  Customer,
  ActivityLog,
  RestaurantSettings,
  DriverStatus,
} from '@/types';
import {
  initialAdminAccounts,
  initialCustomRoles,
  initialOrders,
  initialProducts,
  initialCategories,
  initialDrivers,
  initialCustomers,
  initialActivityLogs,
  initialSettings,
} from '@/data/mock-data';
import { isDuplicateCategoryName } from '@/lib/utils';
import { SuperAdminApi } from '@/lib/api';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

export interface CategoryActionResult {
  success: boolean;
  error?: string;
}

interface SuperAdminContextType {
  // Admin Account & Permission Governance (Modules 08 & 09)
  admins: AdminAccount[];
  addAdmin: (admin: Omit<AdminAccount, 'id' | 'createdAt'>) => void;
  editAdmin: (admin: AdminAccount) => void;
  toggleAdminStatus: (adminId: string) => void;
  updateAdminPermissions: (adminId: string, permissions: AdminPermissions) => void;
  deleteAdmin: (adminId: string) => void;

  // Custom Roles & Presets
  roles: CustomRole[];
  addRole: (role: Omit<CustomRole, 'id' | 'createdAt'>) => CustomRole;
  editRole: (role: CustomRole) => void;
  deleteRole: (roleId: string) => void;

  // Orders Management (Module 02)
  orders: Order[];
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  assignDriver: (orderId: string, driverId: string, driverName: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  markCodAsPaid: (orderId: string) => void;

  // Products Management (Module 03)
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => void;
  editProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  toggleProductAvailability: (productId: string) => void;
  toggleProductFeatured: (productId: string) => void;

  // Categories Management (Module 04)
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'productCount'>) => CategoryActionResult;
  editCategory: (category: Category) => CategoryActionResult;
  deleteCategory: (categoryId: string) => void;
  toggleCategoryActive: (categoryId: string) => void;

  // Delivery Staff (Module 06)
  drivers: DeliveryStaff[];
  addDriver: (driver: Omit<DeliveryStaff, 'id' | 'activeOrdersCount' | 'completedDeliveries' | 'unremittedCashBsd'>) => void;
  editDriver: (driver: DeliveryStaff) => void;
  toggleDriverStatus: (driverId: string, status: DriverStatus) => void;
  toggleDriverActive: (driverId: string) => void;

  // Customers (Module 07)
  customers: Customer[];
  toggleCustomerStatus: (customerId: string) => void;

  // Activity Logs & Audit Trails (Module 10)
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  // Settings (Module 11)
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;

  // Notifications
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

function dedupeById<T extends { id?: string; _id?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item?.id || item?._id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const [admins, setAdmins] = useState<AdminAccount[]>(() => dedupeById(initialAdminAccounts));
  const [roles, setRoles] = useState<CustomRole[]>(() => dedupeById(initialCustomRoles));
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const categoriesRef = useRef<Category[]>(initialCategories);
  const [drivers, setDrivers] = useState<DeliveryStaff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [settings, setSettings] = useState<RestaurantSettings>(initialSettings);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast System
  const showToast = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Activity Log Creator
  const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.1 (Super Admin Master)',
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    SuperAdminApi.createActivityLog(newLog).catch(() => {});
  };

  // LocalStorage Hydration
  useEffect(() => {
    try {
      const savedAdmins = localStorage.getItem('tg_super_admins');
      if (savedAdmins) {
        const parsed = dedupeById<AdminAccount>(JSON.parse(savedAdmins)).filter(
          (a: any) =>
            a &&
            a.id !== 'adm-003' &&
            a.roleTitle !== 'Store Supervisor' &&
            !String(a.name || '').toLowerCase().includes('michael strachan')
        );
        if (parsed.length > 0) {
          setAdmins(parsed);
          localStorage.setItem('tg_super_admins', JSON.stringify(parsed));
        }
      }

      const savedRoles = localStorage.getItem('tg_super_roles');
      if (savedRoles) {
        const parsed = dedupeById<CustomRole>(JSON.parse(savedRoles));
        if (parsed.length > 0) setRoles(parsed);
      }

      const savedOrders = localStorage.getItem('tg_super_orders');
      if (savedOrders) {
        const parsed = dedupeById<Order>(JSON.parse(savedOrders));
        if (parsed.some((o: any) => o.id === 'ORD-884920' || o.id === 'TRP-502602')) {
          localStorage.removeItem('tg_super_orders');
        } else {
          setOrders(parsed);
        }
      }

      const savedProducts = localStorage.getItem('tg_super_products');
      if (savedProducts) {
        const parsed = dedupeById<Product>(JSON.parse(savedProducts));
        // Clear stale dummy mock data (e.g. prod-1, cat-1, or obsolete 6-item catalog)
        if (parsed.some((p: any) => p.id === 'prod-1' || p.categoryId === 'cat-1') || parsed.length < 10) {
          localStorage.removeItem('tg_super_products');
        } else {
          setProducts(parsed);
        }
      }

      const savedCategories = localStorage.getItem('tg_super_categories');
      if (savedCategories) {
        const parsed = dedupeById<Category>(JSON.parse(savedCategories));
        // Clear stale dummy categories (e.g. cat-1)
        if (parsed.some((c: any) => c.id === 'cat-1')) {
          localStorage.removeItem('tg_super_categories');
        } else {
          categoriesRef.current = parsed;
          setCategories(parsed);
        }
      }

      const savedDrivers = localStorage.getItem('tg_super_drivers');
      if (savedDrivers) {
        const parsed = dedupeById<DeliveryStaff>(JSON.parse(savedDrivers));
        if (parsed.some((d: any) => d.id === 'drv-01')) {
          localStorage.removeItem('tg_super_drivers');
        } else {
          setDrivers(parsed);
        }
      }

      const savedCustomers = localStorage.getItem('tg_super_customers');
      if (savedCustomers) {
        const parsed = dedupeById<Customer>(JSON.parse(savedCustomers));
        if (parsed.some((c: any) => c.id === 'cust-01')) {
          localStorage.removeItem('tg_super_customers');
        } else {
          setCustomers(parsed);
        }
      }

      const savedLogs = localStorage.getItem('tg_super_logs');
      if (savedLogs) setActivityLogs(JSON.parse(savedLogs));

      const savedSettings = localStorage.getItem('tg_super_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch {
      // LocalStorage access fallback
    }

    // Fetch live data from backend API with fallback
    const syncFromBackend = async () => {
      try {
        const [
          adminsRes,
          rolesRes,
          ordersRes,
          productsRes,
          categoriesRes,
          driversRes,
          customersRes,
          settingsRes,
        ] = await Promise.allSettled([
          SuperAdminApi.getAdmins(),
          SuperAdminApi.getRoles(),
          SuperAdminApi.getOrders(),
          SuperAdminApi.getProducts(),
          SuperAdminApi.getCategories(),
          SuperAdminApi.getDrivers(),
          SuperAdminApi.getCustomers(),
          SuperAdminApi.getSettings(),
        ]);

        if (adminsRes.status === 'fulfilled' && adminsRes.value.success && Array.isArray(adminsRes.value.data) && adminsRes.value.data.length > 0) {
          const sanitizedAdmins = dedupeById<AdminAccount>(adminsRes.value.data).filter(
            (a: any) =>
              a &&
              a.id !== 'adm-003' &&
              a.roleTitle !== 'Store Supervisor' &&
              !String(a.name || '').toLowerCase().includes('michael strachan')
          );
          if (sanitizedAdmins.length > 0) {
            setAdmins(sanitizedAdmins);
            try {
              localStorage.setItem('tg_super_admins', JSON.stringify(sanitizedAdmins));
            } catch {}
          }
        }
        if (rolesRes.status === 'fulfilled' && rolesRes.value.success && Array.isArray(rolesRes.value.data) && rolesRes.value.data.length > 0) {
          const sanitizedRoles = dedupeById<CustomRole>(rolesRes.value.data);
          setRoles(sanitizedRoles);
          try {
            localStorage.setItem('tg_super_roles', JSON.stringify(sanitizedRoles));
          } catch {}
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success && Array.isArray(ordersRes.value.data)) {
          const ords = dedupeById<Order>(ordersRes.value.data);
          setOrders(ords);
          try {
            localStorage.setItem('tg_super_orders', JSON.stringify(ords));
          } catch {}
        }
        if (productsRes.status === 'fulfilled' && productsRes.value.success && Array.isArray(productsRes.value.data) && productsRes.value.data.length > 0) {
          const prods = dedupeById<Product>(productsRes.value.data);
          setProducts(prods);
          try {
            localStorage.setItem('tg_super_products', JSON.stringify(prods));
          } catch {}
        }
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success && Array.isArray(categoriesRes.value.data) && categoriesRes.value.data.length > 0) {
          const uniqueCats = dedupeById<Category>(categoriesRes.value.data);
          categoriesRef.current = uniqueCats;
          setCategories(uniqueCats);
          try {
            localStorage.setItem('tg_super_categories', JSON.stringify(uniqueCats));
          } catch {}
        }
        if (driversRes.status === 'fulfilled' && driversRes.value.success && Array.isArray(driversRes.value.data)) {
          const normalized = (driversRes.value.data as any[]).map((d) => ({
            ...d,
            rating: typeof d.rating === 'number' ? d.rating : 5.0,
            completedDeliveries: typeof d.completedDeliveries === 'number' ? d.completedDeliveries : 0,
            vehicleType: d.vehicleType || 'Motorcycle',
            vehicleNumber: d.vehicleNumber || 'BS-N/A',
            phone: d.phone || 'N/A',
            name: d.name || 'Courier',
            status: d.status || 'available',
          }));
          const drvs = dedupeById<DeliveryStaff>(normalized as DeliveryStaff[]);
          setDrivers(drvs);
        }
        if (customersRes.status === 'fulfilled' && customersRes.value.success && Array.isArray(customersRes.value.data)) {
          const custs = dedupeById<Customer>(customersRes.value.data);
          setCustomers(custs);
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value.success && settingsRes.value.data) {
          setSettings(settingsRes.value.data);
        }
      } catch (e) {
        console.warn('Initial backend sync notice:', e);
      }
    };
    syncFromBackend();

    // Auto-poll orders every 8 seconds for real-time live order reception
    const orderPollInterval = setInterval(async () => {
      try {
        const ordersRes = await SuperAdminApi.getOrders();
        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          const ords = dedupeById<Order>(ordersRes.data);
          setOrders((prev) => {
            if (ords.length !== prev.length || (ords.length > 0 && ords[0]?.id !== prev[0]?.id)) {
              return ords;
            }
            return prev;
          });
        }
      } catch (_) {}
    }, 8000);

    return () => clearInterval(orderPollInterval);
  }, []);

  // Sync to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('tg_super_admins', JSON.stringify(admins));
      localStorage.setItem('tg_super_roles', JSON.stringify(roles));
      localStorage.setItem('tg_super_orders', JSON.stringify(orders));
      localStorage.setItem('tg_super_products', JSON.stringify(products));
      localStorage.setItem('tg_super_categories', JSON.stringify(categories));
      localStorage.setItem('tg_super_drivers', JSON.stringify(drivers));
      localStorage.setItem('tg_super_customers', JSON.stringify(customers));
      localStorage.setItem('tg_super_logs', JSON.stringify(activityLogs));
      localStorage.setItem('tg_super_settings', JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [admins, orders, products, categories, drivers, customers, activityLogs, settings]);

  // ==========================================
  // ADMIN ACCOUNT ACTIONS
  // ==========================================
  const addAdmin = async (adminData: Omit<AdminAccount, 'id' | 'createdAt'>) => {
    const newAdmin: AdminAccount = {
      ...adminData,
      id: `adm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAdmins((prev) => {
      const updated = [newAdmin, ...prev];
      try {
        localStorage.setItem('tg_super_admins', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const res = await SuperAdminApi.createAdmin(newAdmin);
      if (res && res.success && res.data) {
        setAdmins((prev) => {
          const updated = prev.map((a) => (a.id === newAdmin.id ? { ...a, ...res.data } : a));
          try {
            localStorage.setItem('tg_super_admins', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (e) {
      console.warn('createAdmin API error:', e);
    }

    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'admin_created',
      description: `Created new Admin account for ${newAdmin.name} (${newAdmin.roleTitle}).`,
      targetEntity: `Admin: ${newAdmin.name}`,
    });
    showToast('Admin Account Created', `${newAdmin.name} added successfully.`, 'success');
  };

  const editAdmin = async (updatedAdmin: AdminAccount) => {
    setAdmins((prev) => {
      const updated = prev.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a));
      try {
        localStorage.setItem('tg_super_admins', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await SuperAdminApi.updateAdmin(updatedAdmin.id, updatedAdmin);
    } catch (e) {
      console.warn('updateAdmin API error:', e);
    }

    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'admin_status_changed',
      description: `Updated profile details for Admin ${updatedAdmin.name}.`,
      targetEntity: `Admin: ${updatedAdmin.name}`,
    });
    showToast('Admin Profile Updated', `${updatedAdmin.name} profile saved.`, 'success');
  };

  const toggleAdminStatus = async (adminId: string) => {
    setAdmins((prev) => {
      const updated = prev.map((a) => {
        if (a.id === adminId) {
          const newStatus = a.status === 'active' ? 'inactive' : 'active';
          addActivityLog({
            adminId: 'super-admin-01',
            adminName: 'Super Administrator',
            adminRole: 'Master Authority',
            actionType: 'admin_status_changed',
            description: `Toggled Admin ${a.name} status to ${newStatus}.`,
            targetEntity: `Admin: ${a.name}`,
          });
          showToast('Status Updated', `${a.name} is now ${newStatus}.`, 'info');
          return { ...a, status: newStatus as 'active' | 'inactive' };
        }
        return a;
      });
      try {
        localStorage.setItem('tg_super_admins', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await SuperAdminApi.toggleAdminStatus(adminId);
    } catch (e) {
      console.warn('toggleAdminStatus API error:', e);
    }
  };

  const updateAdminPermissions = async (adminId: string, newPermissions: AdminPermissions) => {
    setAdmins((prev) => {
      const updated = prev.map((a) => {
        if (a.id === adminId) {
          addActivityLog({
            adminId: 'super-admin-01',
            adminName: 'Super Administrator',
            adminRole: 'Master Authority',
            actionType: 'permissions_updated',
            description: `Updated custom granular permissions for ${a.name} (${a.roleTitle}).`,
            targetEntity: `Admin: ${a.name}`,
          });
          showToast('Permissions Saved', `Updated permissions for ${a.name}.`, 'success');
          return { ...a, permissions: newPermissions };
        }
        return a;
      });
      try {
        localStorage.setItem('tg_super_admins', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await SuperAdminApi.updateAdminPermissions(adminId, newPermissions);
    } catch (e) {
      console.warn('updateAdminPermissions API error:', e);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    const target = admins.find((a) => a.id === adminId);
    setAdmins((prev) => {
      const updated = prev.filter((a) => a.id !== adminId);
      try {
        localStorage.setItem('tg_super_admins', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await SuperAdminApi.deleteAdmin(adminId);
    } catch (e) {
      console.warn('deleteAdmin API error:', e);
    }

    if (target) {
      addActivityLog({
        adminId: 'super-admin-01',
        adminName: 'Super Administrator',
        adminRole: 'Master Authority',
        actionType: 'admin_status_changed',
        description: `Deleted Admin account ${target.name}.`,
        targetEntity: `Admin: ${target.name}`,
      });
      showToast('Admin Deleted', `${target.name} account was removed.`, 'info');
    }
  };

  // ==========================================
  // OPERATIONAL ROLES MANAGEMENT
  // ==========================================
  const addRole = (roleData: Omit<CustomRole, 'id' | 'createdAt'>): CustomRole => {
    const newRole: CustomRole = {
      ...roleData,
      id: `role-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRoles((prev) => {
      const updated = [...prev, newRole];
      try {
        localStorage.setItem('tg_super_roles', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    SuperAdminApi.createRole(newRole).catch(() => {});
    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'role_created',
      description: `Created new Operational Role "${newRole.name}".`,
      targetEntity: `Role: ${newRole.name}`,
    });
    showToast('Role Created', `Operational Role "${newRole.name}" created successfully.`, 'success');
    return newRole;
  };

  const editRole = (updatedRole: CustomRole) => {
    setRoles((prev) => {
      const updated = prev.map((r) => (r.id === updatedRole.id ? updatedRole : r));
      try {
        localStorage.setItem('tg_super_roles', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    SuperAdminApi.updateRole(updatedRole.id, updatedRole).catch(() => {});
    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'role_updated',
      description: `Updated permissions for Role "${updatedRole.name}".`,
      targetEntity: `Role: ${updatedRole.name}`,
    });
    showToast('Role Updated', `Role "${updatedRole.name}" saved.`, 'info');
  };

  const deleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setRoles((prev) => {
      const updated = prev.filter((r) => r.id !== roleId);
      try {
        localStorage.setItem('tg_super_roles', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    SuperAdminApi.deleteRole(roleId).catch(() => {});
    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'role_deleted',
      description: `Deleted Operational Role "${role.name}".`,
      targetEntity: `Role: ${role.name}`,
    });
    showToast('Role Deleted', `Role "${role.name}" removed.`, 'error');
  };

  // ==========================================
  // ORDERS ACTIONS
  // ==========================================
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    SuperAdminApi.updateOrderStatus(orderId, newStatus).catch(() => {});
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          addActivityLog({
            adminId: 'super-admin-01',
            adminName: 'Super Administrator',
            adminRole: 'Master Authority',
            actionType: 'order_status_update',
            description: `Changed Order #${orderId} status from "${ord.orderStatus}" to "${newStatus}".`,
            targetEntity: `Order: #${orderId}`,
          });
          showToast('Order Status Updated', `Order #${orderId} marked as ${newStatus.replace('_', ' ')}.`, 'success');
          return { ...ord, orderStatus: newStatus, updatedAt: new Date().toISOString() };
        }
        return ord;
      })
    );
  };

  const assignDriver = (orderId: string, driverId: string, driverName: string) => {
    SuperAdminApi.assignDriver(orderId, driverId, driverName).catch(() => {});
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          addActivityLog({
            adminId: 'super-admin-01',
            adminName: 'Super Administrator',
            adminRole: 'Master Authority',
            actionType: 'driver_assigned',
            description: `Assigned driver ${driverName} to Order #${orderId}.`,
            targetEntity: `Order: #${orderId}`,
          });
          showToast('Driver Assigned', `${driverName} assigned to #${orderId}.`, 'success');
          return {
            ...ord,
            assignedDriverId: driverId,
            assignedDriverName: driverName,
            orderStatus: ord.orderStatus === 'pending' ? 'preparing' : ord.orderStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );
  };

  const cancelOrder = (orderId: string, reason: string = 'Administrative cancellation') => {
    SuperAdminApi.cancelOrder(orderId, reason).catch(() => {});
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          addActivityLog({
            adminId: 'super-admin-01',
            adminName: 'Super Administrator',
            adminRole: 'Master Authority',
            actionType: 'order_status_update',
            description: `Cancelled Order #${orderId}. Reason: ${reason}`,
            targetEntity: `Order: #${orderId}`,
          });
          showToast('Order Cancelled', `Order #${orderId} cancelled.`, 'error');
          return { ...ord, orderStatus: 'cancelled', updatedAt: new Date().toISOString() };
        }
        return ord;
      })
    );
  };

  const markCodAsPaid = (orderId: string) => {
    SuperAdminApi.markCodPaid(orderId).catch(() => {});
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          addActivityLog({
            adminId: 'super-admin-01',
            adminName: 'Super Administrator',
            adminRole: 'Master Authority',
            actionType: 'cod_marked_paid',
            description: `Reconciled Cash on Delivery (COD) of BSD ${ord.total.toFixed(2)} for Order #${orderId}.`,
            targetEntity: `Order: #${orderId}`,
          });
          showToast('COD Reconciled', `Marked Order #${orderId} cash collected.`, 'success');
          return { ...ord, paymentStatus: 'paid', updatedAt: new Date().toISOString() };
        }
        return ord;
      })
    );
  };

  // ==========================================
  // PRODUCTS ACTIONS
  // ==========================================
  const addProduct = (productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
    };
    setProducts((prev) => [newProduct, ...prev]);
    SuperAdminApi.createProduct(newProduct).catch(() => {});
    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'product_added',
      description: `Added new dish "${newProduct.name}" in category "${newProduct.categoryName}" at BSD ${newProduct.price.toFixed(2)}.`,
      targetEntity: `Product: ${newProduct.name}`,
    });
    showToast('Product Added', `${newProduct.name} added to menu.`, 'success');
  };

  const editProduct = (product: Product) => {
    const { _id, ...cleanProduct } = product as any;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? cleanProduct : p)));
    SuperAdminApi.updateProduct(product.id, cleanProduct).catch(() => {});
    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'price_updated',
      description: `Updated dish "${product.name}" pricing to BSD ${product.price.toFixed(2)}.`,
      targetEntity: `Product: ${product.name}`,
    });
    showToast('Product Updated', `${product.name} saved.`, 'success');
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    SuperAdminApi.deleteProduct(productId).catch(() => {});
    if (target) {
      addActivityLog({
        adminId: 'super-admin-01',
        adminName: 'Super Administrator',
        adminRole: 'Master Authority',
        actionType: 'product_deleted',
        description: `Removed dish "${target.name}" from catalog.`,
        targetEntity: `Product: ${target.name}`,
      });
      showToast('Product Removed', `${target.name} deleted.`, 'info');
    }
  };

  const toggleProductAvailability = (productId: string) => {
    SuperAdminApi.toggleProductAvailability(productId).catch(() => {});
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newAvail = !p.isAvailable;
          showToast('Stock Updated', `${p.name} is now ${newAvail ? 'In Stock' : 'Sold Out'}.`, 'info');
          return { ...p, isAvailable: newAvail };
        }
        return p;
      })
    );
  };

  const toggleProductFeatured = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newFeatured = !p.isFeatured;
          showToast('Featured Status', `${p.name} featured status updated.`, 'info');
          return { ...p, isFeatured: newFeatured };
        }
        return p;
      })
    );
  };

  // ==========================================
  // CATEGORIES ACTIONS (WITH DUPLICATE CHECK)
  // ==========================================
  const addCategory = (categoryData: Omit<Category, 'id' | 'productCount'>): CategoryActionResult => {
    if (isDuplicateCategoryName(categoriesRef.current, categoryData.name)) {
      return { success: false, error: 'This category already exists.' };
    }

    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      productCount: 0,
    };

    categoriesRef.current = [...categoriesRef.current, newCategory];
    setCategories(categoriesRef.current);
    SuperAdminApi.createCategory(newCategory).catch(() => {});

    addActivityLog({
      adminId: 'super-admin-01',
      adminName: 'Super Administrator',
      adminRole: 'Master Authority',
      actionType: 'category_created',
      description: `Created new category "${newCategory.name}".`,
      targetEntity: `Category: ${newCategory.name}`,
    });
    showToast('Category Created', `${newCategory.name} category created.`, 'success');
    return { success: true };
  };

  const editCategory = (category: Category): CategoryActionResult => {
    if (isDuplicateCategoryName(categoriesRef.current, category.name, category.id)) {
      return { success: false, error: 'This category already exists.' };
    }

    categoriesRef.current = categoriesRef.current.map((c) => (c.id === category.id ? category : c));
    setCategories(categoriesRef.current);
    SuperAdminApi.updateCategory(category.id, category).catch(() => {});
    showToast('Category Updated', `${category.name} category saved.`, 'success');
    return { success: true };
  };

  const deleteCategory = (categoryId: string) => {
    const target = categories.find((c) => c.id === categoryId);
    categoriesRef.current = categoriesRef.current.filter((c) => c.id !== categoryId);
    setCategories(categoriesRef.current);
    SuperAdminApi.deleteCategory(categoryId).catch(() => {});
    if (target) {
      showToast('Category Removed', `${target.name} deleted.`, 'info');
    }
  };

  const toggleCategoryActive = async (categoryId: string) => {
    const target = categoriesRef.current.find((c) => c.id === categoryId);
    if (!target) return;
    const nextState = !target.isActive;

    categoriesRef.current = categoriesRef.current.map((c) =>
      c.id === categoryId ? { ...c, isActive: nextState } : c
    );
    setCategories([...categoriesRef.current]);

    try {
      const res = await SuperAdminApi.toggleCategoryActive(categoryId);
      if (res && res.success) {
        showToast(
          nextState ? 'Category Published' : 'Category Hidden',
          `"${target.name}" is now ${nextState ? 'published' : 'hidden'} across web & mobile apps.`,
          'success'
        );
      } else {
        categoriesRef.current = categoriesRef.current.map((c) =>
          c.id === categoryId ? { ...c, isActive: !nextState } : c
        );
        setCategories([...categoriesRef.current]);
        showToast('Sync Notice', res?.error || 'Failed to update category state in live database', 'error');
      }
    } catch (e: any) {
      categoriesRef.current = categoriesRef.current.map((c) =>
        c.id === categoryId ? { ...c, isActive: !nextState } : c
      );
      setCategories([...categoriesRef.current]);
      showToast('Network Error', e?.message || 'Could not connect to database', 'error');
    }
  };

  // ==========================================
  // DELIVERY STAFF ACTIONS
  // ==========================================
  const addDriver = (driverData: Omit<DeliveryStaff, 'id' | 'activeOrdersCount' | 'completedDeliveries' | 'unremittedCashBsd'>) => {
    const newDriver: DeliveryStaff = {
      ...driverData,
      id: `drv-${Date.now()}`,
      activeOrdersCount: 0,
      completedDeliveries: 0,
      unremittedCashBsd: 0.00,
    };
    setDrivers((prev) => [newDriver, ...prev]);
    SuperAdminApi.createDriver(newDriver).catch(() => {});
    showToast('Driver Onboarded', `${newDriver.name} added to fleet.`, 'success');
  };

  const editDriver = (driver: DeliveryStaff) => {
    setDrivers((prev) => prev.map((d) => (d.id === driver.id ? driver : d)));
    SuperAdminApi.createDriver(driver).catch(() => {});
    showToast('Driver Updated', `${driver.name} details saved.`, 'success');
  };

  const toggleDriverStatus = (driverId: string, status: DriverStatus) => {
    setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, status } : d)));
    SuperAdminApi.updateDriverStatus(driverId, status).catch(() => {});
  };

  const toggleDriverActive = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const newActive = !d.isActive;
          showToast('Driver Status', `${d.name} ${newActive ? 'activated' : 'deactivated'}.`, 'info');
          return { ...d, isActive: newActive };
        }
        return d;
      })
    );
  };

  // ==========================================
  // CUSTOMERS ACTIONS
  // ==========================================
  const toggleCustomerStatus = (customerId: string) => {
    SuperAdminApi.toggleCustomerStatus(customerId).catch(() => {});
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newStatus = c.status === 'active' ? 'banned' : 'active';
          showToast('Customer Status', `${c.name} account is now ${newStatus}.`, 'info');
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  // ==========================================
  // SETTINGS ACTIONS
  // ==========================================
  const updateSettings = (newSettings: Partial<RestaurantSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      SuperAdminApi.updateSettings(updated).catch(() => {});
      addActivityLog({
        adminId: 'super-admin-01',
        adminName: 'Super Administrator',
        adminRole: 'Master Authority',
        actionType: 'settings_updated',
        description: 'Updated restaurant profile and 3-mile delivery radius parameters.',
        targetEntity: 'Restaurant Settings',
      });
      showToast('Settings Saved', 'Restaurant parameters updated successfully.', 'success');
      return updated;
    });
  };

  return (
    <SuperAdminContext.Provider
      value={{
        admins,
        addAdmin,
        editAdmin,
        toggleAdminStatus,
        updateAdminPermissions,
        deleteAdmin,

        roles,
        addRole,
        editRole,
        deleteRole,

        orders,
        updateOrderStatus,
        assignDriver,
        cancelOrder,
        markCodAsPaid,

        products,
        addProduct,
        editProduct,
        deleteProduct,
        toggleProductAvailability,
        toggleProductFeatured,

        categories,
        addCategory,
        editCategory,
        deleteCategory,
        toggleCategoryActive,

        drivers,
        addDriver,
        editDriver,
        toggleDriverStatus,
        toggleDriverActive,

        customers,
        toggleCustomerStatus,

        activityLogs,
        addActivityLog,

        settings,
        updateSettings,

        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}

