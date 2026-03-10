import mongoose, { Schema } from 'mongoose';

const siteContentSchema = new Schema(
  {
    home: {
      badge: { type: String, default: '' },
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
    },
    policies: {
      sections: {
        type: [
          {
            title: { type: String, default: '' },
            body: { type: String, default: '' },
          },
        ],
        default: [],
      },
      faq_items: {
        type: [
          {
            q: { type: String, default: '' },
            a: { type: String, default: '' },
          },
        ],
        default: [],
      },
      rental_guide_items: {
        type: [String],
        default: [],
      },
    },
    footer: {
      about_text: { type: String, default: '' },
      about_links: {
        type: [
          {
            label: { type: String, default: '' },
            page: { type: String, default: '' },
            url: { type: String, default: '' },
            requires_login: { type: Boolean, default: false },
          },
        ],
        default: [],
      },
      policy_links: {
        type: [
          {
            label: { type: String, default: '' },
            page: { type: String, default: '' },
            url: { type: String, default: '' },
            requires_login: { type: Boolean, default: false },
          },
        ],
        default: [],
      },
      useful_links: {
        type: [
          {
            label: { type: String, default: '' },
            page: { type: String, default: '' },
            url: { type: String, default: '' },
            requires_login: { type: Boolean, default: false },
          },
        ],
        default: [],
      },
      social_links: {
        type: [
          {
            label: { type: String, default: '' },
            url: { type: String, default: '' },
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const SiteContent = mongoose.model('SiteContent', siteContentSchema);
