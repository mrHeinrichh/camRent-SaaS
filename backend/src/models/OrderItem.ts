import mongoose, { Schema } from 'mongoose';

const orderItemSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    item_id: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    price_per_day: { type: Number, required: true },
  },
  { timestamps: false },
);

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
