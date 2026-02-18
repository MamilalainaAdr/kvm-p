import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { User, VirtualMachine } from '../models/index.js';
import { vmQueue, PRIORITIES } from '../services/queue.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Liste utilisateurs avec VM count
router.get('/users', async (req, res) => {
  const users = await User.findAll({ 
    include: [VirtualMachine], 
    order: [['id', 'ASC']] 
  });
  
  const formatted = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    vmCount: u.VirtualMachines?.length || 0
  }));
  
  res.json({ users: formatted });
});

// Suppression d'un utilisateur (cascade)
router.delete('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [{ model: VirtualMachine }]
  });
  
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  
  if (!Array.isArray(user.VirtualMachines)) {
    console.error('[Admin] VirtualMachines n\'est pas un tableau:', user.VirtualMachines);
    return res.status(500).json({ message: 'Erreur interne' });
  }

  // Sauvegarder l'email AVANT suppression
  const userEmail = user.email;
  const userName = user.name;

  // Ajouter des jobs destroy pour chaque VM
  for (const vm of user.VirtualMachines) {
    try {
      await vmQueue.add('destroy', { 
        vm: vm.toJSON(), 
        user: { id: user.id, name: userName, email: userEmail } 
      }, { priority: PRIORITIES.CRITICAL });
      console.log(`[Admin] Job destroy ajoute pour VM ${vm.name} (${vm.full_name})`);
    } catch (err) {
      console.error(`[Admin] Erreur ajout job destroy pour VM ${vm.id}:`, err);
    }
  }
  
  // Envoyer email de confirmation à l'utilisateur
  try {
    await sendEmail(
      userEmail,
      'Compte supprime - OBox',
      `<p>Bonjour ${userName},</p>
       <p>Votre compte OBox et toutes vos machines virtuelles ont ete supprimes par un administrateur.</p>
       <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>`
    );
    console.log(`[Admin] Email de suppression envoye a ${userEmail}`);
  } catch (err) {
    console.error('[Admin] Erreur envoi email suppression:', err.message);
    // On ne bloque pas la suppression
  }
  
  // Supprimer l'utilisateur (les VMs seront supprimées via les jobs)
  await user.destroy();
  res.json({ message: 'Utilisateur supprime, destruction des VMs en cours' });
});

export default router;