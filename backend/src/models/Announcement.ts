import mongoose, { Schema } from 'mongoose';

const announcementSchema = new Schema(
  {
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    image_url: { type: String, default: '', trim: true },
    cta_label: { type: String, default: '', trim: true },
    cta_url: { type: String, default: '', trim: true },
    is_active: { type: Boolean, default: true, index: true },
    sort_order: { type: Number, default: 0, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
