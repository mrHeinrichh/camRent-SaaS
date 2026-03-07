import mongoose, { Schema } from 'mongoose';

const manualBlockSchema = new Schema(
  {
    item_id: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    reason: { type: String, default: '' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

export const ManualBlock = mongoose.model('ManualBlock', manualBlockSchema);
