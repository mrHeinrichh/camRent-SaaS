import mongoose, { InferSchemaType, Schema } from 'mongoose';

const orderSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    renter_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    renter_name: { type: String, required: true },
    renter_email: { type: String, default: '' },
    renter_phone: { type: String, default: '' },
    renter_emergency_contact_name: { type: String, default: '' },
    renter_emergency_contact: { type: String, default: '' },
    renter_address: { type: String, default: '' },
    store_branch_id: { type: String, default: '' },
    store_branch_name: { type: String, default: '' },
    store_branch_address: { type: String, default: '' },
    delivery_mode: { type: String, default: 'pickup' },
    delivery_address: { type: String, default: '' },
    delivery_fee: { type: Number, default: 0 },
    payment_mode: { type: String, default: 'cash' },
    payment_status: { type: String, default: 'pending' },
    lease_agreement_submission_url: { type: String, default: '' },
    custom_answers: { type: Schema.Types.Mixed, default: {} },
    form_schema_version: { type: String, default: 'v1' },
    total_amount: { type: Number, required: true },
    voucher_code: { type: String, default: '' },
    voucher_discount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'FRAUD_REPORTED', 'CANCELLED_BY_OWNER'],
      default: 'PENDING_REVIEW',
    },
    rejection_reason: { type: String, default: '' },
    fraud_flag: { type: Boolean, default: false },
    cancelled_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancellation_reason: { type: String, default: '' },
    reviewed_by_owner_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

export type OrderStatus = InferSchemaType<typeof orderSchema>['status'];
export const Order = mongoose.model('Order', orderSchema);
