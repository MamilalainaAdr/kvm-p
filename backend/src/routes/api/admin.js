import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/auth.js';
import { listUsers, toggleRole, deleteUser } from '../../controllers/admin.controller.js';
import { listVirsh, vmInfo, vmState, vmResources } from '../../controllers/virsh.controller.js';
const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', listUsers);
router.post('/users/:id/toggle-role', toggleRole);
router.delete('/users/:id', deleteUser);

// virsh admin endpoints (only admin)
router.get('/virsh', listVirsh); // returns { output: "..." }
router.get('/virsh/:name/state', vmState);
router.get('/virsh/:name/info', vmInfo);
router.get('/virsh/:name/resources', vmResources);

export default router;