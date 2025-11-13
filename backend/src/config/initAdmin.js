import bcrypt from 'bcrypt';
import { User } from '../models/index.js';

export const createDefaultAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@gmail.com';
  const pass = process.env.DEFAULT_ADMIN_PASS || 'admin';
  
  const exists = await User.findOne({ where: { email } });
  if (exists) return console.log('Admin exists');

  const hash = await bcrypt.hash(pass, 10);
  await User.create({ name: 'admin', email, password: hash, role: 'admin', isVerified: true });
  console.log(`Admin created: ${email} / ${pass}`);
};