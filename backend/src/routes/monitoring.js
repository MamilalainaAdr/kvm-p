import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { getSystemStats, getVMStats } from '../services/monitoring.js';

const router = express.Router();

// ✅ STATS SYSTÈME (Admin uniquement)
router.get('/system', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// ✅ STATS VMs (User ou Admin)
router.get('/vms', requireAuth, async (req, res) => {
  try {
    const stats = await getVMStats(req.user.id, req.user.role === 'admin');
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch VM stats' });
  }
});

export default router;