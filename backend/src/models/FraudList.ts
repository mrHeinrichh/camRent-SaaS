import mongoose, { Schema } from 'mongoose';

const fraudListSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    scope: { type: String, enum: ['internal', 'global'], default: 'internal' },
    status: { type: String, enum: ['approved', 'pending'], default: 'approved' },
    full_name: { type: String, default: '' },
    email: { type: String, default: '' },
    contact_number: { type: String, default: '' },
    billing_address: { type: String, default: '' },
    id_number: { type: String, default: '' },
    id_numbers: { type: [String], default: [] },
    billing_address_file_url: { type: String, default: '' },
    requirement_files: {
      type: [
        {
          type: { type: String, default: '' },
          url: { type: String, default: '' },
        },
      ],
      default: [],
    },
    reason: { type: String, default: '' },
    evidence_image_url: { type: String, default: '' },
    global_request_reason: { type: String, default: '' },
    reported_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approved_by_admin: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

export const FraudList = mongoose.model('FraudList', fraudListSchema);
