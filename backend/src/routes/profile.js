import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middlewares/auth.js';
import { User } from '../models/index.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation échouée', errors: errors.array() });
  next();
};

// Update name/email
router.put('/', requireAuth, validate,
  body('name').optional().trim().isLength({ min: 3 }),
  body('email').optional().isEmail(),
  async (req, res) => {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(400).json({ message: 'Email déjà utilisé' });
      user.isVerified = false;
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.json({ message: 'Profil mis à jour', user: { id: user.id, name: user.name, email: user.email } });
  }
);

// Change password
router.put('/password', requireAuth, validate,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 }),
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Mot de passe actuel invalide' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.clearCookie('token');
    res.json({ message: 'Mot de passe changé, reconnectez-vous' });
  }
);

export default router;