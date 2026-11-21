import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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
      const query: any = {};
      if (email) query.customerEmail = email;
      if (phone) query.customerPhone = phone;

      let items = await col.find(query).sort({ createdAt: -1 }).toArray();
      if (!items || items.length === 0) {
        items = initialOrders as any;
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
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
      const order = await col.findOne({ id: orderId });
      if (order) {
        return NextResponse.json({ success: true, data: order, order }, { headers: corsHeaders() });
      }
      const fallback = initialOrders.find((o) => o.id === orderId);
      return NextResponse.json({ success: true, data: fallback, order: fallback }, { headers: corsHeaders() });
    }

    // 5. Admins
    if (path === 'superadmin/admins' || path === 'admin/admins' || path === 'admin/staff') {
      const col = db.collection('admins');
      let items = await col.find({}).toArray();
      if (!items || items.length === 0) {
        items = initialAdminAccounts as any;
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
    }

    // 6. Roles
    if (path === 'superadmin/roles') {
      const col = db.collection('roles');
      let items = await col.find({}).toArray();
      if (!items || items.length === 0) {
        items = initialCustomRoles as any;
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
    }

    // 7. Delivery Staff
    if (path === 'superadmin/delivery-staff' || path === 'admin/delivery-staff') {
      const col = db.collection('drivers');
      let items = await col.find({}).toArray();
      if (!items || items.length === 0) {
        items = initialDrivers as any;
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
    }

    // 8. Customers
    if (path === 'superadmin/customers' || path === 'admin/customers') {
      const col = db.collection('customers');
      let items = await col.find({}).toArray();
      if (!items || items.length === 0) {
        items = initialCustomers as any;
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
    }

    // 9. Settings
    if (path === 'superadmin/settings' || path === 'admin/settings') {
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

    // 10. Dashboard
    if (path === 'superadmin/dashboard' || path === 'admin/dashboard') {
      const ordersCol = db.collection('orders');
      const orders = await ordersCol.find({}).toArray();
      const allOrders = orders.length > 0 ? orders : initialOrders;

      const totalRevenue = allOrders
        .filter((o: any) => o.paymentStatus === 'paid' || o.orderStatus === 'delivered' || o.orderStatus === 'completed')
        .reduce((sum: number, o: any) => sum + (Number(o.totalBsd) || 0), 0);

      return NextResponse.json(
        {
          success: true,
          data: {
            totalRevenueBsd: Number(totalRevenue.toFixed(2)),
            todayOrdersCount: allOrders.length,
            activeDeliveriesCount: allOrders.filter((o: any) => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'preparing').length,
            pendingOrdersCount: allOrders.filter((o: any) => o.orderStatus === 'pending' || o.orderStatus === 'processing').length,
          },
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = (await context.params) || {};
  const path = slug.join('/');

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
        assignedDriverId: cleanBody.assignedDriverId || 'drv-01',
        assignedDriverName: cleanBody.assignedDriverName || 'Leo Santos (Tropical Courier)',
        estimatedDeliveryTime: cleanBody.estimatedDeliveryTime || '25-35 mins',
        barcodeValue: cleanBody.barcodeValue || `${orderId}-BC`,
        qrCodeValue: cleanBody.qrCodeValue || `https://tropicalgyros.demo/order/${orderId}`,
      };

      await col.updateOne({ id: orderId }, { $set: newOrder }, { upsert: true });

      return NextResponse.json(
        { success: true, order: newOrder, data: newOrder },
        { status: 201, headers: corsHeaders() }
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

    // Update Settings
    if (path === 'superadmin/settings' || path === 'admin/settings') {
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
