import 'dotenv/config';
import '../config/db.js';
import { vmQueue, emailQueue } from '../services/queue.js';
import * as terraform from '../services/terraform.js';
import * as virsh from '../services/virsh.js';
import { VirtualMachine } from '../models/index.js';

let lastSyncRun = 0;
const MIN_SYNC_INTERVAL = 4 * 60 * 1000;

setInterval(async () => {
  const waiting = await vmQueue.getWaiting();
  const active = await vmQueue.getActive();
  console.log(`[VM Worker] Jobs - Waiting: ${waiting.length}, Active: ${active.length}`);
}, 30000);

// Handler CRÉATION
vmQueue.process('create', async (job) => {
  console.log(`[VM Worker] 📥 Job CREATE:`, job.id);
  const { user, vmSpec, vmId } = job.data;
  
  try {
    const { vmDir, safeName } = await terraform.generateConfig(user.name, vmSpec);
    
    await VirtualMachine.update(
      { full_name: safeName, status: 'creating' },
      { where: { id: vmId } }
    );
    
    await terraform.applyWithRetry(vmDir);
    const outputs = await terraform.getOutputs(vmDir);
    
    // ✅ Sauvegarder la clé SSH dans la BDD
    await VirtualMachine.update(
      { 
        status: 'running', 
        ip_address: outputs.ip || null, 
        tf_dir: vmDir,
        ssh_key: outputs.sshKey || null // stockage
      },
      { where: { id: vmId } }
    );
    
    await emailQueue.add('vm-created', { email: user.email, vmName: vmSpec.name, ip: outputs.ip, sshKey: outputs.sshKey });
    return { success: true, vmId };
  } catch (err) {
    await VirtualMachine.update({ status: 'error' }, { where: { id: vmId } });
    throw err;
  }
});

// ✅ Handler UPDATE
vmQueue.process('update', async (job) => {
  console.log(`[VM Worker] 📥 Job UPDATE:`, job.id);
  const { user, vmId, specs } = job.data;

  const vm = await VirtualMachine.findByPk(vmId);
  if (!vm || !vm.tf_dir) throw new Error('VM or TF Dir not found');

  try {
    // Le nom du disque final est "final-{full_name}.qcow2" basé sur la logique de generateConfig
    const currentFinalDiskName = `final-${vm.full_name}.qcow2`;

    // Mettre à jour les fichiers Terraform
    await terraform.updateConfig(vm.tf_dir, specs, currentFinalDiskName);

    // Appliquer
    await terraform.applyWithRetry(vm.tf_dir);

    // Mettre à jour BDD
    await vm.update({ 
      vcpu: specs.vcpu,
      memory: specs.memory,
      disk_size: specs.disk_size,
      status: 'running' 
    });

    await emailQueue.add('vm-updated', { email: user.email, vmName: vm.name });
    console.log(`[VM Worker] ✅ Update success for ${vm.name}`);
    return { success: true };

  } catch (err) {
    console.error(`[VM Worker] ❌ Update failed:`, err);
    await vm.update({ status: 'error' }); // Ou revenir à l'état précédent
    throw err;
  }
});

// Handler DESTRUCTION
vmQueue.process('destroy', async (job) => {
  const { vm, user } = job.data;
  const fullName = vm.full_name;
  
  try {
    if (vm.tf_dir) {
      await terraform.destroyConfig(vm.tf_dir);
    } else if (fullName) {
      await virsh.forceStopVM(fullName);
    }
    
    await VirtualMachine.destroy({ where: { id: vm.id } });
    await emailQueue.add('vm-deleted', { email: user.email, vmName: vm.name });
    return { success: true };
  } catch (err) {
    console.error(`[VM Worker] Failed to destroy ${vm.name}:`, err);
    throw err;
  }
});

// Handler ACTIONS
vmQueue.process('action', async (job) => {
  const { vmId, action } = job.data;
  const vm = await VirtualMachine.findByPk(vmId);
  if (!vm || !vm.full_name) throw new Error('VM Invalid');
  
  try {
    switch (action) {
      case 'start': await virsh.startVM(vm.full_name); await vm.update({ status: 'running' }); break;
      case 'stop': await virsh.stopVM(vm.full_name); await vm.update({ status: 'stopped' }); break;
      case 'reboot': await virsh.rebootVM(vm.full_name); break;
    }
    return { success: true };
  } catch (err) {
    await vm.update({ status: 'error' });
    throw err;
  }
});

// Handler SYNC
vmQueue.process('sync-state', async (job) => {
  const now = Date.now();
  if (now - lastSyncRun < MIN_SYNC_INTERVAL) return { skipped: true };
  lastSyncRun = now;
  
  const vms = await VirtualMachine.findAll({ 
    where: { status: ['running', 'stopped', 'paused', 'error', 'shut off'] } 
  });
  
  let updated = 0;
  for (const vm of vms) {
    try {
      if (!vm.full_name) continue;
      const realState = await virsh.getVMState(vm.full_name);
      if (realState !== 'unknown' && realState.toLowerCase() !== vm.status.toLowerCase()) {
        await vm.update({ status: realState.toLowerCase() });
        updated++;
      }
    } catch (err) {
      console.error(`[Sync] Error VM ${vm.id}:`, err.message);
    }
  }
  return { updated, total: vms.length };
});