import type { UserRole } from '@/src/types/domain';

export type RegisterRole = Extract<UserRole, 'renter' | 'owner'>;

export interface StoreBranchInput {
  name: string;
  address: string;
  location_lat: string;
  location_lng: string;
}

export interface RegisterFormState {
  fullName: string;
  email: string;
  password: string;
  role: RegisterRole;
  profileImage: File | null;
  storeName: string;
  storeAddress: string;
  storeDescription: string;
  storeBranches: StoreBranchInput[];
  facebookUrl: string;
  instagramUrl: string;
  paymentDetails: string;
  paymentDetailImages: File[];
  leaseAgreementFile: File | null;
  securityDeposit: string;
  deliveryModes: string[];
  storeLogo: File | null;
  storeBanner: File | null;
}
