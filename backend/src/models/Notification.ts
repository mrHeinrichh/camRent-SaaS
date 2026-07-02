import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    data: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    // Set for scheduled reminders so a reminder is delivered at most once per
    // order/kind/recipient even across scheduler restarts.
    dedupe_key: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index(
  { dedupe_key: 1 },
  { unique: true, partialFilterExpression: { dedupe_key: { $type: 'string' } } },
);

export const Notification = mongoose.model('Notification', notificationSchema);
