import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/auth.js';
import { listUsers, toggleRole, deleteUser } from '../../controllers/admin.controller.js';
import { listVirsh, vmInfo, vmState, vmResources } from '../../controllers/virsh.controller.js';
import { vmQueue } from '../../services/queue.service.js'; // NOUVEAU

const router = express.Router();
router.use(requireAuth, requireAdmin);

// Routes existantes
router.get('/users', listUsers);
router.post('/users/:id/toggle-role', toggleRole);
router.delete('/users/:id', deleteUser);

router.get('/virsh', listVirsh);
router.get('/virsh/:name/state', vmState);
router.get('/virsh/:name/info', vmInfo);
router.get('/virsh/:name/resources', vmResources);

// NOUVELLE ROUTE: Actions sur VMs
router.post('/vms/:name/action', async (req, res) => {
  try {
    const { name } = req.params;
    const { action } = req.body;
    
    // Cherche la VM dans la base
    const vm = await VirtualMachine.findOne({ where: { name } });
    if (!vm) return res.status(404).json({ message: 'VM non trouvée' });

    await vmQueue.add('action', { vmId: vm.id, action });
    return res.json({ message: `Action ${action} en cours` });
  } catch (err) {
    console.error('admin.vmAction', err);
    return res.status(500).json({ message: 'Erreur' });
  }
});

export default router;