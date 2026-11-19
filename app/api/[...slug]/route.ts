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
  initialRestaurantSettings,
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

function dedupeById<T extends { id?: string; _id?: any }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item?.id || String(item?._id);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join('/');
  const searchParams = request.nextUrl.searchParams;

  try {
    const db = await getDb();

    // 1. Health
    if (path === 'health') {
      return NextResponse.json(
        { success: true, status: 'online', database: 'connected', timestamp: new Date().toISOString() },
        { headers: corsHeaders() }
      );
    }

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
        items = initialProducts as any;
        if (categoryId && categoryId !== 'all') {
          items = items.filter((p: any) => p.categoryId === categoryId);
        }
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
    }

    // 4. Orders
    if (path === 'superadmin/orders' || path === 'admin/orders') {
      const col = db.collection('orders');
      let items = await col.find({}).sort({ createdAt: -1 }).toArray();
      if (!items || items.length === 0) {
        items = initialOrders as any;
      }
      return NextResponse.json(
        { success: true, data: dedupeById(items) },
        { headers: corsHeaders() }
      );
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
        settings = (await col.findOne({})) || (initialRestaurantSettings as any);
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
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
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
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join('/');

  try {
    const db = await getDb();
    const body = await request.json().catch(() => ({}));

    // Update Category: superadmin/categories/:id
    if (slug[1] === 'categories' && slug[2]) {
      const id = slug[2];
      const col = db.collection('categories');
      await col.updateOne({ id }, { $set: body }, { upsert: true });
      const updated = await col.findOne({ id });
      return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders() });
    }

    // Update Product: superadmin/products/:id
    if (slug[1] === 'products' && slug[2]) {
      const id = slug[2];
      const col = db.collection('products');
      await col.updateOne({ id }, { $set: body }, { upsert: true });
      const updated = await col.findOne({ id });
      return NextResponse.json({ success: true, data: updated }, { headers: corsHeaders() });
    }

    // Update Settings
    if (path === 'superadmin/settings' || path === 'admin/settings') {
      const col = db.collection('settings');
      await col.updateOne({ id: 'main_restaurant_settings' }, { $set: body }, { upsert: true });
      return NextResponse.json({ success: true, data: body }, { headers: corsHeaders() });
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
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
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
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
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
