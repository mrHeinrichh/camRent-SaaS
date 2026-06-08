import mongoose, { Schema } from 'mongoose';

const itemSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    daily_price: { type: Number, required: true },
    deposit_amount: { type: Number, default: 0 },
    image_url: { type: String, default: '' },
    category: { type: String, default: '' },
    brand: { type: String, default: '' },
    stock: { type: Number, default: 1, min: 0 },
    is_available: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: false },
);

export const Item = mongoose.model('Item', itemSchema);
