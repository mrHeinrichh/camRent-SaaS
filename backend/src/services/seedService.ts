import bcrypt from 'bcryptjs';
import { FraudList } from '../models/FraudList';
import { Item } from '../models/Item';
import { Store } from '../models/Store';
import { User } from '../models/User';

export async function seedDatabase() {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) return;

  const adminPass = bcrypt.hashSync('admin123', 10);
  const ownerPass = bcrypt.hashSync('owner123', 10);
  const renterPass = bcrypt.hashSync('renter123', 10);

  const [admin, owner, renter] = await User.create([
    { email: 'admin@camrent.com', password: adminPass, role: 'admin', full_name: 'Super Admin' },
    { email: 'owner@lensrental.com', password: ownerPass, role: 'owner', full_name: 'Lens Rental Pro' },
    { email: 'renter@example.com', password: renterPass, role: 'renter', full_name: 'John Renter' },
  ]);

  const store = await Store.create({
    owner_id: owner._id,
    name: 'Lens Rental Pro',
    description: 'Premium camera gear for professionals. We specialize in high-end cinema lenses and RED cameras.',
    address: '123 Cinema Blvd, Hollywood, CA',
    status: 'approved',
    rating: 4.9,
    logo_url: 'https://picsum.photos/seed/logo-seed/200/200',
    banner_url: 'https://picsum.photos/seed/banner-seed/1200/400',
  });

  await Item.insertMany([
    {
      store_id: store._id,
      name: 'Sony A7IV',
      description: 'Versatile full-frame mirrorless camera.',
      daily_price: 80,
      deposit_amount: 500,
      image_url: 'https://picsum.photos/seed/sony/800/800',
      category: 'Cameras',
    },
    {
      store_id: store._id,
      name: 'Canon EOS R5',
      description: 'High-resolution 8K video and 45MP stills.',
      daily_price: 120,
      deposit_amount: 800,
      image_url: 'https://picsum.photos/seed/canon/800/800',
      category: 'Cameras',
    },
    {
      store_id: store._id,
      name: 'Sigma 24-70mm f/2.8',
      description: 'Essential zoom lens for any shoot.',
      daily_price: 45,
      deposit_amount: 200,
      image_url: 'https://picsum.photos/seed/sigma/800/800',
      category: 'Lenses',
    },
    {
      store_id: store._id,
      name: 'Aputure 600d Pro',
      description: 'Powerful daylight-balanced LED light.',
      daily_price: 65,
      deposit_amount: 300,
      image_url: 'https://picsum.photos/seed/light/800/800',
      category: 'Lighting',
    },
  ]);

  await FraudList.create({
    store_id: store._id,
    full_name: renter.full_name,
    email: renter.email,
    contact_number: '+1-555-0100',
    billing_address: 'Sample Address',
    reason: 'Seeded example entry',
    reported_by: admin._id,
  });
}
