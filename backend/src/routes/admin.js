import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { User, VirtualMachine } from '../models/index.js';
import { vmQueue, PRIORITIES } from '../services/queue.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

// List users with VMs
router.get('/users', async (req, res) => {
  const users = await User.findAll({ 
    include: [VirtualMachine], 
    order: [['id', 'ASC']] });
  // Formatage avec count
  const formatted = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    vmCount: u.VirtualMachines?.length || 0
  }));
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
  const user = await User.findByPk(req.params.id, {
    include: [{ model: VirtualMachine }]
  });
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  
  // ✅ Vérification que VirtualMachines est bien un tableau
  if (!Array.isArray(user.VirtualMachines)) {
    console.error('[Admin] VirtualMachines n est pas un tableau:', user.VirtualMachines);
    return res.status(500).json({ message: 'Erreur interne' });
  }

  // ✅ Pour chaque VM, ajouter un job destroy CRITICAL
  for (const vm of user.VirtualMachines) {
    try {
      await vmQueue.add('destroy', { 
        vm: vm.toJSON(), 
        user: { id: user.id, name: user.name, email: user.email } 
      }, { priority: PRIORITIES.CRITICAL });
      console.log(`[Admin] Job destroy ajouté pour VM ${vm.name} (${vm.full_name})`);
    } catch (err) {
      console.error(`[Admin] Erreur ajout job destroy pour VM ${vm.id}:`, err);
      // Continue quand même, on essaiera de nettoyer avec sync-state plus tard
    }
  }
  // ✅ Suppression user après avoir initié les destroys
  await user.destroy();
  res.json({ message: 'Utilisateur supprimé, destruction des VMS en cours' });
});

export default router;