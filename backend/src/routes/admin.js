import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { User, VirtualMachine } from '../models/index.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

// List users with VMs
router.get('/users', async (req, res) => {
  const users = await User.findAll({ include: [VirtualMachine], order: [['id', 'ASC']] });
  res.json({ users });
});

// Toggle role
router.post('/users/:id/toggle-role', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  
  user.role = user.role === 'admin' ? 'user' : 'admin';
  await user.save();
  res.json({ message: 'Rôle modifié', user: { id: user.id, role: user.role } });
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  
  await user.destroy();
  res.json({ message: 'Utilisateur supprimé' });
});

export default router;