import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { generateToken } from '../middlewares/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const createEmailToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: 'user' });

    const token = createEmailToken(user.id);
    await sendVerificationEmail(user, token);

    return res.status(201).json({ message: 'Inscription réussie. Vérifiez votre email.' });
  } catch (err) {
    console.error('auth.register', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Token manquant' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }
    return res.json({ message: 'Email vérifié, vous pouvez vous connecter' });
  } catch (err) {
    console.error('auth.verifyEmail', err);
    return res.status(400).json({ message: 'Token invalide ou expiré' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Identifiants invalides' });
    if (!user.isVerified) return res.status(403).json({ message: 'Veuillez vérifier votre email' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Identifiants invalides' });

    const token = generateToken({ id: user.id, role: user.role, name: user.name, email: user.email });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 3600 * 1000
    });

    return res.json({ message: 'Connecté', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('auth.login', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnecté' });
};

export const me = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findByPk(id, { attributes: ['id', 'name', 'email', 'role', 'isVerified'] });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    return res.json({ user });
  } catch (err) {
    console.error('auth.me', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};