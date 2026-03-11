import mongoose, { Schema } from 'mongoose';

const emailOtpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code_hash: { type: String, required: true },
    expires_at: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

emailOtpSchema.index({ email: 1, created_at: -1 });
emailOtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema);
