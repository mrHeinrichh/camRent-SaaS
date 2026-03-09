import type { Router } from 'express';
import { authenticate, checkRole } from '../../middleware/auth';
import { FraudList } from '../../models/FraudList';
import { Item } from '../../models/Item';
import { Order } from '../../models/Order';
import { OrderDocument } from '../../models/OrderDocument';
import { OrderItem } from '../../models/OrderItem';
import { Store } from '../../models/Store';
import { StoreReview } from '../../models/StoreReview';
import type { AuthedRequest } from '../../types/auth';
import { serialize, serializeMany, toId } from '../../utils/mongo';

export function registerOwnerDashboardRoutes(router: Router) {
  const normalizeComparable = (value: unknown) => String(value || '').trim().toLowerCase();

  router.get('/dashboard/owner', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const storeDoc = await Store.findOne({ owner_id: toId(req.user!.id) });
    if (!storeDoc) {
      console.warn('[owner] dashboard requested without store', {
        ownerId: req.user!.id,
        email: req.user!.email,
      });
      return res.status(404).json({ error: 'No store found for this owner account' });
    }
    if (storeDoc.status === 'approved' && !storeDoc.approved_at) {
      const derivedApprovedAt =
        storeDoc.payment_due_date instanceof Date
          ? new Date(new Date(storeDoc.payment_due_date).setMonth(new Date(storeDoc.payment_due_date).getMonth() - 1))
          : new Date();
      storeDoc.approved_at = derivedApprovedAt;
      if (!storeDoc.payment_due_date) {
        const dueDate = new Date(derivedApprovedAt);
        dueDate.setMonth(dueDate.getMonth() + 1);
        storeDoc.payment_due_date = dueDate;
      }
      await storeDoc.save();
    }
    const store = storeDoc.toObject();

    const orders = await Order.find({ store_id: store._id }).sort({ created_at: -1 }).lean();
    const items = await Item.find({ store_id: store._id }).lean();
    const recentOrders = orders.slice(0, 10);
    const allOrderIds = orders.map((order) => order._id);
    const allDocs = await OrderDocument.find({ order_id: { $in: allOrderIds } }).lean();
    const docsByOrder = new Map<string, string[]>();
    const docEntriesByOrder = new Map<string, Array<{ type: string; url: string }>>();
    for (const doc of allDocs) {
      const key = doc.order_id.toString();
      docsByOrder.set(key, [...(docsByOrder.get(key) || []), doc.document_type]);
      docEntriesByOrder.set(key, [
        ...(docEntriesByOrder.get(key) || []),
        {
          type: doc.document_type,
          url: String((doc as any).file_url || '').trim(),
        },
      ]);
    }
    for (const order of orders) {
      const key = order._id.toString();
      if (order.lease_agreement_submission_url && String(order.lease_agreement_submission_url).trim()) {
        docEntriesByOrder.set(key, [
          ...(docEntriesByOrder.get(key) || []),
          {
            type: 'LEASE_AGREEMENT_SUBMISSION',
            url: String(order.lease_agreement_submission_url).trim(),
          },
        ]);
        docsByOrder.set(key, [...(docsByOrder.get(key) || []), 'LEASE_AGREEMENT_SUBMISSION']);
      }
    }

    const allOrderItems = await OrderItem.find({ order_id: { $in: allOrderIds } }).lean();
    const storeReviews = await StoreReview.find({ store_id: store._id }).sort({ created_at: -1 }).lean();
    const orderItemsByOrder = new Map<string, typeof allOrderItems>();
    for (const orderItem of allOrderItems) {
      const key = orderItem.order_id.toString();
      const existing = orderItemsByOrder.get(key) || [];
      existing.push(orderItem);
      orderItemsByOrder.set(key, existing);
    }
    const itemIds = allOrderItems.map((orderItem) => orderItem.item_id);
    const rentedItems = await Item.find({ _id: { $in: itemIds } }).lean();
    const rentedItemById = new Map(rentedItems.map((item) => [item._id.toString(), item]));

    const customerMap = new Map<
      string,
      {
        renter_name: string;
        renter_email: string;
        renter_phone: string;
        renter_address: string;
        transaction_count: number;
        id_types: string[];
        requirement_docs: Map<string, string>;
        gearCount: Map<string, number>;
        transactions: Array<{
          id: string;
          status: string;
          total_amount: number;
          created_at: Date | string;
          payment_mode: string;
          delivery_mode: string;
          renter_address: string;
          store_branch_name: string;
          store_branch_address: string;
          items: Array<{ name: string; description: string; start_date: string; end_date: string; quantity: number }>;
          documents: Array<{ type: string; url: string }>;
        }>;
      }
    >();
    for (const order of orders) {
      const key = order.renter_email || `order-${order._id.toString()}`;
      const existing = customerMap.get(key) || {
        renter_name: order.renter_name,
        renter_email: order.renter_email,
        renter_phone: order.renter_phone,
        renter_address: order.renter_address,
        transaction_count: 0,
        id_types: [],
        requirement_docs: new Map<string, string>(),
        gearCount: new Map<string, number>(),
        transactions: [],
      };
      existing.transaction_count += 1;
      const orderDocTypes = docsByOrder.get(order._id.toString()) || [];
      existing.id_types = [...new Set([...existing.id_types, ...orderDocTypes])];
      const orderDocEntries = docEntriesByOrder.get(order._id.toString()) || [];
      for (const docEntry of orderDocEntries) {
        if (docEntry.type && docEntry.url && !existing.requirement_docs.has(docEntry.type)) {
          existing.requirement_docs.set(docEntry.type, docEntry.url);
        }
      }
      const orderItems = orderItemsByOrder.get(order._id.toString()) || [];
      const transactionItems: Array<{ name: string; description: string; start_date: string; end_date: string; quantity: number }> = [];
      for (const orderItem of orderItems) {
        const name = rentedItemById.get(orderItem.item_id.toString())?.name || 'Unknown Gear';
        existing.gearCount.set(name, (existing.gearCount.get(name) || 0) + 1);
        transactionItems.push({
          name,
          description: String(rentedItemById.get(orderItem.item_id.toString())?.description || ''),
          start_date: new Date(orderItem.start_date).toISOString(),
          end_date: new Date(orderItem.end_date).toISOString(),
          quantity: Math.max(1, Number((orderItem as any).quantity) || 1),
        });
      }
      existing.transactions.push({
        id: order._id.toString(),
        status: order.status,
        total_amount: order.total_amount,
        created_at: new Date(order.created_at).toISOString(),
        payment_mode: String((order as any).payment_mode || ''),
        delivery_mode: String((order as any).delivery_mode || ''),
        renter_address: String((order as any).renter_address || ''),
        store_branch_name: String((order as any).store_branch_name || ''),
        store_branch_address: String((order as any).store_branch_address || ''),
        items: transactionItems,
        documents: orderDocEntries,
      });
      customerMap.set(key, existing);
    }

    const stats = {
      total_rentals: orders.length,
      total_revenue: orders.reduce((sum, order) => (['APPROVED', 'COMPLETED'].includes(order.status) ? sum + order.total_amount : sum), 0),
    };
    const successfulStatuses = new Set(['APPROVED', 'ONGOING', 'COMPLETED']);
    const activeRentStatuses = new Set(['APPROVED', 'ONGOING']);
    const excludedPeakStatuses = new Set(['REJECTED', 'CANCELLED', 'CANCELLED_BY_OWNER', 'FRAUD_REPORTED']);
    const uniqueCustomerEmails = new Set(orders.map((order) => order.renter_email).filter(Boolean));
    const totalSuccessfulRentals = orders.filter((order) => successfulStatuses.has(order.status)).length;
    const totalProfit = orders.reduce((sum, order) => (successfulStatuses.has(order.status) ? sum + order.total_amount : sum), 0);
    const pendingCount = orders.filter((order) => order.status === 'PENDING_REVIEW').length;
    const reservedCount = orders.filter((order) => activeRentStatuses.has(order.status)).length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const topRenterCounter = new Map<
      string,
      {
        renter_name: string;
        renter_email: string;
        rentals: number;
        amount: number;
      }
    >();

    const peakDateCounter = new Map<string, number>();
    const mostRentedCameraCounter = new Map<string, number>();
    const mostRentedIncludeStatuses = new Set(['APPROVED', 'ONGOING', 'COMPLETED']);
    for (const order of orders) {
      if (excludedPeakStatuses.has(order.status)) continue;
      const createdAt = new Date(order.created_at as any);
      if (createdAt >= monthStart && createdAt < monthEnd && successfulStatuses.has(order.status)) {
        const key = String(order.renter_email || '').trim().toLowerCase() || `anon-${order._id.toString()}`;
        const current = topRenterCounter.get(key) || {
          renter_name: String(order.renter_name || 'Unknown Renter'),
          renter_email: String(order.renter_email || ''),
          rentals: 0,
          amount: 0,
        };
        current.rentals += 1;
        current.amount += Number(order.total_amount) || 0;
        topRenterCounter.set(key, current);
      }
      const linkedItems = orderItemsByOrder.get(order._id.toString()) || [];
      for (const linkedItem of linkedItems) {
        const start = new Date(linkedItem.start_date);
        const end = new Date(linkedItem.end_date);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
        const cursor = new Date(start);
        while (cursor <= end) {
          const key = cursor.toISOString().slice(0, 10);
          peakDateCounter.set(key, (peakDateCounter.get(key) || 0) + 1);
          cursor.setDate(cursor.getDate() + 1);
        }
        if (mostRentedIncludeStatuses.has(order.status)) {
          const item = rentedItemById.get(linkedItem.item_id.toString());
          const category = String(item?.category || '').toLowerCase();
          if (!category.includes('camera')) continue;
          const itemName = item?.name || 'Unknown Camera';
          mostRentedCameraCounter.set(itemName, (mostRentedCameraCounter.get(itemName) || 0) + Math.max(1, Number((linkedItem as any).quantity) || 1));
        }
      }
    }
    const peakRentalDates = [...peakDateCounter.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const mostRentedCameras = [...mostRentedCameraCounter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const topRentersOfMonth = [...topRenterCounter.values()]
      .sort((a, b) => (b.rentals === a.rentals ? b.amount - a.amount : b.rentals - a.rentals))
      .slice(0, 10);

    res.json({
      store: serialize(store as any),
      stats,
      recentOrders: serializeMany(recentOrders as any[]),
      recentTransactions: recentOrders.map((order) => {
        const orderItems = orderItemsByOrder.get(order._id.toString()) || [];
        const itemRanges = orderItems
          .map((orderItem) => ({
            name: rentedItemById.get(orderItem.item_id.toString())?.name || 'Unknown Gear',
            description: String(rentedItemById.get(orderItem.item_id.toString())?.description || ''),
            start_date: new Date(orderItem.start_date).toISOString(),
            end_date: new Date(orderItem.end_date).toISOString(),
            quantity: Math.max(1, Number((orderItem as any).quantity) || 1),
          }))
          .sort((a, b) => a.start_date.localeCompare(b.start_date));
        const firstRange = itemRanges[0];
        const lastRange = itemRanges[itemRanges.length - 1];
        return {
          ...(serialize(order as any) as Record<string, unknown>),
          id_types: docsByOrder.get(order._id.toString()) || [],
          documents: docEntriesByOrder.get(order._id.toString()) || [],
          items: itemRanges,
          start_date: firstRange?.start_date || null,
          end_date: lastRange?.end_date || null,
        };
      }),
      customers: [...customerMap.values()].map((customer) => ({
        renter_name: customer.renter_name,
        renter_email: customer.renter_email,
        renter_phone: customer.renter_phone,
        renter_address: customer.renter_address,
        transaction_count: customer.transaction_count,
        id_types: customer.id_types,
        requirements: [...customer.requirement_docs.entries()].map(([type, url]) => ({ type, url })),
        mostly_rented_gears: [...customer.gearCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count })),
        transactions: customer.transactions
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .map((transaction) => ({
            ...transaction,
            created_at: String(transaction.created_at),
          })),
      })),
      ownerAnalytics: {
        totalCustomers: uniqueCustomerEmails.size,
        totalCustomersRented: totalSuccessfulRentals,
        totalProfit,
        pendingCount,
        reservedCount,
        peakRentalDates,
        mostRentedCameras,
        topRentersOfMonth,
      },
      storeRatings: storeReviews.map((review) => ({
        renter_name: String((review as any).renter_name || 'Customer'),
        rating: Number((review as any).rating || 0),
        description: String((review as any).description || ''),
        created_at: (review as any).created_at ? new Date((review as any).created_at).toISOString() : '',
      })),
      items: serializeMany(items as any[]),
    });
  });

  router.get('/owner/applications', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
    if (!store) {
      console.warn('[owner] applications requested without store', {
        ownerId: req.user!.id,
        email: req.user!.email,
      });
      return res.status(404).json({ error: 'No store found for this owner account' });
    }

    const orders = await Order.find({ store_id: store._id }).sort({ created_at: -1 }).lean();
    const fraudEntries = await FraudList.find({
      $or: [{ scope: 'internal', store_id: store._id }, { scope: 'global', status: 'approved' }],
    }).lean();
    const fraudMatchKeySet = new Set(
      fraudEntries.map((entry) => `${normalizeComparable(entry.full_name)}|${normalizeComparable(entry.email)}|${normalizeComparable(entry.contact_number)}`),
    );
    const payload = [];

    for (const order of orders) {
      const orderItems = await OrderItem.find({ order_id: order._id }).lean();
      const orderDocuments = await OrderDocument.find({ order_id: order._id }).lean();
      const itemIds = orderItems.map((item) => item.item_id);
      const items = await Item.find({ _id: { $in: itemIds } }).lean();
      const itemsById = new Map(items.map((item) => [item._id.toString(), item]));

      payload.push({
        ...(serialize(order as any) as Record<string, unknown>),
        fraud_flag:
          Boolean((order as any).fraud_flag) ||
          fraudMatchKeySet.has(`${normalizeComparable(order.renter_name)}|${normalizeComparable(order.renter_email)}|${normalizeComparable(order.renter_phone)}`),
        items: orderItems.map((orderItem) => ({
          id: orderItem.item_id.toString(),
          name: itemsById.get(orderItem.item_id.toString())?.name || '',
          description: itemsById.get(orderItem.item_id.toString())?.description || '',
          image_url: itemsById.get(orderItem.item_id.toString())?.image_url || '',
          start_date: orderItem.start_date,
          end_date: orderItem.end_date,
          quantity: Math.max(1, Number((orderItem as any).quantity) || 1),
        })),
        documents: [
          ...orderDocuments.map((doc: any) => ({
            type: String(doc.document_type || ''),
            url: String(doc.file_url || ''),
          })),
          ...(order.lease_agreement_submission_url && String(order.lease_agreement_submission_url).trim()
            ? [
                {
                  type: 'LEASE_AGREEMENT_SUBMISSION',
                  url: String(order.lease_agreement_submission_url).trim(),
                },
              ]
            : []),
        ],
      });
    }

    res.json(payload);
  });
}
