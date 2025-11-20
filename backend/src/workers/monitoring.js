import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { getSystemStats, getVMStats } from '../services/monitoring.js';

const router = express.Router();

// ✅ STATS SYSTÈME (Admin uniquement)
router.get('/system', requireAuth, requireAdmin, async (req, res) => {
  console.log('[Monitoring API] GET /system demandé par:', req.user.email);
  try {
    const stats = await getSystemStats();
    console.log('[Monitoring API] Stats système envoyées:', stats);
    res.json(stats);
  } catch (err) {
    console.error('[Monitoring API] Erreur système:', err.message);
    res.status(500).json({ error: 'Failed to fetch system stats', details: err.message });
  }
});

// ✅ STATS VMs (User ou Admin)
router.get('/vms', requireAuth, async (req, res) => {
  console.log('[Monitoring API] GET /vms demandé par:', req.user.email);
  try {
    const stats = await getVMStats(req.user.id, req.user.role === 'admin');
    console.log('[Monitoring API] Stats VMs envoyées:', stats);
    res.json(stats);
  } catch (err) {
    console.error('[Monitoring API] Erreur VMs:', err.message);
    res.status(500).json({ error: 'Failed to fetch VM stats', details: err.message });
  }
});

export default router;