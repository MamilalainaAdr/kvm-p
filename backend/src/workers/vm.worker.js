import dotenv from 'dotenv';
dotenv.config();
import '../config/db.js';
import { vmQueue, emailQueue } from '../services/queue.service.js';
import * as terraform from '../services/terraform.service.js';
import * as virsh from '../services/virsh.service.js';
import { VirtualMachine } from '../models/index.js';

vmQueue.process('create', async (job) => {
  const { user, vmSpec, vmId } = job.data;
  try {
    console.log(`[Worker] Creating VM ${vmSpec.name} for ${user.name}...`);
    
    const vmDir = await terraform.generateConfig(user.name, vmSpec);
    await terraform.applyConfig(vmDir);
    const outputs = await terraform.getOutputs(vmDir);
    
    await VirtualMachine.update({
      status: 'running',
      ip_address: outputs.vm_cloud_IP?.value || null,
      tf_dir: vmDir
    }, { where: { id: vmId } });

    await emailQueue.add('vm-created', {
      email: user.email,
      vmName: vmSpec.name,
      ip: outputs.vm_cloud_IP?.value
    });

    return { success: true, vmId };
  } catch (error) {
    await VirtualMachine.update({ status: 'error' }, { where: { id: vmId } });
    throw error;
  }
});

vmQueue.process('destroy', async (job) => {
  const { vm, user } = job.data;
  try {
    console.log(`[Worker] Destroying VM ${vm.name}...`);
    if (vm.tf_dir) await terraform.destroyConfig(vm.tf_dir);
    await VirtualMachine.destroy({ where: { id: vm.id } });
    await emailQueue.add('vm-deleted', { email: user.email, vmName: vm.name });
    return { success: true };
  } catch (error) {
    console.error(`[Worker] Failed to destroy VM ${vm.id}:`, error);
    throw error;
  }
});

vmQueue.process('action', async (job) => {
  const { vmId, action, username } = job.data;
  const vm = await VirtualMachine.findByPk(vmId);
  if (!vm) throw new Error('VM not found');

  const fullVmName = `${vm.name}-${username}`;

  try {
    switch (action) {
      case 'start':
        await virsh.startVM(fullVmName);
        await vm.update({ status: 'running' });
        break;
      case 'stop':
        await virsh.stopVM(fullVmName);
        await vm.update({ status: 'stopped' });
        break;
      case 'reboot':
        await virsh.rebootVM(fullVmName);
        break;
    }
    console.log(`[Worker] Action ${action} sur ${fullVmName} réussie`);
    return { success: true, action, vmId, fullVmName };
  } catch (error) {
    console.error(`[Worker] Erreur action ${action} sur ${fullVmName}:`, error);
    await vm.update({ status: 'error' });
    throw error;
  }
});

console.log('🛠️  VM Worker started');