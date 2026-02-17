import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { getSystemStats, getUserVMsStats } from '../services/monitoring.js';

const router = express.Router();

// Stats système (admin uniquement)
router.get('/system', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Stats VMs (user ou admin)
router.get('/vms', requireAuth, async (req, res) => {
  try {
    const stats = await getUserVMsStats(req.user.id, req.user.role === 'admin');
    res.json({ vms: stats, total: stats.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch VM stats' });
  }
});

export default router;