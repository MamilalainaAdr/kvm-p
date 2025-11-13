import { VirtualMachine } from '../models/index.js';
import { generateConfig } from '../services/terraform.service.js';
import { vmQueue } from '../services/queue.service.js';
import dotenv from 'dotenv';
dotenv.config();

export const listVMs = async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { user_id: req.user.id };
    const vms = await VirtualMachine.findAll({ 
      where, 
      order: [['id', 'DESC']],
      include: req.user.role === 'admin' ? ['User'] : []
    });
    return res.json({ vms });
  } catch (err) {
    console.error('vm.listVMs', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createVM = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: "Les administrateurs ne peuvent pas créer de VM." });
  }

  const { name, os_type, version, vcpu, memory, disk_size } = req.body;
  
  // Validation
  if (!name || !os_type || !version) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  try {
    // Vérifie existence
    const existing = await VirtualMachine.findOne({
      where: { user_id: req.user.id, name }
    });
    if (existing) {
      return res.status(400).json({ message: "Une VM avec ce nom existe déjà" });
    }

    // ⚠️ CRÉE SEULEMENT L'ENREGISTREMENT DB - PAS DE DOSSIER ICI
    const vm = await VirtualMachine.create({
      user_id: req.user.id,
      name,
      os_type,
      version,
      vcpu: parseInt(vcpu) || 1,
      memory: parseInt(memory) || 512,
      disk_size: parseInt(disk_size) || 10,
      status: 'creating',
      ip_address: null,
      tf_dir: null
    });

    // Ajoute à la file - LE WORKER CRÉERA LE DOSSIER
    await vmQueue.add('create', {
      user: req.user,
      vmSpec: { name, os_type, version, vcpu, memory, disk_size },
      vmId: vm.id
    });

    return res.status(202).json({ 
      message: 'VM en cours de création', 
      vm: { id: vm.id, status: 'creating', name } 
    });
  } catch (err) {
    console.error('vm.createVM error:', err);
    return res.status(500).json({ message: err.message || 'Erreur création VM' });
  }
};

export const deleteVM = async (req, res) => {
  try {
    const vm = await VirtualMachine.findByPk(req.params.id);
    if (!vm) return res.status(404).json({ message: 'VM introuvable' });

    // Vérifie propriété
    if (req.user.role !== 'admin' && vm.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Marque comme 'deleting'
    await vm.update({ status: 'deleting' });

    // Ajoute à la file
    await vmQueue.add('destroy', {
      vm: vm.toJSON(),
      user: req.user
    });

    return res.json({ message: 'VM en cours de suppression' });
  } catch (err) {
    console.error('vm.deleteVM', err);
    return res.status(500).json({ message: 'Erreur suppression VM' });
  }
};

// NOUVEAU: Actions sur VM
export const actionVM = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // start, stop, reboot

    const vm = await VirtualMachine.findByPk(id);
    if (!vm) return res.status(404).json({ message: 'VM introuvable' });

    if (req.user.role !== 'admin' && vm.user_id !== req.user.id) {
      return res.status(403). json({ message: 'Non autorisé' });
    }

    // Vérifie que l'action est valide
    const validActions = ['start', 'stop', 'reboot'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: 'Action invalide' });
    }

    // Ajoute à la file
    await vmQueue.add('action', {
      vmId: vm.id,
      action
    });

    return res.json({ message: `Action ${action} en cours` });
  } catch (err) {
    console.error('vm.actionVM', err);
    return res.status(500).json({ message: 'Erreur action VM' });
  }
};