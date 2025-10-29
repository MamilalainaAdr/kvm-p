import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';

export const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@gmail.com';
    const adminPass = process.env.DEFAULT_ADMIN_PASS || 'admin';

    const exists = await User.findOne({ where: { email: adminEmail } });
    if (exists) {
      console.log('Admin exists:', adminEmail);
      return;
    }

    const hash = await bcrypt.hash(adminPass, 10);
    await User.create({
      name: 'admin',
      email: adminEmail,
      password: hash,
      role: 'admin',
      isVerified: true
    });
    console.log(`Default admin created: ${adminEmail} / ${adminPass}`);
  } catch (err) {
    console.error('createDefaultAdmin error:', err);
    throw err;
  }
};