import util from 'util';
import { exec } from 'child_process';
import * as virshService from '../services/virsh.service.js';
const execPromise = util.promisify(exec);

/**
 * Return a structured list of VMs with summary information.
 * Response: { vms: [ { name, state, vcpu, memory_mib, size: {capacity_mib, allocation_mib}, virtual_bytes, actual_bytes, disk_path, thin_provisioned }, ... ] }
 */
export const listVirsh = async (req, res) => {
  try {
    const { stdout } = await execPromise('virsh list --all --name 2>/dev/null');
    const names = (stdout || '').split('\n').map(l => l.trim()).filter(Boolean);

    // Use service.getVMSummary for each name
    const settled = await Promise.allSettled(names.map(name => virshService.getVMSummary(name)));
    const summaries = settled.map(s => (s.status === 'fulfilled' ? s.value : {
      name: s.reason?.vmName || 'unknown',
      state: 'unknown',
      vcpu: null,
      memory_mib: null,
      size: { capacity_mib: null, allocation_mib: null },
      virtual_bytes: null,
      actual_bytes: null,
      disk_path: null,
      thin_provisioned: false,
      error: s.reason?.message || 'Erreur'
    }));

    return res.json({ vms: summaries });
  } catch (err) {
    console.error('virsh.listVirsh error:', err);
    return res.status(500).json({ message: err.message || 'Erreur virsh list' });
  }
};

export const vmState = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ message: 'Nom de VM requis' });
    const state = await virshService.getVMState(name);
    return res.json({ name, state });
  } catch (err) {
    console.error('virsh.vmState error:', err);
    return res.status(500).json({ message: err.message || 'Erreur get state' });
  }
};

export const vmInfo = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ message: 'Nom de VM requis' });
    const info = await virshService.getVMInfo(name);
    return res.json({ name, info });
  } catch (err) {
    console.error('virsh.vmInfo error:', err);
    return res.status(500).json({ message: err.message || 'Erreur get info' });
  }
};

export const vmResources = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ message: 'Nom de VM requis' });
    const ressources = await virshService.getVMResources(name);
    return res.json({ name, ressources });
  } catch (err) {
    console.error('virsh.vmResources error:', err);
    return res.status(500).json({ message: err.message || 'Erreur get resources' });
  }
};