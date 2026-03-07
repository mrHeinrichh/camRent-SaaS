import { Item } from '../models/Item';
import { ManualBlock } from '../models/ManualBlock';
import { Order, type OrderStatus } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { intervalsOverlap } from '../utils/dates';
import { toId } from '../utils/mongo';

export async function hasBookingConflict(itemId: string, startDate: string, endDate: string, excludedOrderId?: string) {
  const bookedStatuses: OrderStatus[] = ['APPROVED', 'ONGOING'];
  const existingOrderItems = await OrderItem.find({ item_id: toId(itemId) }).lean();

  for (const orderItem of existingOrderItems) {
    if (excludedOrderId && orderItem.order_id.toString() === excludedOrderId) continue;
    const order = await Order.findById(orderItem.order_id).lean();
    if (!order || !bookedStatuses.includes(order.status)) continue;
    if (intervalsOverlap(orderItem.start_date, orderItem.end_date, startDate, endDate)) return true;
  }

  const blocks = await ManualBlock.find({ item_id: toId(itemId) }).lean();
  return blocks.some((block) => intervalsOverlap(block.start_date, block.end_date, startDate, endDate));
}

export async function getOwnerInventory(ownerId: string) {
  const ownedItems = await Item.find().lean();
  return ownedItems.filter(Boolean);
}
