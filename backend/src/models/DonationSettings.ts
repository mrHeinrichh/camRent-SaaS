import mongoose, { Schema } from 'mongoose';

const donationSettingsSchema = new Schema(
  {
    message: { type: String, default: '' },
    qr_codes: {
      type: [
        {
          label: { type: String, default: '' },
          url: { type: String, default: '' },
        },
      ],
      default: [],
    },
    bank_details: {
      type: [
        {
          label: { type: String, default: '' },
          url: { type: String, default: '' },
        },
      ],
      default: [],
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const DonationSettings = mongoose.model('DonationSettings', donationSettingsSchema);
