import 'dotenv/config';
import '../config/db.js';
import { monitoringQueue } from '../services/queue.js';
import { getSystemStats } from '../services/monitoring.js';

console.log('📊 Monitoring Worker - Démarrage...');

monitoringQueue.process('system-monitor', async (job) => {
  console.log(`[Monitoring Worker] 📡 Collecte système...`);
  try {
    const stats = await getSystemStats();
    console.log('[Monitoring Worker] ✅ Stats collectées:', stats);
    return { success: true, data: stats };
  } catch (err) {
    console.error('[Monitoring Worker] ❌ Erreur:', err.message);
    throw err;
  }
});

// ✅ Tâche périodique plus fiable
setInterval(async () => {
  try {
    const job = await monitoringQueue.add('system-monitor', { type: 'system' });
    console.log(`[Monitoring Worker] Job ${job.id} ajouté`);
  } catch (err) {
    console.error('[Monitoring Worker] Erreur ajout job:', err);
  }
}, 30000); // Toutes les 30 secondes

console.log('📊 Monitoring Worker - Prêt');