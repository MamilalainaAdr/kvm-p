import express from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { listVMs, createVM, deleteVM } from '../../controllers/vm.controller.js';

const router = express.Router();

router.get('/', requireAuth, listVMs);
router.post('/', requireAuth, createVM);
router.delete('/:id', requireAuth, deleteVM);

export default router;