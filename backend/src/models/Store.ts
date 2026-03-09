import mongoose, { Schema } from 'mongoose';

const storeSchema = new Schema(
  {
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    logo_url: { type: String, default: '' },
    banner_url: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
    is_active: { type: Boolean, default: true },
    approved_at: { type: Date, default: null },
    payment_due_date: { type: Date, default: null },
    location_lat: { type: Number, default: null },
    location_lng: { type: Number, default: null },
    facebook_url: { type: String, default: '' },
    instagram_url: { type: String, default: '' },
    payment_details: { type: String, default: '' },
    payment_detail_images: { type: [String], default: [] },
    delivery_modes: { type: [String], default: [] },
    branches: {
      type: [
        {
          name: { type: String, default: '' },
          address: { type: String, required: true, trim: true },
          location_lat: { type: Number, default: null },
          location_lng: { type: Number, default: null },
        },
      ],
      default: [],
    },
    lease_agreement_file_url: { type: String, default: '' },
    rental_form_schema: {
      type: {
        version: { type: String, default: 'v1' },
        fields: { type: [Schema.Types.Mixed], default: [] },
      },
      default: { version: 'v1', fields: [] },
    },
    rental_form_settings: {
      type: {
        show_branch_map: { type: Boolean, default: true },
        reference_text: { type: String, default: '' },
        reference_image_url: { type: String, default: '' },
        reference_image_position: { type: String, enum: ['top', 'mid'], default: 'top' },
      },
      default: { show_branch_map: true, reference_text: '', reference_image_url: '', reference_image_position: 'top' },
    },
    security_deposit: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: false },
);

export const Store = mongoose.model('Store', storeSchema);
