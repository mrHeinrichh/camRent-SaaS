import mongoose, { Schema } from 'mongoose';

const itemSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    daily_price: { type: Number, required: true },
    deposit_amount: { type: Number, required: true },
    image_url: { type: String, default: '' },
    category: { type: String, default: '' },
  },
  { timestamps: false },
);

export const Item = mongoose.model('Item', itemSchema);
