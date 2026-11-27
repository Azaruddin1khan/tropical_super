import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mailer';
import {
  initialCategories,
  initialProducts,
  initialOrders,
  initialDrivers,
  initialCustomers,
  initialAdminAccounts,
  initialCustomRoles,
  initialSettings,
} from '@/data/mock-data';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function dedupeById(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item?.id || (item?._id ? String(item._id) : undefined);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeForDeliveryBoy(o: any) {
  let addressStr = '';
  if (typeof o.deliveryAddress === 'string') {
    addressStr = o.deliveryAddress;
  } else if (o.deliveryAddress && typeof o.deliveryAddress === 'object') {
    const { street = '', apartment = '', city = '', postalCode = '' } = o.deliveryAddress;
    addressStr = [street, apartment, city, postalCode].filter(Boolean).join(', ');
  }
  if (!addressStr) addressStr = '14 Rosetta Street, Palmdale, Nassau';

  let status = 'assigned';
  const rawStatus = (o.orderStatus || o.status || '').toLowerCase();
  if (rawStatus === 'out_for_delivery') {
    status = 'out_for_delivery';
  } else if (rawStatus === 'delivered' || rawStatus === 'completed') {
    status = 'delivered';
  } else if (rawStatus === 'picked_up' || rawStatus === 'pickedup') {
    status = 'picked_up';
  }

  const items = Array.isArray(o.items)
    ? o.items.map((it: any) => ({
        name: it.productName || it.name || it.food?.name || 'Item',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.price || it.unitPrice || it.food?.price) || 0,
        options: it.specialInstructions || it.options || '',
      }))
    : [];

  return {
    id: o.id || o.orderId || '',
    customerName: o.customerName || o.deliveryAddress?.recipientName || 'Customer',
    customerPhone: o.customerPhone || o.deliveryAddress?.phone || '+1 (242) 555-0100',
    deliveryAddress: addressStr,
    items,
    orderTime: o.createdAt || o.orderTime || new Date().toISOString(),
    subtotal: Number(o.subtotal) || 0,
    deliveryFee: Number(o.deliveryFee) || 0,
    tax: Number(o.tax) || 0,
    totalAmount: Number(o.total || o.totalAmount) || 0,
    paymentMethod: o.paymentMethod || 'Cash on Delivery (COD)',
    isPaid: Boolean(o.isPaid || o.paymentStatus === 'paid'),
    status,
    barcodeCode: o.barcodeValue || o.barcodeCode || `${o.id || o.orderId}-BC`,
    qrCode: o.qrCodeValue || o.qrCode || `https://tropicalgyros.demo/order/${o.id || o.orderId}`,
    deliveryNotes: o.deliveryInstructions || o.deliveryNotes || '',
    orderType: o.fulfillmentType || o.orderType || 'delivery',
    deliveredAt: o.deliveredAt || null,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = (await context.params) || {};
  const path = slug.join('/');
  const searchParams = request.nextUrl.searchParams;

  try {
    // 1. Health check (Instant response - zero database latency)
    if (path === 'health') {
      return NextResponse.json(
        { success: true, status: 'online', database: 'connected', timestamp: new Date().toISOString() },
        { headers: corsHeaders() }
      );
    }

    const db = await getDb();

    // 2. Categories
    if (path === 'superadmin/categories' || path === 'admin/categories') {
      const col = db.collection('categories');
      let items = await col.find({}).sort({ displayOrder: 1 }).toArray();
      if (!items || items.length === 0) {
        items = initialCategories as any;
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
    }

    // 3. Products
    if (path === 'superadmin/products' || path === 'admin/products') {
      const col = db.collection('products');
      const categoryId = searchParams.get('categoryId');
      const search = searchParams.get('search');
      const query: any = {};
      if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
      if (search) query.name = { $regex: search, $options: 'i' };

      let items = await col.find(query).toArray();
      if (!items || items.length === 0) {
        try {
          const totalInDb = await col.countDocuments();
          if (totalInDb === 0) {
            await col.insertMany(initialProducts.map((p) => ({ ...p })));
            items = await col.find(query).toArray();
          }
        } catch (_) {}

        if (!items || items.length === 0) {
          items = initialProducts as any;
          if (categoryId && categoryId !== 'all') {
            items = items.filter((p: any) => p.categoryId === categoryId);
          }
        }
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
    }

    // 4. Orders
    if (
      path === 'customer/orders' ||
      path === 'superadmin/orders' ||
      path === 'admin/orders' ||
      path === 'orders'
    ) {
      const col = db.collection('orders');
      const email = searchParams.get('email');
      const phone = searchParams.get('phone');
      const isCustomerEndpoint = path === 'customer/orders';
      const query: any = {};

      if (email && email.trim()) {
        const cleanEmail = email.trim();
        const emailRegex = { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        query.$or = [
          { customerEmail: emailRegex },
          { email: emailRegex },
          { userEmail: emailRegex },
        ];
      } else if (isCustomerEndpoint && !phone) {
        // Customer requested orders without email or phone: return empty list to protect customer data privacy
        return NextResponse.json(
          { success: true, data: [] },
          { headers: corsHeaders() }
        );
      }

      if (phone && phone.trim()) {
        const cleanPhone = phone.trim();
        const phoneClauses = [
          { customerPhone: cleanPhone },
          { phone: cleanPhone },
          { 'deliveryAddress.phone': cleanPhone },
        ];
        if (query.$or) {
          query.$or.push(...phoneClauses);
        } else {
          query.$or = phoneClauses;
        }
      }

      const rawOrders = await col.find(query).sort({ createdAt: -1 }).toArray();
      const normalizedOrders = (rawOrders || []).map((o: any) => {
        const orderId = o.orderId || o.id;
        const total = Number(o.total ?? o.pricing?.total ?? o.totalBsd ?? 0);
        const subtotal = Number(o.subtotal ?? o.pricing?.subtotal ?? 0);
        const deliveryFee = Number(o.deliveryFee ?? o.pricing?.deliveryFee ?? 0);
        const tax = Number(o.tax ?? o.pricing?.tax ?? 0);
        const platformFee = Number(o.platformFee ?? o.pricing?.platformFee ?? 0);
        const discount = Number(o.discount ?? o.pricing?.discount ?? 0);

        const items = (Array.isArray(o.items) ? o.items : []).map((i: any) => ({
          id: i.id || i.productId || `item_${Date.now()}`,
          productId: i.productId || i.id || 'prod-1',
          productName: i.productName || i.name || i.food?.name || 'Tropical Gyros Dish',
          price: Number(i.price ?? i.food?.price ?? 0),
          quantity: Number(i.quantity ?? 1),
          imageUrl: i.imageUrl || i.food?.imageUrl || '/images/gyro_with_fries.jpg',
          specialInstructions: i.specialInstructions || '',
        }));

        return {
          id: orderId,
          orderId,
          customerName: o.customerName || o.deliveryAddress?.recipientName || 'Tropical Guest',
          customerEmail: o.customerEmail || 'customer@tropicalgyros.com',
          customerPhone: o.customerPhone || o.deliveryAddress?.phone || '+1 (242) 555-0100',
          deliveryAddress: o.deliveryAddress || null,
          deliveryInstructions: o.deliveryInstructions || '',
          fulfillmentType: o.fulfillmentType || (o.deliveryAddress ? 'delivery' : 'pickup'),
          items,
          subtotal,
          deliveryFee,
          tax,
          platformFee,
          discount,
          total,
          paymentMethod: o.paymentMethod || 'card',
          paymentStatus: o.isPaid ? 'paid' : (o.paymentStatus || 'pending'),
          orderStatus: o.orderStatus || o.status || 'processing',
          createdAt: o.createdAt || new Date().toISOString(),
          updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
          assignedDriverId: o.assignedDriverId || null,
          assignedDriverName: o.assignedDriverName || null,
          estimatedDeliveryTime: o.estimatedDeliveryTime || '25-35 mins',
          barcodeValue: o.barcodeValue || o.barcodeId || `${orderId}-BC`,
          qrCodeValue: o.qrCodeValue || `https://tropicalgyros.demo/order/${orderId}`,
        };
      });

      return NextResponse.json(
        { success: true, data: dedupeById(normalizedOrders) },
        { headers: corsHeaders() }
      );
    }

    if (
      path.startsWith('customer/orders/') ||
      path.startsWith('superadmin/orders/') ||
      path.startsWith('admin/orders/')
    ) {
      const parts = path.split('/');
      const orderId = parts[parts.length - 1];
      const col = db.collection('orders');
      const o = await col.findOne({ $or: [{ id: orderId }, { orderId: orderId }] });
      if (o) {
        const total = Number(o.total ?? o.pricing?.total ?? o.totalBsd ?? 0);
        const subtotal = Number(o.subtotal ?? o.pricing?.subtotal ?? 0);
        const deliveryFee = Number(o.deliveryFee ?? o.pricing?.deliveryFee ?? 0);
        const tax = Number(o.tax ?? o.pricing?.tax ?? 0);
        const platformFee = Number(o.platformFee ?? o.pricing?.platformFee ?? 0);
        const discount = Number(o.discount ?? o.pricing?.discount ?? 0);

        const items = (Array.isArray(o.items) ? o.items : []).map((i: any) => ({
          id: i.id || i.productId || `item_${Date.now()}`,
          productId: i.productId || i.id || 'prod-1',
          productName: i.productName || i.name || i.food?.name || 'Tropical Gyros Dish',
          price: Number(i.price ?? i.food?.price ?? 0),
          quantity: Number(i.quantity ?? 1),
          imageUrl: i.imageUrl || i.food?.imageUrl || '/images/gyro_with_fries.jpg',
          specialInstructions: i.specialInstructions || '',
        }));

        const normalized = {
          id: orderId,
          orderId,
          customerName: o.customerName || o.deliveryAddress?.recipientName || 'Tropical Guest',
          customerEmail: o.customerEmail || 'customer@tropicalgyros.com',
          customerPhone: o.customerPhone || o.deliveryAddress?.phone || '+1 (242) 555-0100',
          deliveryAddress: o.deliveryAddress || null,
          deliveryInstructions: o.deliveryInstructions || '',
          fulfillmentType: o.fulfillmentType || (o.deliveryAddress ? 'delivery' : 'pickup'),
          items,
          subtotal,
          deliveryFee,
          tax,
          platformFee,
          discount,
          total,
          paymentMethod: o.paymentMethod || 'card',
          paymentStatus: o.isPaid ? 'paid' : (o.paymentStatus || 'pending'),
          orderStatus: o.orderStatus || o.status || 'processing',
          createdAt: o.createdAt || new Date().toISOString(),
          updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
          assignedDriverId: o.assignedDriverId || null,
          assignedDriverName: o.assignedDriverName || null,
          estimatedDeliveryTime: o.estimatedDeliveryTime || '25-35 mins',
          barcodeValue: o.barcodeValue || o.barcodeId || `${orderId}-BC`,
          qrCodeValue: o.qrCodeValue || `https://tropicalgyros.demo/order/${orderId}`,
        };
        return NextResponse.json({ success: true, data: normalized, order: normalized }, { headers: corsHeaders() });
      }
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404, headers: corsHeaders() });
    }

    // 5. Admins
    if (path === 'superadmin/admins' || path === 'admin/admins' || path === 'admin/staff') {
      const col = db.collection('admins');
      const items = await col.find({}).toArray();
      return NextResponse.json(
        { success: true, data: dedupeById(items || []) },
        { headers: corsHeaders() }
      );
    }

    // 6. Roles
    if (path === 'superadmin/roles') {
      const col = db.collection('roles');
      const items = await col.find({}).toArray();
      return NextResponse.json(
        { success: true, data: dedupeById(items || []) },
        { headers: corsHeaders() }
      );
    }

    // 7. Delivery Staff
    if (path === 'superadmin/delivery-staff' || path === 'admin/delivery-staff') {
      const col = db.collection('drivers');
      const items = await col.find({}).toArray();
      const normalized = (items || []).map((d: any) => ({
        ...d,
        rating: typeof d.rating === 'number' ? d.rating : 5.0,
        completedDeliveries: typeof d.completedDeliveries === 'number' ? d.completedDeliveries : 0,
        vehicleType: d.vehicleType || 'Motorcycle',
        vehicleNumber: d.vehicleNumber || 'BS-N/A',
        phone: d.phone || 'N/A',
        name: d.name || 'Courier',
        password: d.password || '',
        status: d.status || 'available',
      }));
      return NextResponse.json(
        { success: true, data: dedupeById(normalized) },
        { headers: corsHeaders() }
      );
    }

    // 8. Customers
    if (path === 'superadmin/customers' || path === 'admin/customers') {
      const col = db.collection('customers');
      const items = await col.find({}).toArray();
      return NextResponse.json(
        { success: true, data: dedupeById(items || []) },
        { headers: corsHeaders() }
      );
    }

    // 9. Settings
    if (path === 'superadmin/settings' || path === 'admin/settings' || path === 'customer/settings') {
      const col = db.collection('settings');
      let settings = await col.findOne({ id: 'main_restaurant_settings' });
      if (!settings) {
        settings = (await col.findOne({})) || (initialSettings as any);
      }
      return NextResponse.json(
        { success: true, data: settings },
        { headers: corsHeaders() }
      );
    }

    // Customer Account Verification & Status Check
    if (path === 'customer/auth/verify' || path === 'customer/auth/status') {
      const email = (searchParams.get('email') || '').toLowerCase().trim();
      const id = searchParams.get('id');

      if (!email && !id) {
        return NextResponse.json(
          { success: false, error: 'Email or ID is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const col = db.collection('customers');
      let customer: any = null;
      if (email && id) {
        customer = await col.findOne({ $or: [{ email }, { id }] });
      } else if (email) {
        customer = await col.findOne({ email });
      } else if (id) {
        customer = await col.findOne({ id });
      }

      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            isDeleted: true,
            error: 'Account no longer exists or was deleted by Super Admin.',
          },
          { status: 404, headers: corsHeaders() }
        );
      }

      if (customer.status === 'inactive') {
        return NextResponse.json(
          {
            success: false,
            isBlocked: true,
            status: 'inactive',
            error: 'Your account has been deactivated by Super Admin. Please contact support.',
          },
          { status: 403, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          status: 'active',
          profile: {
            id: customer.id,
            fullName: customer.name,
            email: customer.email,
            phone: customer.phone,
            avatarUrl: customer.avatarUrl,
            memberTier: 'Tropical Gold Member',
            status: customer.status,
          },
        },
        { headers: corsHeaders() }
      );
    }

    // Customer Profile Details
    if (path === 'customer/profile') {
      const email = (searchParams.get('email') || '').toLowerCase().trim();
      const id = searchParams.get('id');

      if (!email && !id) {
        return NextResponse.json(
          { success: false, error: 'Customer email or ID is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const col = db.collection('customers');
      let customer: any = null;
      if (email && id) {
        customer = await col.findOne({ $or: [{ email }, { id }] });
      } else if (email) {
        customer = await col.findOne({ email });
      } else if (id) {
        customer = await col.findOne({ id });
      }

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          profile: {
            id: customer.id,
            fullName: customer.name,
            email: customer.email,
            phone: customer.phone,
            avatarUrl: customer.avatarUrl,
            memberTier: 'Tropical Gold Member',
            status: customer.status || 'active',
          },
        },
        { headers: corsHeaders() }
      );
    }

    // Customer Favorites (GET)
    if (path === 'customer/favorites') {
      const email = (searchParams.get('email') || '').toLowerCase().trim();
      const id = searchParams.get('id');

      if (!email && !id) {
        return NextResponse.json(
          { success: true, favorites: [], data: [] },
          { headers: corsHeaders() }
        );
      }

      const col = db.collection('customers');
      const emailRegex = email ? { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : null;
      const query = email && id
        ? { $or: [{ email: emailRegex }, { id }] }
        : email
        ? { email: emailRegex }
        : { id };

      const customer: any = await col.findOne(query);
      const rawFavs = customer?.favorites || customer?.favoriteIds || [];
      const favorites = Array.isArray(rawFavs) ? rawFavs.map(String) : [];

      return NextResponse.json(
        { success: true, favorites, data: favorites },
        { headers: corsHeaders() }
      );
    }

    // 10. Dashboard
    if (path === 'superadmin/dashboard' || path === 'admin/dashboard') {
      const ordersCol = db.collection('orders');
      const orders = await ordersCol.find({}).toArray();
      const allOrders = orders || [];

      const totalRevenue = allOrders
        .filter((o: any) => o.paymentStatus === 'paid' || o.orderStatus === 'delivered' || o.orderStatus === 'completed' || o.isPaid)
        .reduce((sum: number, o: any) => sum + (Number(o.total ?? o.pricing?.total ?? o.totalBsd) || 0), 0);

      return NextResponse.json(
        {
          success: true,
          data: {
            totalRevenueBsd: Number(totalRevenue.toFixed(2)),
            todayOrdersCount: allOrders.length,
            activeDeliveriesCount: allOrders.filter((o: any) => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'preparing' || o.status === 'out_for_delivery').length,
            pendingOrdersCount: allOrders.filter((o: any) => o.orderStatus === 'pending' || o.orderStatus === 'processing' || o.status === 'processing').length,
          },
        },
        { headers: corsHeaders() }
      );
    }

    // 11. Activity Logs
    if (path === 'superadmin/activity-logs') {
      const col = db.collection('activity_logs');
      const items = await col.find({}).sort({ timestamp: -1 }).limit(100).toArray();
      return NextResponse.json(
        { success: true, data: items || [] },
        { headers: corsHeaders() }
      );
    }

    // 12. Payments & Summary
    if (path === 'superadmin/payments') {
      const col = db.collection('orders');
      const orders = await col.find({}).toArray();
      const payments = (orders || []).map((o: any) => ({
        id: `pay-${o.id}`,
        orderId: o.id,
        customerName: o.customerName || (typeof o.customer === 'object' ? o.customer?.name : o.customer) || 'Customer',
        amount: Number(o.total ?? o.pricing?.total ?? o.totalBsd) || 0,
        paymentMethod: o.paymentMethod || 'Credit Card',
        paymentStatus: o.paymentStatus || (o.isPaid ? 'completed' : 'pending'),
        createdAt: o.createdAt || new Date().toISOString(),
      }));
      return NextResponse.json({ success: true, data: payments }, { headers: corsHeaders() });
    }

    if (path === 'superadmin/payments/summary') {
      const col = db.collection('orders');
      const orders = await col.find({}).toArray();
      const allOrders = orders || [];
      const totalVolume = allOrders.reduce((sum: number, o: any) => sum + (Number(o.total ?? o.pricing?.total ?? o.totalBsd) || 0), 0);
      const codTotal = allOrders
        .filter((o: any) => String(o.paymentMethod || '').toLowerCase().includes('cash'))
        .reduce((sum: number, o: any) => sum + (Number(o.total ?? o.pricing?.total ?? o.totalBsd) || 0), 0);
      const cardTotal = totalVolume - codTotal;
      return NextResponse.json(
        {
          success: true,
          data: {
            totalVolume: Number(totalVolume.toFixed(2)),
            cardTotal: Number(cardTotal.toFixed(2)),
            codTotal: Number(codTotal.toFixed(2)),
            settledCount: allOrders.filter((o: any) => o.paymentStatus === 'paid' || o.isPaid).length,
            pendingCount: allOrders.filter((o: any) => o.paymentStatus !== 'paid' && !o.isPaid).length,
          },
        },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy Orders: Assigned (GET)
    if (path === 'delivery-boy/orders/assigned') {
      const driverId = (searchParams.get('driverId') || '').trim();
      const col = db.collection('orders');

      let matchQuery: any = { assignedDriverId: driverId };
      if (driverId) {
        try {
          const driversCol = db.collection('drivers');
          const driverDoc = await driversCol.findOne({
            $or: [
              { id: driverId },
              { email: driverId.toLowerCase() },
              { name: new RegExp(driverId, 'i') },
            ],
          });
          if (driverDoc) {
            const matchIds = [driverDoc.id, driverId].filter(Boolean);
            const nameRegex = new RegExp(`^${driverDoc.name}\\b|${driverDoc.name}`, 'i');
            matchQuery = {
              $or: [
                { assignedDriverId: { $in: matchIds } },
                { assignedDriverName: nameRegex },
              ],
            };
          }
        } catch (_) {}
      }

      const activeQuery = {
        ...matchQuery,
        orderStatus: { $nin: ['delivered', 'cancelled', 'completed'] },
        status: { $nin: ['delivered', 'cancelled', 'completed'] },
      };

      const orders = await col.find(activeQuery).sort({ createdAt: -1 }).toArray();
      const normalized = (orders || []).map(normalizeForDeliveryBoy);

      return NextResponse.json(
        { success: true, count: normalized.length, data: normalized },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy Orders: Delivery History (GET)
    if (path === 'delivery-boy/orders/history') {
      const driverId = (searchParams.get('driverId') || '').trim();
      const col = db.collection('orders');

      let matchQuery: any = { assignedDriverId: driverId };
      if (driverId) {
        try {
          const driversCol = db.collection('drivers');
          const driverDoc = await driversCol.findOne({
            $or: [
              { id: driverId },
              { email: driverId.toLowerCase() },
              { name: new RegExp(driverId, 'i') },
            ],
          });
          if (driverDoc) {
            const matchIds = [driverDoc.id, driverId].filter(Boolean);
            const nameRegex = new RegExp(`^${driverDoc.name}\\b|${driverDoc.name}`, 'i');
            matchQuery = {
              $or: [
                { assignedDriverId: { $in: matchIds } },
                { assignedDriverName: nameRegex },
              ],
            };
          }
        } catch (_) {}
      }

      const historyQuery = {
        ...matchQuery,
        $or: [
          { orderStatus: { $in: ['delivered', 'completed'] } },
          { status: { $in: ['delivered', 'completed'] } },
        ],
      };

      const orders = await col.find(historyQuery).sort({ deliveredAt: -1, updatedAt: -1 }).limit(100).toArray();
      const normalized = (orders || []).map(normalizeForDeliveryBoy);

      return NextResponse.json(
        { success: true, count: normalized.length, data: normalized },
        { headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: false, error: `Route not found: ${path}` },
      { status: 404, headers: corsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = (await context.params) || {};
  const path = slug.join('/');
  const { searchParams } = new URL(request.url);

  try {
    const db = await getDb();
    const body = await request.json().catch(() => ({}));

    // Categories
    if (path === 'superadmin/categories' || path === 'admin/categories') {
      const col = db.collection('categories');
      const newCat = {
        ...body,
        id: body.id || `cat_${Date.now()}`,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      };
      await col.updateOne({ id: newCat.id }, { $set: newCat }, { upsert: true });
      return NextResponse.json({ success: true, data: newCat }, { status: 201, headers: corsHeaders() });
    }

    // Products
    if (path === 'superadmin/products' || path === 'admin/products') {
      const col = db.collection('products');
      const newProd = {
        ...body,
        id: body.id || `prod_${Date.now()}`,
        isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
      };
      await col.updateOne({ id: newProd.id }, { $set: newProd }, { upsert: true });
      return NextResponse.json({ success: true, data: newProd }, { status: 201, headers: corsHeaders() });
    }

    // Orders placement (Customer App & Admin)
    if (
      path === 'customer/orders' ||
      path === 'orders' ||
      path === 'admin/orders' ||
      path === 'superadmin/orders'
    ) {
      const col = db.collection('orders');
      const { _id, ...cleanBody } = body;
      const orderId =
        cleanBody.orderId ||
        cleanBody.id ||
        `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

      const normalizedItems = (Array.isArray(cleanBody.items) ? cleanBody.items : []).map((i: any) => {
        if (i.food) {
          return {
            id: i.food.id || `item_${Date.now()}`,
            productId: i.food.id || 'prod-1',
            productName: i.food.name || 'Tropical Gyros Dish',
            price: Number(i.food.price) || 0,
            quantity: Number(i.quantity) || 1,
            imageUrl: i.food.imageUrl || '/images/gyro_with_fries.jpg',
            specialInstructions: i.specialInstructions || '',
            food: i.food,
          };
        }
        return {
          id: i.id || i.productId || `item_${Date.now()}`,
          productId: i.productId || 'prod-1',
          productName: i.productName || i.name || 'Tropical Gyros Dish',
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
          imageUrl: i.imageUrl || '/images/gyro_with_fries.jpg',
          specialInstructions: i.specialInstructions || '',
        };
      });

      const recipientName =
        cleanBody.customerName ||
        cleanBody.deliveryAddress?.recipientName ||
        'Alex Rivera';
      const recipientPhone =
        cleanBody.customerPhone ||
        cleanBody.deliveryAddress?.phone ||
        '+1 (242) 555-0199';

      const newOrder = {
        id: orderId,
        orderId: orderId,
        customerName: recipientName,
        customerEmail: cleanBody.customerEmail || 'customer@tropicalgyros.com',
        customerPhone: recipientPhone,
        fulfillmentType: cleanBody.fulfillmentType || 'delivery',
        deliveryAddress: cleanBody.deliveryAddress || {
          street: '14 Rosetta Street',
          city: 'Palmdale, Nassau',
          postalCode: 'N-4832',
          distanceMiles: 1.2,
          latitude: 25.0670,
          longitude: -77.3230,
        },
        deliveryInstructions: cleanBody.deliveryInstructions || '',
        items: normalizedItems,
        subtotal: Number(cleanBody.subtotal) || 0,
        deliveryFee: Number(cleanBody.deliveryFee) || 0,
        tax: Number(cleanBody.tax) || 0,
        platformFee: Number(cleanBody.platformFee) || 0,
        discount: Number(cleanBody.discount) || 0,
        total: Number(cleanBody.total) || 0,
        paymentMethod: cleanBody.paymentMethod || 'card',
        paymentStatus: cleanBody.isPaid ? 'paid' : (cleanBody.paymentStatus || 'pending'),
        orderStatus: 'processing',
        status: 'processing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedDriverId: cleanBody.assignedDriverId || null,
        assignedDriverName: cleanBody.assignedDriverName || null,
        estimatedDeliveryTime: cleanBody.estimatedDeliveryTime || '25-35 mins',
        barcodeValue: cleanBody.barcodeValue || `${orderId}-BC`,
        qrCodeValue: cleanBody.qrCodeValue || `https://tropicalgyros.demo/order/${orderId}`,
      };

      await col.updateOne({ id: orderId }, { $set: newOrder }, { upsert: true });

      // Live sync customer into customers collection for Super Admin User Management
      try {
        const custCol = db.collection('customers');
        const custEmail = (cleanBody.customerEmail || 'customer@tropicalgyros.com').toLowerCase().trim();
        const existingCust = await custCol.findOne({
          $or: [{ email: custEmail }, { phone: recipientPhone }]
        });
        if (existingCust) {
          await custCol.updateOne(
            { id: existingCust.id },
            {
              $inc: { totalOrders: 1, totalSpent: newOrder.total },
              $set: { updatedAt: new Date().toISOString() }
            }
          );
        } else {
          const newCust = {
            id: `cust-${Date.now()}`,
            name: recipientName,
            email: custEmail,
            phone: recipientPhone,
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            totalOrders: 1,
            totalSpent: newOrder.total,
            registeredDate: new Date().toISOString().split('T')[0],
            status: 'active',
            address: newOrder.deliveryAddress?.street || 'Nassau, Bahamas',
            distanceMiles: newOrder.deliveryAddress?.distanceMiles || 1.5,
            favoriteCategory: 'Gyros',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await custCol.updateOne({ id: newCust.id }, { $set: newCust }, { upsert: true });
        }
      } catch (custErr) {
        console.warn('Customer upsert notice:', custErr);
      }

      return NextResponse.json(
        { success: true, order: newOrder, data: newOrder },
        { status: 201, headers: corsHeaders() }
      );
    }

    // Customer App Auth: Register
    if (path === 'customer/auth/register') {
      const col = db.collection('customers');
      const fullName = body.fullName || body.name || 'Tropical Customer';
      const email = (body.email || '').toLowerCase().trim();
      const phone = body.phone || '+1 (242) 555-0100';
      const password = body.password || '';

      let existing = await col.findOne({ email });
      if (!existing && phone) {
        existing = await col.findOne({ phone });
      }

      if (existing) {
        return NextResponse.json(
          {
            success: true,
            message: 'Account already registered',
            profile: {
              id: existing.id,
              fullName: existing.name || fullName,
              email: existing.email || email,
              phone: existing.phone || phone,
              avatarUrl: existing.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              memberTier: 'Tropical Gold Member',
              joinedDate: existing.createdAt || new Date().toISOString(),
            },
          },
          { headers: corsHeaders() }
        );
      }

      const custId = `cust-${Date.now()}`;
      const newCustomer = {
        id: custId,
        name: fullName,
        email: email || `${custId}@tropicalgyros.com`,
        phone: phone,
        password: password,
        avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        totalOrders: 0,
        totalSpent: 0,
        registeredDate: new Date().toISOString().split('T')[0],
        status: 'active',
        address: body.address || 'Nassau, Bahamas',
        favoriteCategory: 'Gyros',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await col.updateOne({ id: custId }, { $set: newCustomer }, { upsert: true });

      return NextResponse.json(
        {
          success: true,
          message: 'Registration successful',
          profile: {
            id: custId,
            fullName: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone,
            avatarUrl: newCustomer.avatarUrl,
            memberTier: 'Tropical Gold Member',
            joinedDate: newCustomer.createdAt,
          },
        },
        { status: 201, headers: corsHeaders() }
      );
    }

    // Customer App Auth: Login
    if (path === 'customer/auth/login') {
      const col = db.collection('customers');
      const email = (body.email || '').toLowerCase().trim();
      const password = (body.password || '').trim();

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      let customer: any = await col.findOne({
        $or: [{ email }, { phone: email }],
      });

      // Special fallback matching for demo accounts
      if (!customer && (email === 'alex.rivera@tropicalbites.com' || email === 'alex.rivera@tropicalgyros.com')) {
        customer = await col.findOne({ id: 'cust_1' });
      }

      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            error: 'No account found with this email. Please check your credentials or register.',
          },
          { status: 404, headers: corsHeaders() }
        );
      }

      if (customer.status === 'inactive') {
        return NextResponse.json(
          {
            success: false,
            isBlocked: true,
            error: 'Your account has been deactivated by Super Admin. Please contact support.',
          },
          { status: 403, headers: corsHeaders() }
        );
      }

      // Strictly validate password
      const storedPassword = (customer.password || '').trim();
      if (storedPassword) {
        if (password !== storedPassword) {
          return NextResponse.json(
            {
              success: false,
              error: 'Incorrect password. Please try again.',
            },
            { status: 401, headers: corsHeaders() }
          );
        }
      } else {
        // Legacy or seed customer without password stored: check default demo password 'tropical123'
        if (customer.email?.includes('alex.rivera') && password !== 'tropical123') {
          return NextResponse.json(
            {
              success: false,
              error: 'Incorrect password. Please try again.',
            },
            { status: 401, headers: corsHeaders() }
          );
        }
        await col.updateOne({ id: customer.id }, { $set: { password, updatedAt: new Date().toISOString() } });
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          profile: {
            id: customer.id,
            fullName: customer.name,
            email: customer.email,
            phone: customer.phone,
            avatarUrl: customer.avatarUrl,
            memberTier: 'Tropical Gold Member',
            joinedDate: customer.createdAt || new Date().toISOString(),
          },
        },
        { headers: corsHeaders() }
      );
    }

    // Customer Auth: Forgot Password (Send Dynamic OTP)
    if (path === 'customer/auth/forgot-password') {
      const { email } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address or phone number is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const col = db.collection('customers');
      const customer: any = await col.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
          { phone: cleanEmail },
        ],
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'No customer account found with this email or phone number.' },
          { status: 404, headers: corsHeaders() }
        );
      }

      if (customer.status === 'inactive') {
        return NextResponse.json(
          {
            success: false,
            isBlocked: true,
            error: 'Your account has been deactivated by Super Admin. Please contact support.',
          },
          { status: 403, headers: corsHeaders() }
        );
      }

      const targetEmail = customer.email || cleanEmail;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const token = `cust_rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const resetsCol = db.collection('password_resets');
      await resetsCol.insertOne({
        email: targetEmail.toLowerCase().trim(),
        customerId: customer.id,
        customerName: customer.name,
        otp,
        token,
        role: 'customer',
        expiresAt,
        used: false,
        createdAt: new Date(),
      });

      // Send verification email via SMTP directly to customer's email
      const mailResult = await sendVerificationEmail({
        to: targetEmail,
        name: customer.name || 'Valued Customer',
        otp,
        appTitle: 'Tropical Customer App',
        subject: `Your Verification Code: ${otp} — Tropical Gyros`,
      }).catch((err: any) => ({ success: false, error: err?.message }));

      return NextResponse.json(
        {
          success: true,
          message: `Verification code has been sent directly to ${targetEmail}. Please check your email inbox.`,
          token,
          email: targetEmail,
          emailSent: Boolean(mailResult.success),
          expiresInMinutes: 15,
        },
        { headers: corsHeaders() }
      );
    }

    // Customer Auth: Verify OTP
    if (path === 'customer/auth/verify-otp') {
      const { email, otp } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanOtp = (otp || '').trim();

      if (!cleanEmail || !cleanOtp) {
        return NextResponse.json(
          { success: false, error: 'Email and verification code are required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetsCol = db.collection('password_resets');
      const resetRecord = await resetsCol.findOne({
        email: cleanEmail,
        otp: cleanOtp,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired verification code' },
          { status: 400, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          valid: true,
          token: resetRecord.token,
          message: 'Verification code verified successfully',
        },
        { headers: corsHeaders() }
      );
    }

    // Customer Auth: Reset Password
    if (path === 'customer/auth/reset-password') {
      const { email, otp, token, newPassword } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!newPassword || newPassword.trim().length < 4) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 4 characters' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetsCol = db.collection('password_resets');
      const query: any = {
        email: cleanEmail,
        used: false,
        expiresAt: { $gt: new Date() },
      };

      if (token) {
        query.token = token;
      } else if (otp) {
        query.otp = otp.trim();
      } else {
        return NextResponse.json(
          { success: false, error: 'Verification code or reset token is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetRecord = await resetsCol.findOne(query);
      if (!resetRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid, expired, or already used reset request' },
          { status: 400, headers: corsHeaders() }
        );
      }

      await resetsCol.updateOne(
        { _id: resetRecord._id },
        { $set: { used: true, usedAt: new Date() } }
      );

      const customersCol = db.collection('customers');
      await customersCol.updateOne(
        {
          $or: [
            { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
            { id: resetRecord.customerId },
          ],
        },
        {
          $set: {
            password: newPassword.trim(),
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Customer password reset successfully! You can now log in with your new password.',
        },
        { headers: corsHeaders() }
      );
    }

    // Customer App: Update Profile & Avatar
    if (path === 'customer/profile' || path === 'customer/auth/profile') {
      const { id, email, fullName, name, phone, avatarUrl } = body || {};
      const cleanEmail = (email || '').toLowerCase().trim();

      if (!cleanEmail && !id) {
        return NextResponse.json(
          { success: false, error: 'Customer email or ID is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const col = db.collection('customers');
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };
      if (fullName || name) updateData.name = (fullName || name).trim();
      if (phone) updateData.phone = phone.trim();
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      const query: any = {
        $or: [
          ...(id ? [{ id }] : []),
          ...(cleanEmail ? [{ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } }] : []),
        ],
      };

      await col.updateOne(query, { $set: updateData });
      const updatedCustomer: any = await col.findOne(query);

      return NextResponse.json(
        {
          success: true,
          message: 'Profile updated successfully',
          profile: {
            id: updatedCustomer?.id || id,
            fullName: updatedCustomer?.name || fullName,
            email: updatedCustomer?.email || cleanEmail,
            phone: updatedCustomer?.phone || phone,
            avatarUrl: updatedCustomer?.avatarUrl || avatarUrl,
            memberTier: 'Tropical Gold Member',
          },
        },
        { headers: corsHeaders() }
      );
    }

    // Customer Favorites (POST)
    if (path === 'customer/favorites') {
      const email = (body.email || searchParams.get('email') || '').toLowerCase().trim();
      const id = body.id || body.customerId || searchParams.get('id');
      const rawFavs = body.favorites || body.favoriteIds || [];
      const favoriteIds = Array.isArray(rawFavs) ? rawFavs.map(String) : [];

      if (!email && !id) {
        return NextResponse.json(
          { success: false, error: 'Customer email or ID is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const col = db.collection('customers');
      const emailRegex = email ? { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : null;
      const query = email && id
        ? { $or: [{ email: emailRegex }, { id }] }
        : email
        ? { email: emailRegex }
        : { id };

      await col.updateOne(
        query,
        {
          $set: {
            favorites: favoriteIds,
            favoriteIds: favoriteIds,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: false }
      );

      return NextResponse.json(
        { success: true, favorites: favoriteIds, data: favoriteIds },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy Auth: Login
    if (path === 'delivery-boy/auth/login') {
      const col = db.collection('drivers');
      const email = (body.email || '').toLowerCase().trim();
      const password = (body.password || '').trim();

      // Find driver by email or phone (case-insensitive)
      let driver: any = await col.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${email}$`, 'i') } },
          { phone: email },
        ],
      });

      // Demo fallback matching for Devon or Marco
      if (!driver && email.includes('devon')) {
        driver = (await col.findOne({ id: 'drv-00' })) || (await col.findOne({ name: /Devon/i }));
      }
      if (!driver && email.includes('marco')) {
        driver = (await col.findOne({ id: 'drv-01' })) || (await col.findOne({ name: /Marco/i }));
      }

      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'Courier account not found with this email or phone number. Please check with your restaurant admin.' },
          { status: 404, headers: corsHeaders() }
        );
      }

      // Strictly validate password against database record
      const expectedPassword = (driver.password || '').trim();
      if (!expectedPassword || !password || password.trim() !== expectedPassword) {
        return NextResponse.json(
          { success: false, error: 'Incorrect courier password. Please check your credentials.' },
          { status: 401, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Courier logged in successfully',
          driver: {
            id: driver.id,
            name: driver.name,
            email: driver.email || email,
            phone: driver.phone || '+1 (242) 555-0100',
            vehicleType: driver.vehicleType || 'Electric Scooter',
            vehicleNumber: driver.vehicleNumber || 'BS-SCOOT-01',
            status: driver.status || 'available',
            isOnline: driver.status !== 'offline',
          },
        },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy Auth: Forgot Password (Send OTP)
    if (path === 'delivery-boy/auth/forgot-password') {
      const { email } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address or phone number is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const col = db.collection('drivers');
      const driver: any = await col.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
          { phone: cleanEmail },
        ],
      });

      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'No courier account found with this email or phone number.' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const targetEmail = driver.email || cleanEmail;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const token = `drv_rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const resetsCol = db.collection('password_resets');
      await resetsCol.insertOne({
        email: targetEmail.toLowerCase().trim(),
        driverId: driver.id,
        driverName: driver.name,
        otp,
        token,
        role: 'delivery-boy',
        expiresAt,
        used: false,
        createdAt: new Date(),
      });

      // Send verification email via SMTP if configured
      const mailResult = await sendVerificationEmail({
        to: targetEmail,
        name: driver.name || 'Courier',
        otp,
      }).catch((err) => ({ success: false, error: err?.message }));

      return NextResponse.json(
        {
          success: true,
          message: mailResult.success
            ? `Verification code has been sent directly to ${targetEmail}`
            : `Verification code generated for ${targetEmail}`,
          token,
          email: targetEmail,
          emailSent: Boolean(mailResult.success),
          demoOtp: !mailResult.success ? otp : undefined,
          expiresInMinutes: 15,
        },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy Auth: Verify OTP
    if (path === 'delivery-boy/auth/verify-otp') {
      const { email, otp } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanOtp = (otp || '').trim();

      if (!cleanEmail || !cleanOtp) {
        return NextResponse.json(
          { success: false, error: 'Email and verification code are required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetsCol = db.collection('password_resets');
      const resetRecord = await resetsCol.findOne({
        email: cleanEmail,
        otp: cleanOtp,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired verification code' },
          { status: 400, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          valid: true,
          token: resetRecord.token,
          message: 'Verification code verified successfully',
        },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy Auth: Reset Password
    if (path === 'delivery-boy/auth/reset-password') {
      const { email, otp, token, newPassword } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!newPassword || newPassword.trim().length < 4) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 4 characters' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetsCol = db.collection('password_resets');
      const query: any = {
        email: cleanEmail,
        used: false,
        expiresAt: { $gt: new Date() },
      };

      if (token) {
        query.token = token;
      } else if (otp) {
        query.otp = otp.trim();
      } else {
        return NextResponse.json(
          { success: false, error: 'Verification code or reset token is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetRecord = await resetsCol.findOne(query);
      if (!resetRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid, expired, or already used reset request' },
          { status: 400, headers: corsHeaders() }
        );
      }

      await resetsCol.updateOne(
        { _id: resetRecord._id },
        { $set: { used: true, usedAt: new Date() } }
      );

      const driversCol = db.collection('drivers');
      await driversCol.updateOne(
        {
          $or: [
            { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
            { id: resetRecord.driverId },
          ],
        },
        {
          $set: {
            password: newPassword.trim(),
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Courier password reset successfully! You can now log in with your new password.',
        },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy: Verify Code (Barcode / QR Code verification)
    if (path === 'delivery-boy/orders/verify-code') {
      const code = (body.code || '').trim();
      if (!code) {
        return NextResponse.json(
          { success: false, error: 'Code is required' },
          { status: 400, headers: corsHeaders() }
        );
      }
      const col = db.collection('orders');
      const cleanCode = code.replace(/https?:\/\/[^/]+\/order\//i, '').replace(/-BC$/i, '').trim();
      const order = await col.findOne({
        $or: [
          { id: code },
          { id: cleanCode },
          { orderId: code },
          { orderId: cleanCode },
          { barcodeValue: code },
          { barcodeValue: { $regex: new RegExp(cleanCode, 'i') } },
          { qrCodeValue: code },
          { qrCodeValue: { $regex: new RegExp(cleanCode, 'i') } },
        ],
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: `No active order found for code "${code}"` },
          { status: 404, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        { success: true, order: normalizeForDeliveryBoy(order) },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy: Mark Cash Collected
    if (
      slug &&
      slug[0] === 'delivery-boy' &&
      slug[1] === 'orders' &&
      slug[2] &&
      slug[3] === 'cash-collected'
    ) {
      const id = slug[2];
      const amount = Number(body.amount) || 0;
      const col = db.collection('orders');
      await col.updateOne(
        { $or: [{ id }, { orderId: id }] },
        {
          $set: {
            isPaid: true,
            paymentStatus: 'paid',
            cashCollected: amount,
            cashCollectedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      );
      return NextResponse.json({ success: true, isPaid: true }, { headers: corsHeaders() });
    }

    // Delivery Boy: Live GPS Location Ping
    if (path === 'delivery-boy/location') {
      const { driverId, latitude, longitude, speedKmh, headingDeg } = body || {};
      if (driverId && latitude && longitude) {
        const driversCol = db.collection('drivers');
        await driversCol.updateOne(
          { $or: [{ id: driverId }, { email: driverId.toLowerCase() }] },
          {
            $set: {
              latitude: Number(latitude),
              longitude: Number(longitude),
              speedKmh: Number(speedKmh) || 0,
              headingDeg: Number(headingDeg) || 0,
              lastLocationUpdate: new Date().toISOString(),
            },
          }
        );
      }
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }

    // Admins & Staff Creation
    if (path === 'superadmin/admins' || path === 'admin/admins' || path === 'admin/staff') {
      const col = db.collection('admins');
      const { id, name, email, phone, roleId, roleTitle, permissions, password, avatarUrl, status } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !name) {
        return NextResponse.json(
          { success: false, error: 'Admin full name and email are required' },
          { status: 400, headers: corsHeaders() }
        );
      }
      const existing = await col.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'An admin account with this email already exists' },
          { status: 409, headers: corsHeaders() }
        );
      }
      const adminId = id || `adm-${Date.now()}`;
      const newAdmin = {
        id: adminId,
        name: name.trim(),
        email: cleanEmail,
        phone: (phone || '').trim(),
        roleId: roleId || 'role-front-desk',
        roleTitle: roleTitle || 'Front Counter Clerk',
        status: status || 'active',
        permissions: permissions || {
          orders: { viewOrders: true, viewOrderDetails: true, updateOrderStatus: true, assignDeliveryStaff: true, cancelOrders: false, printInvoice: true, exportOrders: true },
          products: { viewProducts: true, addProducts: false, editProducts: false, deleteProducts: false, updateStockAvailability: true },
          categories: { viewCategories: true, addCategories: false, editCategories: false, deleteCategories: false },
          payments: { viewPayments: false, viewTransactions: false, markCashReceived: true },
          deliveryStaff: { viewStaff: true, addStaff: false, editStaff: false, manageAssignments: false },
          customers: { viewCustomers: true, viewCustomerDetails: true, manageCustomerAccounts: false },
        },
        password: password || 'Admin@123',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActive: 'Just now',
      };
      await col.updateOne({ id: adminId }, { $set: newAdmin }, { upsert: true });
      return NextResponse.json(
        { success: true, data: newAdmin, message: 'Admin account created successfully' },
        { status: 201, headers: corsHeaders() }
      );
    }

    // Custom Roles Creation
    if (path === 'superadmin/roles' || path === 'admin/roles') {
      const col = db.collection('roles');
      const roleId = body.id || `role-${Date.now()}`;
      const newRole = {
        ...body,
        id: roleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await col.updateOne({ id: roleId }, { $set: newRole }, { upsert: true });
      return NextResponse.json({ success: true, data: newRole }, { status: 201, headers: corsHeaders() });
    }

    // Delivery Staff Creation
    if (path === 'superadmin/delivery-staff' || path === 'admin/delivery-staff') {
      const col = db.collection('drivers');
      const drvId = body.id || `drv-${Date.now()}`;
      const newDriver = {
        ...body,
        id: drvId,
        status: body.status || 'available',
        password: (body.password || '').trim(),
        rating: typeof body.rating === 'number' ? body.rating : 5.0,
        completedDeliveries: typeof body.completedDeliveries === 'number' ? body.completedDeliveries : 0,
        vehicleType: body.vehicleType || 'Motorcycle',
        vehicleNumber: body.vehicleNumber || 'BS-N/A',
        phone: body.phone || 'N/A',
        name: body.name || 'Courier',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await col.updateOne({ id: drvId }, { $set: newDriver }, { upsert: true });
      return NextResponse.json({ success: true, data: newDriver }, { status: 201, headers: corsHeaders() });
    }

    // Activity Logs Creation
    if (path === 'superadmin/activity-logs') {
      const col = db.collection('activity_logs');
      const logItem = {
        ...body,
        id: body.id || `log-${Date.now()}`,
        timestamp: body.timestamp || new Date().toISOString(),
      };
      await col.insertOne(logItem);
      return NextResponse.json({ success: true, data: logItem }, { status: 201, headers: corsHeaders() });
    }

    // Cancel Order
    if (slug[1] === 'orders' && slug[2] && slug[3] === 'cancel') {
      const id = slug[2];
      const col = db.collection('orders');
      await col.updateOne({ id }, { $set: { orderStatus: 'cancelled', cancellationReason: body.reason, updatedAt: new Date().toISOString() } });
      return NextResponse.json({ success: true, id, status: 'cancelled' }, { headers: corsHeaders() });
    }

    // Login
    if (path === 'admin/login' || path === 'superadmin/login') {
      const { email, password } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      const col = db.collection('admins');
      let admin: any = await col.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

      if (!admin) {
        if (cleanEmail === 'superadmin@tropicalgyros.com') {
          admin = {
            id: 'adm-master',
            name: 'Master Authority',
            email: 'superadmin@tropicalgyros.com',
            phone: '+1 (242) 555-0100',
            roleId: 'role-superadmin',
            roleTitle: 'Super Administrator',
            status: 'active',
            password: 'Admin@123',
            createdAt: new Date().toISOString(),
            permissions: {
              orders: { viewOrders: true, viewOrderDetails: true, updateOrderStatus: true, assignDeliveryStaff: true, cancelOrders: true, printInvoice: true, exportOrders: true },
              products: { viewProducts: true, addProducts: true, editProducts: true, deleteProducts: true, updateStockAvailability: true },
              categories: { viewCategories: true, addCategories: true, editCategories: true, deleteCategories: true },
              payments: { viewPayments: true, viewTransactions: true, markCashReceived: true },
              deliveryStaff: { viewStaff: true, addStaff: true, editStaff: true, manageAssignments: true },
              customers: { viewCustomers: true, viewCustomerDetails: true, manageCustomerAccounts: true },
            },
          };
          await col.updateOne({ email: admin.email }, { $set: admin }, { upsert: true });
        } else {
          const defaultAdmin = initialAdminAccounts.find((a) => a.email.toLowerCase() === cleanEmail);
          if (defaultAdmin) {
            admin = {
              ...defaultAdmin,
              password: 'Admin@123',
              createdAt: new Date().toISOString(),
            };
            await col.updateOne({ id: admin.id }, { $set: admin }, { upsert: true });
          }
        }
      }

      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'Admin account not found' },
          { status: 401, headers: corsHeaders() }
        );
      }

      if (!admin.permissions) {
        admin.permissions = {
          orders: { viewOrders: true, viewOrderDetails: true, updateOrderStatus: true, assignDeliveryStaff: true, cancelOrders: false, printInvoice: true, exportOrders: true },
          products: { viewProducts: true, addProducts: false, editProducts: false, deleteProducts: false, updateStockAvailability: true },
          categories: { viewCategories: true, addCategories: false, editCategories: false, deleteCategories: false },
          payments: { viewPayments: false, viewTransactions: false, markCashReceived: true },
          deliveryStaff: { viewStaff: true, addStaff: false, editStaff: false, manageAssignments: false },
          customers: { viewCustomers: true, viewCustomerDetails: true, manageCustomerAccounts: false },
        };
      }

      const expectedPassword = admin.password || 'Admin@123';
      if (password && password !== expectedPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid password. Please check your credentials.' },
          { status: 401, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          token: `jwt_${Date.now()}_${admin.id}`,
          user: admin,
          admin: admin,
        },
        { headers: corsHeaders() }
      );
    }

    // Forgot Password
    if (path === 'admin/forgot-password' || path === 'superadmin/forgot-password') {
      const { email } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const adminsCol = db.collection('admins');
      let admin: any = await adminsCol.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

      if (!admin) {
        const defaultAdmin = initialAdminAccounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (defaultAdmin) {
          admin = {
            ...defaultAdmin,
            password: 'Admin@123',
            createdAt: new Date().toISOString(),
          };
          await adminsCol.updateOne({ id: admin.id }, { $set: admin }, { upsert: true });
        }
      }

      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'No admin account found with this email address' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const token = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const resetsCol = db.collection('password_resets');
      await resetsCol.insertOne({
        email: cleanEmail,
        adminId: admin.id,
        adminName: admin.name,
        otp,
        token,
        expiresAt,
        used: false,
        createdAt: new Date(),
      });

      // Send real verification email via SMTP if credentials are configured
      const mailResult = await sendVerificationEmail({
        to: cleanEmail,
        name: admin.name || 'Admin Staff',
        otp,
      }).catch((err) => ({ success: false, error: err?.message }));

      return NextResponse.json(
        {
          success: true,
          message: mailResult.success
            ? `Verification code has been sent directly to your email: ${cleanEmail}`
            : `Verification code generated for ${cleanEmail}`,
          token,
          emailSent: Boolean(mailResult.success),
          expiresInMinutes: 15,
        },
        { headers: corsHeaders() }
      );
    }

    // Verify Reset Code
    if (path === 'admin/verify-reset-code' || path === 'superadmin/verify-reset-code') {
      const { email, otp } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanOtp = (otp || '').trim();

      if (!cleanEmail || !cleanOtp) {
        return NextResponse.json(
          { success: false, error: 'Email and verification code are required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetsCol = db.collection('password_resets');
      const resetRecord = await resetsCol.findOne({
        email: cleanEmail,
        otp: cleanOtp,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired verification code' },
          { status: 400, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          valid: true,
          token: resetRecord.token,
          message: 'Verification code verified successfully',
        },
        { headers: corsHeaders() }
      );
    }

    // Reset Password
    if (path === 'admin/reset-password' || path === 'superadmin/reset-password') {
      const { email, otp, token, newPassword } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetsCol = db.collection('password_resets');
      const query: any = {
        email: cleanEmail,
        used: false,
        expiresAt: { $gt: new Date() },
      };

      if (token) {
        query.token = token;
      } else if (otp) {
        query.otp = otp.trim();
      } else {
        return NextResponse.json(
          { success: false, error: 'Verification code or reset token is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const resetRecord = await resetsCol.findOne(query);
      if (!resetRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid, expired, or already used reset request' },
          { status: 400, headers: corsHeaders() }
        );
      }

      await resetsCol.updateOne(
        { _id: resetRecord._id },
        { $set: { used: true, usedAt: new Date() } }
      );

      const adminsCol = db.collection('admins');
      await adminsCol.updateOne(
        { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
        {
          $set: {
            password: newPassword,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Password reset successfully! You can now log in with your new password.',
        },
        { headers: corsHeaders() }
      );
    }

    // Change Password (for logged-in admin user)
    if (path === 'admin/change-password' || path === 'superadmin/change-password') {
      const { email, currentPassword, newPassword } = body || {};
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (currentPassword === newPassword) {
        return NextResponse.json(
          { success: false, error: 'New password cannot be the same as your current password' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const adminsCol = db.collection('admins');
      let admin: any = await adminsCol.findOne({
        email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
      });

      if (!admin) {
        const defaultAdmin = initialAdminAccounts.find((a: any) => a.email.toLowerCase() === cleanEmail);
        if (defaultAdmin) {
          admin = {
            ...defaultAdmin,
            password: 'Admin@123',
            createdAt: new Date().toISOString(),
          };
          await adminsCol.updateOne({ id: admin.id }, { $set: admin }, { upsert: true });
        }
      }

      if (!admin) {
        return NextResponse.json(
          { success: false, error: 'No admin account found with this email address' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const expectedPassword = admin.password || 'Admin@123';
      if (currentPassword !== expectedPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect. Please try again.' },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Update password in MongoDB Atlas
      await adminsCol.updateOne(
        { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
        {
          $set: {
            password: newPassword,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Password changed successfully! Your credentials have been updated.',
        },
        { headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: false, error: `Route not found: ${path}` },
      { status: 404, headers: corsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = (await context.params) || {};
  const path = slug.join('/');
  const { searchParams } = new URL(request.url);

  try {
    const db = await getDb();
    const body = await request.json().catch(() => ({}));

    // Update Category: superadmin/categories/:id
    if (slug[1] === 'categories' && slug[2]) {
      const id = slug[2];
      const col = db.collection('categories');
      const { _id, ...cleanData } = body;
      cleanData.id = id;
      await col.updateOne({ id }, { $set: cleanData }, { upsert: true });
      const updated = await col.findOne({ id });
      return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders() });
    }

    // Update Product: superadmin/products/:id
    if (slug[1] === 'products' && slug[2]) {
      const id = slug[2];
      const col = db.collection('products');
      const { _id, ...cleanData } = body;
      if (cleanData.price !== undefined) {
        cleanData.price = typeof cleanData.price === 'number' ? cleanData.price : parseFloat(cleanData.price) || 0;
      }
      cleanData.id = id;
      await col.updateOne({ id }, { $set: cleanData }, { upsert: true });
      const updated = await col.findOne({ id });
      return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders() });
    }

    // Update Admin / Staff: superadmin/admins/:id or admin/staff/:id
    if ((slug[1] === 'admins' || slug[1] === 'staff') && slug[2]) {
      const id = slug[2];
      const col = db.collection('admins');
      const { _id, ...cleanData } = body;
      cleanData.id = id;
      cleanData.updatedAt = new Date().toISOString();
      await col.updateOne({ id }, { $set: cleanData }, { upsert: true });
      const updated = await col.findOne({ id });
      return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders() });
    }

    // Update Role: superadmin/roles/:id
    if (slug[1] === 'roles' && slug[2]) {
      const id = slug[2];
      const col = db.collection('roles');
      const { _id, ...cleanData } = body;
      cleanData.id = id;
      cleanData.updatedAt = new Date().toISOString();
      await col.updateOne({ id }, { $set: cleanData }, { upsert: true });
      const updated = await col.findOne({ id });
      return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders() });
    }

    // Update Driver: superadmin/delivery-staff/:id
    if (slug[1] === 'delivery-staff' && slug[2]) {
      const id = slug[2];
      const col = db.collection('drivers');
      const { _id, ...cleanData } = body;
      cleanData.id = id;
      cleanData.updatedAt = new Date().toISOString();
      await col.updateOne({ id }, { $set: cleanData }, { upsert: true });
      const updated = await col.findOne({ id });
      return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders() });
    }

    // Update Settings
    if (path === 'superadmin/settings' || path === 'admin/settings' || path === 'customer/settings') {
      const col = db.collection('settings');
      const { _id, ...cleanData } = body;
      await col.updateOne({ id: 'main_restaurant_settings' }, { $set: cleanData }, { upsert: true });
      return NextResponse.json({ success: true, data: cleanData }, { headers: corsHeaders() });
    }

    return NextResponse.json(
      { success: false, error: `Route not found: ${path}` },
      { status: 404, headers: corsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = (await context.params) || {};
  const path = slug.join('/');
  const { searchParams } = new URL(request.url);

  try {
    const db = await getDb();
    const body = await request.json().catch(() => ({}));

    // Toggle Category Active: superadmin/categories/:id/toggle-active
    if (slug[1] === 'categories' && slug[2] && slug[3] === 'toggle-active') {
      const id = slug[2];
      const col = db.collection('categories');
      const current = await col.findOne({ id });

      let nextActive = false;
      if (current) {
        nextActive = !current.isActive;
        await col.updateOne({ id }, { $set: { isActive: nextActive } });
      } else {
        const initial = initialCategories.find((c) => c.id === id);
        nextActive = initial ? !initial.isActive : false;
        await col.insertOne({
          ...(initial || { id, name: id }),
          isActive: nextActive,
        });
      }

      return NextResponse.json(
        { success: true, isActive: nextActive },
        { headers: corsHeaders() }
      );
    }

    // Toggle Product Availability: superadmin/products/:id/toggle-availability
    if (slug[1] === 'products' && slug[2] && slug[3] === 'toggle-availability') {
      const id = slug[2];
      const col = db.collection('products');
      const current = await col.findOne({ id });

      let nextAvailable = false;
      if (current) {
        nextAvailable = !current.isAvailable;
        await col.updateOne({ id }, { $set: { isAvailable: nextAvailable } });
      } else {
        const initial = initialProducts.find((p) => p.id === id);
        nextAvailable = initial ? !initial.isAvailable : false;
        await col.insertOne({
          ...(initial || { id, name: id }),
          isAvailable: nextAvailable,
        });
      }

      return NextResponse.json(
        { success: true, isAvailable: nextAvailable },
        { headers: corsHeaders() }
      );
    }

    // Update Order Status: superadmin/orders/:id/status
    if (slug[1] === 'orders' && slug[2] && slug[3] === 'status') {
      const id = slug[2];
      const { status } = body;
      const col = db.collection('orders');
      await col.updateOne({ id }, { $set: { orderStatus: status, updatedAt: new Date().toISOString() } });
      return NextResponse.json({ success: true, status }, { headers: corsHeaders() });
    }

    // Toggle/Update Admin / Staff Status: superadmin/admins/:id/status
    if ((slug[1] === 'admins' || slug[1] === 'staff') && slug[2] && slug[3] === 'status') {
      const id = slug[2];
      const col = db.collection('admins');
      const current = await col.findOne({ id });
      const nextStatus = body.status ? body.status : (current?.status === 'active' ? 'inactive' : 'active');
      await col.updateOne({ id }, { $set: { status: nextStatus, updatedAt: new Date().toISOString() } }, { upsert: true });
      return NextResponse.json({ success: true, status: nextStatus, id }, { headers: corsHeaders() });
    }

    // Update Admin / Staff Permissions: superadmin/admins/:id/permissions
    if ((slug[1] === 'admins' || slug[1] === 'staff') && slug[2] && slug[3] === 'permissions') {
      const id = slug[2];
      const col = db.collection('admins');
      const permissions = body.permissions || {};
      await col.updateOne({ id }, { $set: { permissions, updatedAt: new Date().toISOString() } }, { upsert: true });
      return NextResponse.json({ success: true, permissions, id }, { headers: corsHeaders() });
    }

    // Update Driver Status: superadmin/delivery-staff/:id/status
    if (slug[1] === 'delivery-staff' && slug[2] && slug[3] === 'status') {
      const id = slug[2];
      const col = db.collection('drivers');
      const status = body.status || 'available';
      await col.updateOne({ id }, { $set: { status, updatedAt: new Date().toISOString() } }, { upsert: true });
      return NextResponse.json({ success: true, status, id }, { headers: corsHeaders() });
    }

    // Toggle Customer Status: superadmin/customers/:id/status
    if (slug[1] === 'customers' && slug[2] && slug[3] === 'status') {
      const id = slug[2];
      const col = db.collection('customers');
      const current = await col.findOne({ id });
      const nextStatus = current?.status === 'active' ? 'inactive' : 'active';
      await col.updateOne({ id }, { $set: { status: nextStatus, updatedAt: new Date().toISOString() } }, { upsert: true });
      return NextResponse.json({ success: true, status: nextStatus, id }, { headers: corsHeaders() });
    }

    // Assign Driver to Order: superadmin/orders/:id/assign-driver
    if (slug[1] === 'orders' && slug[2] && slug[3] === 'assign-driver') {
      const id = slug[2];
      const { driverId, driverName } = body;
      const col = db.collection('orders');
      await col.updateOne(
        { id },
        {
          $set: {
            assignedDriverId: driverId,
            assignedDriverName: driverName,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      return NextResponse.json({ success: true, id, driverId, driverName }, { headers: corsHeaders() });
    }

    // Mark COD Paid: superadmin/orders/:id/mark-cod-paid
    if (slug[1] === 'orders' && slug[2] && slug[3] === 'mark-cod-paid') {
      const id = slug[2];
      const col = db.collection('orders');
      await col.updateOne({ id }, { $set: { paymentStatus: 'Paid (Cash Collected)', updatedAt: new Date().toISOString() } });
      return NextResponse.json({ success: true, id }, { headers: corsHeaders() });
    }

    // Delivery Boy: Update Order Status
    if (
      slug &&
      slug[0] === 'delivery-boy' &&
      slug[1] === 'orders' &&
      slug[2] &&
      slug[3] === 'status'
    ) {
      const id = slug[2];
      const newStatus = (body.status || '').toLowerCase().trim();
      const col = db.collection('orders');

      const updateFields: any = {
        orderStatus: newStatus,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === 'delivered' || newStatus === 'completed') {
        updateFields.deliveredAt = new Date().toISOString();
      }

      await col.updateOne(
        { $or: [{ id }, { orderId: id }] },
        { $set: updateFields }
      );

      return NextResponse.json(
        { success: true, orderId: id, status: newStatus },
        { headers: corsHeaders() }
      );
    }

    // Delivery Boy: Status Update (online / available / offline)
    if (path === 'delivery-boy/status') {
      const { driverId, status } = body || {};
      if (driverId && status) {
        const driversCol = db.collection('drivers');
        await driversCol.updateOne(
          { $or: [{ id: driverId }, { email: driverId.toLowerCase() }] },
          { $set: { status, updatedAt: new Date().toISOString() } }
        );
      }
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }


    return NextResponse.json(
      { success: false, error: `Route not found: ${path}` },
      { status: 404, headers: corsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = (await context.params) || {};
  const path = slug.join('/');

  try {
    const db = await getDb();

    // Delete Category: superadmin/categories/:id
    if (slug[1] === 'categories' && slug[2]) {
      const id = slug[2];
      const col = db.collection('categories');
      await col.deleteOne({ id });
      return NextResponse.json({ success: true, message: 'Category deleted' }, { headers: corsHeaders() });
    }

    // Delete Product: superadmin/products/:id
    if (slug[1] === 'products' && slug[2]) {
      const id = slug[2];
      const col = db.collection('products');
      await col.deleteOne({ id });
      return NextResponse.json({ success: true, message: 'Product deleted' }, { headers: corsHeaders() });
    }

    // Delete Admin / Staff: superadmin/admins/:id or admin/staff/:id
    if ((slug[1] === 'admins' || slug[1] === 'staff') && slug[2]) {
      const id = slug[2];
      const col = db.collection('admins');
      await col.deleteOne({ id });
      return NextResponse.json({ success: true, message: 'Admin account deleted' }, { headers: corsHeaders() });
    }

    // Delete Role: superadmin/roles/:id
    if (slug[1] === 'roles' && slug[2]) {
      const id = slug[2];
      const col = db.collection('roles');
      await col.deleteOne({ id });
      return NextResponse.json({ success: true, message: 'Role deleted' }, { headers: corsHeaders() });
    }

    // Delete Driver: superadmin/delivery-staff/:id
    if (slug[1] === 'delivery-staff' && slug[2]) {
      const id = slug[2];
      const col = db.collection('drivers');
      await col.deleteOne({ id });
      return NextResponse.json({ success: true, message: 'Driver deleted' }, { headers: corsHeaders() });
    }

    // Delete Customer: superadmin/customers/:id or admin/customers/:id
    if (slug[1] === 'customers' && slug[2]) {
      const id = slug[2];
      const col = db.collection('customers');
      await col.deleteOne({ id });
      return NextResponse.json({ success: true, message: 'Customer account deleted' }, { headers: corsHeaders() });
    }

    return NextResponse.json(
      { success: false, error: `Route not found: ${path}` },
      { status: 404, headers: corsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
