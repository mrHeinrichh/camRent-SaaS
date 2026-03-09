import mongoose, { Schema } from 'mongoose';

const voucherSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    discount_amount: { type: Number, required: true, min: 0 },
    is_active: { type: Boolean, default: true },
    is_used: { type: Boolean, default: false },
    usages: {
      type: [
        {
          user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
          email: { type: String, default: '' },
          order_id: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
          used_at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

voucherSchema.index({ store_id: 1, code: 1 }, { unique: true });

export const Voucher = mongoose.model('Voucher', voucherSchema);
