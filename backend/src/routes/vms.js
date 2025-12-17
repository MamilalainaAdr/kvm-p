import express from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middlewares/auth.js';
import { VirtualMachine } from '../models/index.js';
import { vmQueue, PRIORITIES } from '../services/queue.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation échouée', errors: errors.array() });
  next();
};

// List VMs
router.get('/', requireAuth, async (req, res) => {
  const where = req.user.role === 'admin' ? {} : { user_id: req.user.id };
  const vms = await VirtualMachine.findAll({ where, order: [['id', 'DESC']] });
  res.json({ vms });
});

// Create VM
router.post('/',
  requireAuth,
  body('name').trim().matches(/^[a-z0-9-]+$/i).withMessage('Nom invalide (alphanumérique et - uniquement)'),
  body('os_type').notEmpty(),
  body('version').notEmpty(),
  body('vcpu').isInt({ min: 1 }),
  body('memory').isInt({ min: 512 }),
  body('disk_size').isInt({ min: 10 }),
  validate,
  async (req, res) => {
    if (req.user.role === 'admin') return res.status(403).json({ message: 'Admin ne peut pas créer de VM' });
    
    const { name, os_type, version, vcpu, memory, disk_size } = req.body;
    
    const exists = await VirtualMachine.findOne({ where: { user_id: req.user.id, name } });
    if (exists) return res.status(409).json({ message: 'VM existe déjà' });
    
    const ext = (version === '2404' || version === '2204') ? 'img' : 'qcow2';
    const vm = await VirtualMachine.create({
      user_id: req.user.id, name, os_type, version, vcpu, memory, disk_size, status: 'pending'
    });
    
    await vmQueue.add('create', 
      { user: req.user, vmSpec: { name, os_type, version, vcpu, memory, disk_size, ext }, vmId: vm.id },
      { priority: PRIORITIES.HIGH }
    );
    
    res.status(202).json({ message: 'VM en création', vm: { id: vm.id, name, status: 'pending' } });
  }
);

// ✅ UPDATE VM RESOURCES
router.put('/:id',
  requireAuth,
  body('vcpu').isInt({ min: 1 }),
  body('memory').isInt({ min: 512 }),
  body('disk_size').isInt({ min: 10 }),
  validate,
  async (req, res) => {
    const vm = await VirtualMachine.findByPk(req.params.id);
    if (!vm) return res.status(404).json({ message: 'VM introuvable' });
    if (req.user.role !== 'admin' && vm.user_id !== req.user.id) return res.status(403).json({ message: 'Non autorisé' });

    const { vcpu, memory, disk_size } = req.body;

    // Mise à jour BDD (status 'updating')
    await vm.update({ status: 'updating' });

    await vmQueue.add('update', 
      { 
        user: req.user, 
        vmId: vm.id, 
        specs: { vcpu, memory, disk_size } 
      }, 
      { priority: PRIORITIES.HIGH }
    );

    res.json({ message: 'Mise à jour des ressources lancée' });
  }
);

// Delete VM
router.delete('/:id', requireAuth, async (req, res) => {
  const vm = await VirtualMachine.findByPk(req.params.id);
  if (!vm) return res.status(404).json({ message: 'VM introuvable' });
  if (req.user.role !== 'admin' && vm.user_id !== req.user.id) return res.status(403).json({ message: 'Non autorisé' });
  
  await vm.update({ status: 'deleting' });
  await vmQueue.add('destroy', 
    { vm: vm.toJSON(), user: req.user }, 
    { priority: PRIORITIES.CRITICAL }
  );
  
  res.json({ message: 'VM en suppression' });
});

// Action VM (start/stop/reboot)
router.post('/:id/action', requireAuth, async (req, res) => {
  const { action } = req.body;
  const vm = await VirtualMachine.findByPk(req.params.id);
  
  if (!vm) return res.status(404).json({ message: 'VM introuvable' });
  if (req.user.role !== 'admin' && vm.user_id !== req.user.id) return res.status(403).json({ message: 'Non autorisé' });
  if (!['start', 'stop', 'reboot'].includes(action)) return res.status(400).json({ message: 'Action invalide' });
  
  await vmQueue.add('action', 
    { vmId: vm.id, action, username: req.user.name }, 
    { priority: PRIORITIES.HIGH} 
  );
  res.json({ message: `Action ${action} en cours` });
});

export default router;