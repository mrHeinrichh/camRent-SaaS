import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'renter' },
    full_name: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

export const User = mongoose.model('User', userSchema);
