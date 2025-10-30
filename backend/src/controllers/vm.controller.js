import { VirtualMachine } from '../models/index.js';
import { generateConfig, applyConfig, getOutputs, destroyConfig } from '../services/terraform.service.js';

export const listVMs = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const vms = await VirtualMachine.findAll({ order: [['id', 'DESC']] });
      return res.json({ vms });
    }
    const vms = await VirtualMachine.findAll({ where: { user_id: req.user.id }, order: [['id', 'DESC']] });
    return res.json({ vms });
  } catch (err) {
    console.error('vm.listVMs', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createVM = async (req, res) => {
  // Empêche explicitement l'admin de créer des VMs
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: "Les administrateurs ne peuvent pas créer de VM." });
  }

  const { name, os_type, version, vcpu, memory, disk_size } = req.body;
  try {
    const vmSpec = { name, os_type, version, vcpu, memory, disk_size };
    const vmDir = await generateConfig(req.user.name || `user${req.user.id}`, vmSpec);
    await applyConfig(vmDir);

    // IMPORTANT: on passe l'email et le nom d'utilisateur à getOutputs
    const outputs = await getOutputs(vmDir, req.user.email, req.user.name);

    const vm = await VirtualMachine.create({
      user_id: req.user.id,
      name,
      os_type,
      version,
      vcpu,
      memory,
      disk_size,
      ip_address: outputs.vm_cloud_IP?.value || null,
      status: 'running',
      tf_dir: vmDir
    });
    return res.status(201).json({ vm });
  } catch (err) {
    console.error('vm.createVM', err);
    return res.status(500).json({ message: 'Erreur création VM' });
  }
};

export const deleteVM = async (req, res) => {
  try {
    const vm = await VirtualMachine.findByPk(req.params.id);
    if (!vm) return res.status(404).json({ message: 'VM introuvable' });

    // Supprimer le répertoire terraform et envoyer email si possible
    // On transmet l'email et le nom de la VM à destroyConfig
    await destroyConfig(vm.tf_dir, req.user?.email || null, vm.name);

    // Supprimer l'enregistrement DB
    await vm.destroy();

    return res.json({ message: 'VM supprimée' });
  } catch (err) {
    console.error('vm.deleteVM', err);
    return res.status(500).json({ message: 'Erreur suppression VM' });
  }
};