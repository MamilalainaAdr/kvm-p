import 'dotenv/config';
import '../config/db.js';
import { vmQueue, emailQueue } from '../services/queue.js';
import * as terraform from '../services/terraform.js';
import * as virsh from '../services/virsh.js';
import { VirtualMachine } from '../models/index.js';
import { User } from '../models/index.js';
import fs from 'fs-extra';
import path from 'path';

let lastSyncRun = 0;
const MIN_SYNC_INTERVAL = 4 * 60 * 1000; // 4 minutes minimum

// Handler CRÉATION
vmQueue.process('create', async (job) => {
  const { user, vmSpec, vmId } = job.data;
  
  try {
    console.log(`[VM Worker] Creating ${vmSpec.name} for ${user.name}...`);
    
    const { vmDir, safeName } = await terraform.generateConfig(user.name, vmSpec);
    
    // ✅ Sauvegarder IMMÉDIATEMENT le full_name pour éviter la perte
    await VirtualMachine.update(
      { full_name: safeName, status: 'creating' },
      { where: { id: vmId } }
    );
    
    await terraform.applyWithRetry(vmDir);
    const outputs = await terraform.getOutputs(vmDir);
    
    // ✅ Mettre à jour le reste
    await VirtualMachine.update(
      { status: 'running', ip_address: outputs.ip || null, tf_dir: vmDir },
      { where: { id: vmId } }
    );
    
    await emailQueue.add('vm-created', { email: user.email, vmName: vmSpec.name, ip: outputs.ip, sshKey: outputs.sshKey });
    console.log(`[VM Worker] 📤 Job 'vm-created' ajouté à la file`);
    return { success: true, vmId };
  } catch (err) {
    await VirtualMachine.update({ status: 'error' }, { where: { id: vmId } });
    throw err;
  }
});

// Handler DESTRUCTION (✅ AJOUTER SI MANQUANT)
vmQueue.process('destroy', async (job) => {
  const { vm, user } = job.data;
  
  // ✅ Utiliser le full_name STOCKÉ
  const fullName = vm.full_name;
  
  try {
    console.log(`[VM Worker] Destroying ${vm.name} (full_name: ${fullName})...`);
    
    if (vm.tf_dir) {
      await terraform.destroyConfig(vm.tf_dir);
    } else if (fullName) {
      // Fallback si pas de tf_dir (VM créée manuellement)
      console.warn(`[VM Worker] No tf_dir, trying direct virsh destroy on ${fullName}`);
      await virsh.forceStopVM(fullName);
    }
    
    await VirtualMachine.destroy({ where: { id: vm.id } });
    await emailQueue.add('vm-deleted', { email: user.email, vmName: vm.name });
    console.log(`[VM Worker] 📤 Job 'vm-deleted' ajouté à la file`); // ✅ Log ajout file
    
    console.log(`[VM Worker] Destroyed ${vm.name} successfully`);
    return { success: true };
  } catch (err) {
    console.error(`[VM Worker] Failed to destroy ${vm.name}:`, err);
    throw err;
  }
});

// Handler ACTIONS (start/stop/reboot)
vmQueue.process('action', async (job) => {
  const { vmId, action } = job.data;
  const vm = await VirtualMachine.findByPk(vmId);
  if (!vm) throw new Error('VM not found');
  
  // ✅ Utiliser le full_name STOCKÉ, pas le nom calculé
  const fullName = vm.full_name;
  if (!fullName) throw new Error(`VM ${vm.id} n'a pas de full_name enregistré`);
  
  try {
    switch (action) {
      case 'start':
        await virsh.startVM(fullName);
        await vm.update({ status: 'running' });
        break;
      case 'stop':
        await virsh.stopVM(fullName);
        await vm.update({ status: 'stopped' });
        break;
      case 'reboot':
        await virsh.rebootVM(fullName);
        break;
    }
    console.log(`[VM Worker] Action ${action} on ${fullName} OK`);
    return { success: true };
  } catch (err) {
    console.error(`[VM Worker] Error on ${action} ${fullName}:`, err);
    await vm.update({ status: 'error' });
    throw err;
  }
});

// Handler SYNC ÉTAT
// ✅ Handler SYNC ÉTAT avec protection
vmQueue.process('sync-state', async () => {
  const now = Date.now();
  
  // Vérification anti-spam
  if (now - lastSyncRun < MIN_SYNC_INTERVAL) {
    const seconds = Math.round((now - lastSyncRun) / 1000);
    console.warn(`[Sync] ⏭️  Ignoré - Dernier run il y a ${seconds}s (min: ${MIN_SYNC_INTERVAL/1000}s)`);
    return { skipped: true, reason: 'Too frequent' };
  }
  
  lastSyncRun = now;
  console.log(`[Sync] 🔄 Démarrage sync à ${new Date().toISOString()}`);
  
  const vms = await VirtualMachine.findAll({ 
    where: { status: ['running', 'stopped', 'paused', 'error'] } 
  });
  
  let updated = 0, skipped = 0, errors = 0;
  
  for (const vm of vms) {
    try {
      const user = await User.findByPk(vm.user_id);
      if (!user) {
        console.warn(`[Sync] User ${vm.user_id} introuvable pour VM ${vm.id}`);
        skipped++;
        continue;
      }
      
      const fullName = vm.full_name;
      if (!fullName) {
        console.warn(`[Sync] VM ${vm.id} (${vm.name}) n'a pas de full_name`);
        skipped++;
        continue;
      }
      
      const realState = await virsh.getVMState(fullName);
      
      if (realState === 'unknown') {
        console.warn(`[Sync] VM ${fullName} introuvable dans libvirt`);
        skipped++;
        continue;
      }
      
      if (realState !== vm.status) {
        await vm.update({ status: realState });
        console.log(`[Sync] ✅ ${fullName}: ${vm.status} → ${realState}`);
        updated++;
      } else {
        console.log(`[Sync] ⏭️  ${fullName}: ${vm.status} (inchangé)`);
        skipped++;
      }
      
    } catch (err) {
      console.error(`[Sync] ❌ Erreur VM ${vm.id}:`, err.message);
      errors++;
    }
  }
  
  console.log(`[Sync] 📊 Résultat: ${updated} maj, ${skipped} ignorées, ${errors} erreurs`);
  return { updated, skipped, errors, total: vms.length };
});


// Handler DESTROY BY USER DELETE
vmQueue.process('destroy-user-vms', async (job) => {
  const { userId } = job.data;
  const user = await User.findByPk(userId, { include: VirtualMachine });
  
  console.log(`[VM Worker] Suppression CASCADE pour user ${user.name} (${user.VirtualMachines.length} VMs)`);
  
  for (const vm of user.VirtualMachines) {
    try {
      console.log(`[VM Worker] Destroy VM ${vm.name} (${vm.full_name})`);
      
      if (vm.tf_dir) {
        await terraform.destroyConfig(vm.tf_dir);
      } else if (vm.full_name) {
        await virsh.forceStopVM(vm.full_name);
      }
      
      await vm.destroy(); // ✅ Supprime immédiatement de la DB
      await emailQueue.add('vm-deleted', { email: user.email, vmName: vm.name });
    } catch (err) {
      console.error(`[VM Worker] Erreur destruction ${vm.name}:`, err);
      // Ne pas throw, continuer sur les autres VMs
    }
  }
});

console.log('🛠️  VM Worker started');