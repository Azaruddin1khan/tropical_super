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
  const [orders, setOrders] = useState<Order[]>(() => dedupeById(initialOrders));
  const [products, setProducts] = useState<Product[]>(() => dedupeById(initialProducts));
  const [categories, setCategories] = useState<Category[]>(() => dedupeById(initialCategories));
  const categoriesRef = useRef<Category[]>(initialCategories);
  const [drivers, setDrivers] = useState<DeliveryStaff[]>(() => dedupeById(initialDrivers));
  const [customers, setCustomers] = useState<Customer[]>(() => dedupeById(initialCustomers));
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
        const parsed = dedupeById(JSON.parse(savedAdmins)).filter(
          (a: any) => a.id !== 'adm-003' && !String(a.id).startsWith('adm-1794')
        );
        if (parsed.length > 0) setAdmins(parsed);
      }

      const savedRoles = localStorage.getItem('tg_super_roles');
      if (savedRoles) {
        const parsed = dedupeById(JSON.parse(savedRoles)).filter(
          (r: any) => r.id === 'role-front-desk' || r.id === 'role-kitchen-lead'
        );
        if (parsed.length > 0) setRoles(parsed);
      }

      const savedOrders = localStorage.getItem('tg_super_orders');
      if (savedOrders) setOrders(dedupeById(JSON.parse(savedOrders)));

      const savedProducts = localStorage.getItem('tg_super_products');
      if (savedProducts) setProducts(dedupeById(JSON.parse(savedProducts)));

      const savedCategories = localStorage.getItem('tg_super_categories');
      if (savedCategories) {
        const parsed = dedupeById(JSON.parse(savedCategories));
        categoriesRef.current = parsed;
        setCategories(parsed);
      }

      const savedDrivers = localStorage.getItem('tg_super_drivers');
      if (savedDrivers) setDrivers(dedupeById(JSON.parse(savedDrivers)));

      const savedCustomers = localStorage.getItem('tg_super_customers');
      if (savedCustomers) setCustomers(dedupeById(JSON.parse(savedCustomers)));

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
          setAdmins(dedupeById(adminsRes.value.data));
        }
        if (rolesRes.status === 'fulfilled' && rolesRes.value.success && Array.isArray(rolesRes.value.data) && rolesRes.value.data.length > 0) {
          setRoles(dedupeById(rolesRes.value.data));
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success && Array.isArray(ordersRes.value.data) && ordersRes.value.data.length > 0) {
          setOrders(dedupeById(ordersRes.value.data));
        }
        if (productsRes.status === 'fulfilled' && productsRes.value.success && Array.isArray(productsRes.value.data) && productsRes.value.data.length > 0) {
          setProducts(dedupeById(productsRes.value.data));
        }
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success && Array.isArray(categoriesRes.value.data) && categoriesRes.value.data.length > 0) {
          const uniqueCats = dedupeById(categoriesRes.value.data);
          categoriesRef.current = uniqueCats;
          setCategories(uniqueCats);
        }
        if (driversRes.status === 'fulfilled' && driversRes.value.success && Array.isArray(driversRes.value.data) && driversRes.value.data.length > 0) {
          setDrivers(dedupeById(driversRes.value.data));
        }
        if (customersRes.status === 'fulfilled' && customersRes.value.success && Array.isArray(customersRes.value.data) && customersRes.value.data.length > 0) {
          setCustomers(dedupeById(customersRes.value.data));
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value.success && settingsRes.value.data) {
          setSettings(settingsRes.value.data);
        }
      } catch (e) {
        console.warn('Initial backend sync notice:', e);
      }
    };
    syncFromBackend();
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
  const addAdmin = (adminData: Omit<AdminAccount, 'id' | 'createdAt'>) => {
    const newAdmin: AdminAccount = {
      ...adminData,
      id: `adm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAdmins((prev) => [newAdmin, ...prev]);
    SuperAdminApi.createAdmin(newAdmin).catch(() => {});
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

  const editAdmin = (updatedAdmin: AdminAccount) => {
    setAdmins((prev) => prev.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a)));
    SuperAdminApi.updateAdmin(updatedAdmin.id, updatedAdmin).catch(() => {});
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

  const toggleAdminStatus = (adminId: string) => {
    SuperAdminApi.toggleAdminStatus(adminId).catch(() => {});
    setAdmins((prev) =>
      prev.map((a) => {
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
          return { ...a, status: newStatus };
        }
        return a;
      })
    );
  };

  const updateAdminPermissions = (adminId: string, newPermissions: AdminPermissions) => {
    SuperAdminApi.updateAdminPermissions(adminId, newPermissions).catch(() => {});
    setAdmins((prev) =>
      prev.map((a) => {
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
      })
    );
  };

  const deleteAdmin = (adminId: string) => {
    SuperAdminApi.deleteAdmin(adminId).catch(() => {});
    const target = admins.find((a) => a.id === adminId);
    setAdmins((prev) => prev.filter((a) => a.id !== adminId));
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
    setRoles((prev) => [...prev, newRole]);
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
    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
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
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
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
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    SuperAdminApi.updateProduct(product.id, product).catch(() => {});
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

  const toggleCategoryActive = (categoryId: string) => {
    categoriesRef.current = categoriesRef.current.map((c) =>
      c.id === categoryId ? { ...c, isActive: !c.isActive } : c
    );
    setCategories(categoriesRef.current);
    SuperAdminApi.toggleCategoryActive(categoryId).catch(() => {});
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

