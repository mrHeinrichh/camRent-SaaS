import { Store } from '../models/Store';

export async function enforceStoreDueDeactivation() {
  const now = new Date();
  await Store.updateMany(
    {
      status: 'approved',
      is_active: true,
      payment_due_date: { $ne: null, $lte: now },
    },
    { $set: { is_active: false } },
  );
}
