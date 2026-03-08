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
    location_lat: { type: Number, default: null },
    location_lng: { type: Number, default: null },
    rating: { type: Number, default: 0 },
  },
  { timestamps: false },
);

export const Store = mongoose.model('Store', storeSchema);
