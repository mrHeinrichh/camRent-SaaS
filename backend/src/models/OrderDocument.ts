import mongoose, { Schema } from 'mongoose';

const orderDocumentSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    document_type: { type: String, required: true },
    file_url: { type: String, required: true },
    verified_status: { type: String, default: 'pending' },
  },
  { timestamps: false },
);

export const OrderDocument = mongoose.model('OrderDocument', orderDocumentSchema);
