import type { Server } from 'socket.io';
import { Notification } from '../models/Notification';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { serialize, toId } from '../utils/mongo';

let io: Server | null = null;

/** Called once at startup so notifications can be pushed over socket.io. */
export const setNotificationSocket = (server: Server) => {
  io = server;
};

export interface NotifyInput {
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  /** When set, the same key is silently skipped on a second attempt. */
  dedupeKey?: string;
}

/** Creates an in-app notification for a single user and emits a socket event. */
export async function notifyUser(userId: string, input: NotifyInput) {
  try {
    const doc: Record<string, unknown> = {
      user_id: toId(userId),
      type: input.type,
      title: input.title,
      body: input.body || '',
      data: input.data || {},
    };
    if (input.dedupeKey) doc.dedupe_key = input.dedupeKey;
    const notification = await Notification.create(doc);
    io?.emit('notification:new', { user_id: userId, notification: serialize(notification.toObject()) });
    return notification;
  } catch (error: any) {
    // 11000 = duplicate dedupe_key: the reminder was already delivered.
    if (error?.code !== 11000) {
      console.error('[notifications] failed to create notification', { type: input.type, message: error?.message });
    }
    return null;
  }
}

/** Notifies the owner of a store (merchant). */
export async function notifyStoreOwner(storeId: string, input: NotifyInput) {
  const store = await Store.findById(storeId).select('owner_id').lean();
  if (!store?.owner_id) return null;
  return notifyUser(store.owner_id.toString(), input);
}

/** Notifies every active super admin account. */
export async function notifyAdmins(input: NotifyInput) {
  const admins = await User.find({ role: 'admin', is_active: true, is_deleted: { $ne: true } })
    .select('_id')
    .lean();
  await Promise.all(
    admins.map((admin) =>
      notifyUser(admin._id.toString(), {
        ...input,
        dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${admin._id.toString()}` : undefined,
      }),
    ),
  );
}

/**
 * Resolves the user account behind an order's customer. Orders keep a nullable
 * renter_id, so fall back to matching the renter email against registered users.
 */
export async function resolveOrderCustomerId(order: {
  renter_id?: unknown;
  renter_email?: string | null;
}): Promise<string | null> {
  if (order.renter_id) return String(order.renter_id);
  const email = String(order.renter_email || '').trim().toLowerCase();
  if (!email) return null;
  const user = await User.findOne({ email, is_deleted: { $ne: true } }).select('_id').lean();
  return user ? user._id.toString() : null;
}

/** Notifies the customer who placed an order, when they have an account. */
export async function notifyOrderCustomer(
  order: { renter_id?: unknown; renter_email?: string | null },
  input: NotifyInput,
) {
  const customerId = await resolveOrderCustomerId(order);
  if (!customerId) return null;
  return notifyUser(customerId, input);
}
