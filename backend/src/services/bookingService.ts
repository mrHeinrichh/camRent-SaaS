import { Item } from '../models/Item';
import { ManualBlock } from '../models/ManualBlock';
import { Order, type OrderStatus } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { intervalsOverlap } from '../utils/dates';
import { toId } from '../utils/mongo';

export async function hasBookingConflict(itemId: string, startDate: string, endDate: string, excludedOrderId?: string) {
  const bookedStatuses: OrderStatus[] = ['APPROVED', 'ONGOING'];
  const item = await Item.findById(toId(itemId)).lean();
  if (!item || item.is_available === false) return true;
  const availableStock = Math.max(0, Number(item.stock) || 0);
  if (availableStock <= 0) return true;

  const existingOrderItems = await OrderItem.find({ item_id: toId(itemId) }).lean();
  let reservedUnits = 0;

  for (const orderItem of existingOrderItems) {
    if (excludedOrderId && orderItem.order_id.toString() === excludedOrderId) continue;
    const order = await Order.findById(orderItem.order_id).lean();
    if (!order || !bookedStatuses.includes(order.status)) continue;
    if (intervalsOverlap(orderItem.start_date, orderItem.end_date, startDate, endDate)) {
      reservedUnits += Math.max(1, Number((orderItem as any).quantity) || 1);
    }
  }

  if (reservedUnits >= availableStock) return true;

  const blocks = await ManualBlock.find({ item_id: toId(itemId) }).lean();
  return blocks.some((block) => intervalsOverlap(block.start_date, block.end_date, startDate, endDate));
}

export async function hasBookingConflictForQuantity(
  itemId: string,
  startDate: string,
  endDate: string,
  requestedQuantity: number,
  excludedOrderId?: string,
) {
  const bookedStatuses: OrderStatus[] = ['APPROVED', 'ONGOING'];
  const item = await Item.findById(toId(itemId)).lean();
  if (!item || item.is_available === false) return true;
  const availableStock = Math.max(0, Number(item.stock) || 0);
  const requested = Math.max(1, Number(requestedQuantity) || 1);
  if (requested > availableStock) return true;

  const existingOrderItems = await OrderItem.find({ item_id: toId(itemId) }).lean();
  let reservedUnits = 0;

  for (const orderItem of existingOrderItems) {
    if (excludedOrderId && orderItem.order_id.toString() === excludedOrderId) continue;
    const order = await Order.findById(orderItem.order_id).lean();
    if (!order || !bookedStatuses.includes(order.status)) continue;
    if (intervalsOverlap(orderItem.start_date, orderItem.end_date, startDate, endDate)) {
      reservedUnits += Math.max(1, Number((orderItem as any).quantity) || 1);
    }
  }
  if (reservedUnits + requested > availableStock) return true;

  const blocks = await ManualBlock.find({ item_id: toId(itemId) }).lean();
  return blocks.some((block) => intervalsOverlap(block.start_date, block.end_date, startDate, endDate));
}

export async function getOwnerInventory(ownerId: string) {
  const ownedItems = await Item.find().lean();
  return ownedItems.filter(Boolean);
}
