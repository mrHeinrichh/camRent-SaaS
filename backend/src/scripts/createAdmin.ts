import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = getArg('--email');
  const password = getArg('--password');
  const fullName = getArg('--name') || 'Super Admin';

  if (!email || !password) {
    console.error('Usage: npm run create:admin -- --email admin@example.com --password strong-password --name "Super Admin"');
    process.exit(1);
  }

  await connectDatabase();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`Admin creation failed: user with email ${email} already exists`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashedPassword,
    role: 'admin',
    full_name: fullName,
  });

  console.log('Admin account created:', {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  });
  process.exit(0);
}

main().catch((error) => {
  console.error('Admin creation failed:', error);
  process.exit(1);
});
