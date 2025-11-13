import dotenv from 'dotenv';
dotenv.config();
import '../config/db.js';
import { syncQueue } from '../services/queue.service.js';
import { VirtualMachine } from '../models/index.js';
import * as virsh from '../services/virsh.service.js';

const stateMap = {
  'running': 'running', 'idle': 'running',
  'paused': 'paused',
  'shutdown': 'stopped', 'shut off': 'stopped',
  'crashed': 'error'
};

// Retry avec backoff exponentiel
async function getVMStateWithRetry(vmName, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await virsh.getVMState(vmName);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)));
    }
  }
}

syncQueue.process('sync-state', async (job) => {
  console.log('[Sync] Starting state synchronization...');
  
  const vms = await VirtualMachine.findAll({
    where: { 
      status: ['running', 'stopped', 'paused', 'error', 'creating', 'deleting'] 
    }
  });
  
  for (const vm of vms) {
    try {
      const realState = await getVMStateWithRetry(vm.name);
      const mappedState = stateMap[realState?.toLowerCase()] || 'unknown';
      
      // Protection contre les faux unknown
      if (mappedState === 'unknown' && vm.status === 'running') {
        console.log(`[Sync] ${vm.name}: état "unknown" ignoré (tourne normalement)`);
        continue; // SKIP
      }
      
      if (mappedState !== vm.status && mappedState !== 'unknown') {
        await vm.update({ status: mappedState });
        console.log(`[Sync] ${vm.name}: ${vm.status} → ${mappedState}`);
      }
    } catch (err) {
      console.error(`[Sync] Erreur sur ${vm.name}:`, err.message);
    }
  }
});

console.log('🔄 Sync Worker started (interval: 5 min)');