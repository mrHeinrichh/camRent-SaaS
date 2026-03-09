import mongoose, { Schema } from 'mongoose';

const storeReviewSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    renter_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    renter_name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

storeReviewSchema.index({ store_id: 1, renter_id: 1 }, { unique: true });

export const StoreReview = mongoose.model('StoreReview', storeReviewSchema);
