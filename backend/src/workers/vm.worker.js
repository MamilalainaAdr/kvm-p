import dotenv from 'dotenv';
dotenv.config();
import '../config/db.js'; // Connecte Sequelize
import { vmQueue, emailQueue } from '../services/queue.service.js';
import * as terraform from '../services/terraform.service.js';
import * as virsh from '../services/virsh.service.js';
import { VirtualMachine } from '../models/index.js';

// Traite la création de VM
vmQueue.process('create', async (job) => {
  const { user, vmSpec, vmId } = job.data;

  try {
    console.log(`[Worker] Creating VM ${vmSpec.name} for ${user.name}...`);
    
    // Génération et application Terraform
    const vmDir = await terraform.generateConfig(user.name, vmSpec);
    await terraform.applyConfig(vmDir);

    // Récupération des outputs
    const outputs = await terraform.getOutputs(vmDir, user.email, user.name);

    // Mise à jour DB
    await VirtualMachine.update({
      status: 'running',
      ip_address: outputs.vm_cloud_IP?.value || null,
      tf_dir: vmDir
    }, {
      where: { id: vmId }
    });

    // Notification async
    await emailQueue.add('vm-created', {
      email: user.email,
      vmName: vmSpec.name,
      ip: outputs.vm_cloud_IP?.value
    });

    return { success: true, vmId };
  } catch (error) {
    // En cas d'erreur, marquer comme error
    await VirtualMachine.update({
      status: 'error',
      ip_address: null
    }, {
      where: { id: vmId }
    });
    throw error; // Bull va gérer le retry
  }
});

// Traite la destruction de VM
vmQueue.process('destroy', async (job) => {
  const { vm, user } = job.data;
  
  try {
    console.log(`[Worker] Destroying VM ${vm.name}...`);
    
    if (vm.tf_dir) {
      await terraform.destroyConfig(vm.tf_dir, user.email, vm.name);
    }

    await VirtualMachine.destroy({ where: { id: vm.id } });

    await emailQueue.add('vm-deleted', {
      email: user.email,
      vmName: vm.name
    });

    return { success: true };
  } catch (error) {
    console.error(`[Worker] Failed to destroy VM ${vm.id}:`, error);
    throw error;
  }
});

// Traite les actions runtime (start/stop/reboot)
vmQueue.process('action', async (job) => {
  const { vmId, action } = job.data;
  
  const vm = await VirtualMachine.findByPk(vmId);
  if (!vm) throw new Error('VM not found');

  try {
    switch (action) {
      case 'start':
        await virsh.startVM(vm.name);
        await vm.update({ status: 'running' });
        break;
      case 'stop':
        await virsh.stopVM(vm.name);
        await vm.update({ status: 'stopped' });
        break;
      case 'reboot':
        await virsh.rebootVM(vm.name);
        // statut reste 'running'
        break;
    }
    return { success: true, action, vmId };
  } catch (error) {
    await vm.update({ status: 'error' });
    throw error;
  }
});

console.log('🛠️  VM Worker started');