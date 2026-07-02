import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Store } from '../models/Store';
import { formatOrderRef } from '../utils/orderRef';
import { notifyAdmins, notifyOrderCustomer, notifyStoreOwner } from './notificationService';

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;
const MANILA_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Today's calendar date (YYYY-MM-DD) in Philippine time, matching the booking date strings. */
const manilaToday = () => new Date(Date.now() + MANILA_UTC_OFFSET_MS).toISOString().slice(0, 10);

const addDays = (ymd: string, days: number) => {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Periodically scans active bookings and delivers time-based reminders:
 * pickup (day before + day of), return (day before + day of) and overdue
 * returns. Each reminder carries a dedupe key so it fires at most once per
 * order even across server restarts.
 */
export function startReminderScheduler() {
  const run = () =>
    runReminderSweep().catch((error) => console.error('[reminders] sweep failed', error?.message || error));
  run();
  setInterval(run, SWEEP_INTERVAL_MS);
}

export async function runReminderSweep() {
  const today = manilaToday();
  const tomorrow = addDays(today, 1);

  const orders = await Order.find({ status: { $in: ['APPROVED', 'ONGOING'] } }).lean();
  if (!orders.length) return;

  const orderItems = await OrderItem.find({ order_id: { $in: orders.map((order) => order._id) } }).lean();
  const itemsByOrder = new Map<string, typeof orderItems>();
  for (const item of orderItems) {
    const key = item.order_id.toString();
    const bucket = itemsByOrder.get(key);
    if (bucket) bucket.push(item);
    else itemsByOrder.set(key, [item]);
  }

  const storeIds = [...new Set(orders.map((order) => order.store_id.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).select('name').lean();
  const storeNames = new Map(stores.map((store) => [store._id.toString(), store.name]));

  for (const order of orders) {
    const items = itemsByOrder.get(order._id.toString()) || [];
    if (!items.length) continue;

    const startDate = items.map((item) => item.start_date).sort()[0];
    const endDate = items.map((item) => item.end_date).sort().at(-1)!;
    const orderId = order._id.toString();
    const storeId = order.store_id.toString();
    const storeName = storeNames.get(storeId) || 'the store';
    const orderRef = formatOrderRef(orderId);
    const data = { order_id: orderId, store_id: storeId };
    const gearCount = items.reduce((sum, item) => sum + Math.max(1, Number((item as any).quantity) || 1), 0);
    const gearLabel = `${gearCount} gear item${gearCount === 1 ? '' : 's'}`;

    if (startDate === tomorrow) {
      await notifyOrderCustomer(order, {
        type: 'pickup_reminder',
        title: 'Your rental starts tomorrow',
        body: `Booking ${orderRef}: ${gearLabel} from ${storeName}. Pickup/delivery is scheduled for ${startDate}.`,
        data,
        dedupeKey: `pickup_tomorrow:${orderId}`,
      });
      await notifyStoreOwner(storeId, {
        type: 'pickup_reminder',
        title: 'Booking starts tomorrow',
        body: `${order.renter_name}'s booking ${orderRef} (${gearLabel}) starts on ${startDate}. Prepare the gear.`,
        data,
        dedupeKey: `pickup_tomorrow_owner:${orderId}`,
      });
    }

    if (startDate === today) {
      await notifyOrderCustomer(order, {
        type: 'pickup_reminder',
        title: 'Your rental starts today',
        body: `Booking ${orderRef}: ${gearLabel} from ${storeName} is ready today. Bring a valid ID for pickup.`,
        data,
        dedupeKey: `pickup_today:${orderId}`,
      });
      await notifyStoreOwner(storeId, {
        type: 'pickup_reminder',
        title: 'Booking starts today',
        body: `${order.renter_name} is picking up booking ${orderRef} (${gearLabel}) today.`,
        data,
        dedupeKey: `pickup_today_owner:${orderId}`,
      });
    }

    if (endDate === tomorrow) {
      await notifyOrderCustomer(order, {
        type: 'return_reminder',
        title: 'Return reminder: gear due tomorrow',
        body: `Booking ${orderRef}: please return the ${gearLabel} to ${storeName} by ${endDate}.`,
        data,
        dedupeKey: `return_tomorrow:${orderId}`,
      });
      await notifyStoreOwner(storeId, {
        type: 'return_reminder',
        title: 'Return due tomorrow',
        body: `${order.renter_name} is due to return booking ${orderRef} (${gearLabel}) on ${endDate}.`,
        data,
        dedupeKey: `return_tomorrow_owner:${orderId}`,
      });
    }

    if (endDate === today) {
      await notifyOrderCustomer(order, {
        type: 'return_reminder',
        title: 'Return your gear today',
        body: `Booking ${orderRef}: the ${gearLabel} from ${storeName} is due back today. Thanks for renting with us!`,
        data,
        dedupeKey: `return_today:${orderId}`,
      });
      await notifyStoreOwner(storeId, {
        type: 'return_reminder',
        title: 'Return due today',
        body: `${order.renter_name} should return booking ${orderRef} (${gearLabel}) today.`,
        data,
        dedupeKey: `return_today_owner:${orderId}`,
      });
    }

    if (endDate < today) {
      await notifyOrderCustomer(order, {
        type: 'return_overdue',
        title: 'Gear return overdue',
        body: `Booking ${orderRef}: the ${gearLabel} was due back to ${storeName} on ${endDate}. Please return it as soon as possible.`,
        data,
        dedupeKey: `overdue:${orderId}`,
      });
      await notifyStoreOwner(storeId, {
        type: 'return_overdue',
        title: 'Overdue return',
        body: `${order.renter_name} has not returned booking ${orderRef} (${gearLabel}), due ${endDate}. Follow up with the renter.`,
        data,
        dedupeKey: `overdue_owner:${orderId}`,
      });
      await notifyAdmins({
        type: 'return_overdue',
        title: 'Overdue rental return',
        body: `Booking ${orderRef} at ${storeName} by ${order.renter_name} is overdue since ${endDate}.`,
        data,
        dedupeKey: `overdue_admin:${orderId}`,
      });
    }
  }
}
