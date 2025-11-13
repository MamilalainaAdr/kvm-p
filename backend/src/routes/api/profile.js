import express from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../../middlewares/auth.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/index.js';
import { sendEmail } from '../../services/email.service.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Update profile (name/email)
router.put('/',
  requireAuth,
  body('name').optional().trim().isLength({ min: 3 }),
  body('email').optional().isEmail(),
  validate,
  async (req, res) => {
    try {
      const { name, email } = req.body;
      const user = await User.findByPk(req.user.id);
      
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
      
      // Vérifier email unique
      if (email && email !== user.email) {
        const exists = await User.findOne({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email déjà utilisé' });
        user.isVerified = false; // Re-vérification nécessaire
      }
      
      if (name) user.name = name;
      if (email) user.email = email;
      
      await user.save();
      res.json({ message: 'Profil mis à jour', user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error('profile.update', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Change password
router.put('/password',
  requireAuth,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 }),
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);
      
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return res.status(400).json({ message: 'Mot de passe actuel invalide' });
      
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      
      res.clearCookie('token');
      res.json({ message: 'Mot de passe changé, reconnectez-vous' });
    } catch (err) {
      console.error('profile.changePassword', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Demande réinitialisation mot de passe
router.post('/reset-password-request',
  body('email').isEmail(),
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      
      if (!user) return res.status(404).json({ message: 'Email non trouvé' });
      
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const appUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
      
      const html = `<p>Bonjour ${user.name},</p>
        <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Ce lien expire dans 1 heure.</p>`;
      
      await sendEmail(user.email, 'Réinitialisation mot de passe', html);
      res.json({ message: 'Email de réinitialisation envoyé' });
    } catch (err) {
      console.error('profile.resetPasswordRequest', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Réinitialiser avec token
router.post('/reset-password',
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate,
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findByPk(payload.id);
      if (!user) return res.status(404).json({ message: 'Token invalide' });
      
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      
      res.json({ message: 'Mot de passe réinitialisé' });
    } catch (err) {
      console.error('profile.resetPassword', err);
      res.status(400).json({ message: 'Token invalide ou expiré' });
    }
  }
);

export default router;