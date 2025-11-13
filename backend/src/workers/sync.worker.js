import dotenv from 'dotenv';
dotenv.config();
import '../config/db.js';
import { syncQueue } from '../services/queue.service.js';
import { VirtualMachine } from '../models/index.js';
import * as virsh from '../services/virsh.service.js';

// Synchronise l'état réel des VMs toutes les 5 minutes
syncQueue.process('sync-state', async () => {
  console.log('[Sync] Starting state synchronization...');
  
  const vms = await VirtualMachine.findAll({
    where: { status: ['running', 'stopped', 'paused'] }
  });
  
  for (const vm of vms) {
    try {
      const realState = await virsh.getVMState(vm.name);
      const stateMap = {
        'running': 'running', 'idle': 'running',
        'paused': 'paused',
        'shutdown': 'stopped', 'shut off': 'stopped',
        'crashed': 'error'
      };
      
      const mappedState = stateMap[realState?.toLowerCase()] || 'unknown';
      
      // Ne pas écraser "running" par "unknown" trop vite
      if (mappedState === 'unknown' && vm.status === 'running') {
        console.log(`[Sync] VM ${vm.name} unknown, keeping running status`);
        continue; // SKIP cette VM
      }
      
      if (mappedState !== vm.status) {
        await vm.update({ status: mappedState });
      }
    } catch (err) {
      if (vm.status !== 'running') {
        await vm.update({ status: 'error' });
      }
    }
  }
});

console.log('🔄 Sync Worker started');