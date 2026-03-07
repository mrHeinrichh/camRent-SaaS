import mongoose, { Schema } from 'mongoose';

const fraudListSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    full_name: { type: String, default: '' },
    email: { type: String, default: '' },
    contact_number: { type: String, default: '' },
    billing_address: { type: String, default: '' },
    id_number: { type: String, default: '' },
    reason: { type: String, default: '' },
    reported_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

export const FraudList = mongoose.model('FraudList', fraudListSchema);
