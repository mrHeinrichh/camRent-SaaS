import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'renter' },
    full_name: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

export const User = mongoose.model('User', userSchema);
