import * as virshService from '../services/virsh.service.js';

/**
 * Return a structured list of VMs with summary information.
 * Response: { vms: [ { name, state, vcpu, memory, size: {Capacity, Allocation} , error? }, ... ] }
 */
export const listVirsh = async (req, res) => {
  try {
    const out = await virshService.listVMs();
    const output = out || '';
    // parse names from 'virsh list --all' output
    const lines = output
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('Id') && !l.includes('----'));

    const names = lines
      .map(line => {
        const parts = line.split(/\s+/);
        return parts.length > 1 ? parts[1] : parts[0];
      })
      .filter(Boolean);

    // For each name, fetch summary (state, vcpu, memory, size)
    const summaries = await Promise.all(names.map(name => virshService.getVMSummary(name)));

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