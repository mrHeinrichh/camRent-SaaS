import mongoose, { Schema } from 'mongoose';

const supportTicketSchema = new Schema(
  {
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['feedback', 'support', 'bug'], default: 'feedback', required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    admin_reply: { type: String, default: '', trim: true },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
