import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { serialize } from '../utils/mongo';

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  const { email, password, role, full_name, store_name, store_description, store_address } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'renter',
      full_name,
    });

    if (user.role === 'owner') {
      const createdStore = await Store.create({
        owner_id: user._id,
        name: store_name || `${full_name || email}'s Store`,
        description: store_description || '',
        address: store_address || '',
        status: 'pending',
      });

      console.log('[auth] owner registered with store', {
        userId: user._id.toString(),
        email: user.email,
        storeId: createdStore._id.toString(),
        storeName: createdStore.name,
      });
    } else {
      console.log('[auth] renter registered', {
        userId: user._id.toString(),
        email: user.email,
      });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
    res.json({ token, user: serialize(user) });
  } catch (error: any) {
    console.error('[auth] register failed', {
      email,
      role,
      message: error?.message,
    });
    res.status(400).json({ error: 'Email already exists' });
  }
});

authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    console.warn('[auth] login failed', { email });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log('[auth] login success', {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret);
  res.json({ token, user: serialize(user) });
});
