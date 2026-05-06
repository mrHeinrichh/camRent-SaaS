import mongoose, { Schema } from 'mongoose';

const orderItemSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    item_id: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    start_time: { type: String, default: '' },
    end_time: { type: String, default: '' },
    price_per_day: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { timestamps: false },
);

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
