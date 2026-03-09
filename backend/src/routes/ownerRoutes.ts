import { Router } from 'express';
import { registerOwnerDashboardRoutes } from './owner/dashboardRoutes';
import { registerOwnerFraudRoutes } from './owner/fraudRoutes';
import { registerOwnerRentalFormRoutes } from './owner/rentalFormRoutes';
import { registerOwnerStoreProfileRoutes } from './owner/storeProfileRoutes';
import { registerOwnerSupportRoutes } from './owner/supportRoutes';
import { registerOwnerVoucherRoutes } from './owner/voucherRoutes';

export const ownerRoutes = Router();

registerOwnerFraudRoutes(ownerRoutes);
registerOwnerSupportRoutes(ownerRoutes);
registerOwnerRentalFormRoutes(ownerRoutes);
registerOwnerStoreProfileRoutes(ownerRoutes);
registerOwnerDashboardRoutes(ownerRoutes);
registerOwnerVoucherRoutes(ownerRoutes);
