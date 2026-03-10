import mongoose, { Schema } from 'mongoose';

const announcementSettingsSchema = new Schema(
  {
    is_enabled: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const AnnouncementSettings = mongoose.model('AnnouncementSettings', announcementSettingsSchema);
