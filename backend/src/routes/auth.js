import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { generateToken } from '../middlewares/auth.js';
import { sendVerificationEmail } from '../services/email.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation échouée', errors: errors.array() });
  next();
};

// Register
router.post('/register', 
  body('name').trim().isLength({ min: 3 }).withMessage('Nom trop court'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
  validate,
  async (req, res) => {
    const { name, email, password } = req.body;
    
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email déjà utilisé' });
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: 'user', isVerified: false });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    await sendVerificationEmail(user, token);
    
    res.status(201).json({ message: 'Compte créé. Consultez vos emails.' });
  }
);

// Verify email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Token manquant' });
  
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    
    user.isVerified = true;
    await user.save();
    res.json({ message: 'Email vérifié. Vous pouvez vous connecter.' });
  } catch {
    res.status(400).json({ message: 'Token invalide ou expiré' });
  }
});

// Login
router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    if (!user.isVerified) return res.status(403).json({ message: 'Veuillez vérifier votre email' });
    
    const token = generateToken({ id: user.id, role: user.role, name: user.name, email: user.email });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 3600 * 1000
    });
    
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }
);

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Déconnecté' });
});

// Current user
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Non authentifié' });
  
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(id, { attributes: ['id', 'name', 'email', 'role', 'isVerified'] });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user });
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
});

export default router;