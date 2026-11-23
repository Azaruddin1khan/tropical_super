import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AdminPermissions } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency strictly in Bahamian Dollars (BSD)
 * Example: BSD 14.50
 */
export function formatCurrency(amount: number): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BSD',
  })
    .format(safeAmount)
    .replace(/\u00a0/g, ' ');
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Just now';
  if (typeof dateString === 'string' && (dateString.toLowerCase().includes('now') || dateString.toLowerCase().includes('ago'))) {
    return dateString;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return String(dateString);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return String(dateString || 'Just now');
  }
}

export function formatShortDate(dateString?: string | null): string {
  if (!dateString) return 'Just now';
  if (typeof dateString === 'string' && (dateString.toLowerCase().includes('now') || dateString.toLowerCase().includes('ago'))) {
    return dateString;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return String(dateString);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateString || 'Just now');
  }
}

/**
 * Normalizes a category name for case-insensitive duplicate comparison
 * while ignoring leading and trailing whitespace.
 */
export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Checks if a category name already exists in the list (case-insensitive,
 * trimmed), optionally excluding a specific category ID during edits.
 */
export function isDuplicateCategoryName(
  categories: Array<{ id: string; name: string }>,
  candidateName: string,
  excludeCategoryId?: string
): boolean {
  const normalizedCandidate = normalizeCategoryName(candidateName);
  if (!normalizedCandidate) return false;

  return categories.some(
    (category) =>
      category.id !== excludeCategoryId &&
      normalizeCategoryName(category.name) === normalizedCandidate
  );
}

/**
 * Default clean full-access permission template
 */
export const FULL_PERMISSIONS_TEMPLATE: AdminPermissions = {
  orders: {
    viewOrders: true,
    viewOrderDetails: true,
    updateOrderStatus: true,
    assignDeliveryStaff: true,
    cancelOrders: true,
    printInvoice: true,
    exportOrders: true,
  },
  products: {
    viewProducts: true,
    addProducts: true,
    editProducts: true,
    deleteProducts: true,
    updateStockAvailability: true,
  },
  categories: {
    viewCategories: true,
    addCategories: true,
    editCategories: true,
    deleteCategories: true,
  },
  payments: {
    viewPayments: true,
    viewTransactions: true,
    markCashReceived: true,
  },
  deliveryStaff: {
    viewStaff: true,
    addStaff: true,
    editStaff: true,
    manageAssignments: true,
  },
  customers: {
    viewCustomers: true,
    viewCustomerDetails: true,
    manageCustomerAccounts: true,
  },
};

/**
 * Preset permission templates for quick setup
 */
export const PRESET_TEMPLATES: Record<string, { label: string; permissions: AdminPermissions }> = {
  front_desk: {
    label: 'Front Counter Clerk Preset',
    permissions: {
      orders: {
        viewOrders: true,
        viewOrderDetails: true,
        updateOrderStatus: false,
        assignDeliveryStaff: false,
        cancelOrders: false,
        printInvoice: true,
        exportOrders: false,
      },
      products: {
        viewProducts: true,
        addProducts: false,
        editProducts: false,
        deleteProducts: false,
        updateStockAvailability: true,
      },
      categories: {
        viewCategories: true,
        addCategories: false,
        editCategories: false,
        deleteCategories: false,
      },
      payments: {
        viewPayments: false,
        viewTransactions: false,
        markCashReceived: true,
      },
      deliveryStaff: {
        viewStaff: true,
        addStaff: false,
        editStaff: false,
        manageAssignments: false,
      },
      customers: {
        viewCustomers: true,
        viewCustomerDetails: true,
        manageCustomerAccounts: false,
      },
    },
  },
  kitchen_lead: {
    label: 'Kitchen & Dispatch Lead Preset',
    permissions: {
      orders: {
        viewOrders: true,
        viewOrderDetails: true,
        updateOrderStatus: true,
        assignDeliveryStaff: false,
        cancelOrders: false,
        printInvoice: true,
        exportOrders: false,
      },
      products: {
        viewProducts: true,
        addProducts: false,
        editProducts: false,
        deleteProducts: false,
        updateStockAvailability: true,
      },
      categories: {
        viewCategories: true,
        addCategories: false,
        editCategories: false,
        deleteCategories: false,
      },
      payments: {
        viewPayments: false,
        viewTransactions: false,
        markCashReceived: false,
      },
      deliveryStaff: {
        viewStaff: true,
        addStaff: false,
        editStaff: false,
        manageAssignments: true,
      },
      customers: {
        viewCustomers: true,
        viewCustomerDetails: false,
        manageCustomerAccounts: false,
      },
    },
  },
  operations_manager: {
    label: 'Operations Manager Preset',
    permissions: {
      orders: {
        viewOrders: true,
        viewOrderDetails: true,
        updateOrderStatus: true,
        assignDeliveryStaff: true,
        cancelOrders: true,
        printInvoice: true,
        exportOrders: true,
      },
      products: {
        viewProducts: true,
        addProducts: true,
        editProducts: true,
        deleteProducts: false,
        updateStockAvailability: true,
      },
      categories: {
        viewCategories: true,
        addCategories: true,
        editCategories: true,
        deleteCategories: false,
      },
      payments: {
        viewPayments: true,
        viewTransactions: true,
        markCashReceived: true,
      },
      deliveryStaff: {
        viewStaff: true,
        addStaff: true,
        editStaff: true,
        manageAssignments: true,
      },
      customers: {
        viewCustomers: true,
        viewCustomerDetails: true,
        manageCustomerAccounts: true,
      },
    },
  },
};

