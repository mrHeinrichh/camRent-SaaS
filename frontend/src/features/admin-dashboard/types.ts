export type AdminTab = 'stores' | 'customers' | 'fraud' | 'insights' | 'support' | 'announcements' | 'donations';

export interface EditFraudForm {
  full_name: string;
  email: string;
  contact_number: string;
  scope: 'internal' | 'global';
  status: 'approved' | 'pending';
  reason: string;
  evidence_image_url: string;
  requirement_files_text: string;
}
