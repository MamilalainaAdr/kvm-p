import 'dotenv/config';
import { emailQueue } from '../services/queue.js';
import { sendVMEmail, verifyTransporter } from '../services/email.js';
import { User, VirtualMachine } from '../models/index.js';

console.log('[Email Worker] Demarrage...');

// Vérification de la connexion SMTP
verifyTransporter().catch(err => {
  console.error('[Email Worker] Erreur de connexion SMTP:', err.message);
});

emailQueue.process('vm-created', async (job) => {
  console.log(`[Email Worker] Job 'vm-created' recu`, job.data);
  const { email, vmName, ip, sshKey } = job.data;
  
  try {
    const user = await User.findOne({ where: { email } });
    const vm = await VirtualMachine.findOne({ where: { name: vmName } });
    
    console.log(`[Email Worker] Utilisateur trouve:`, user?.email);
    console.log(`[Email Worker] VM trouvee:`, vm?.name, 'IP:', vm?.ip_address);
    console.log(`[Email Worker] SSH Key presente:`, !!sshKey);
    
    await sendVMEmail(user, vm, 'created', sshKey);
    console.log(`[Email Worker] Email de creation envoye pour ${vmName}`);
  } catch (err) {
    console.error(`[Email Worker] Erreur envoi creation:`, err.message);
    throw err;
  }
});

emailQueue.process('vm-deleted', async (job) => {
  console.log(`[Email Worker] Job 'vm-deleted' recu`, job.data);
  const { email, vmName } = job.data;
  
  try {
    const user = await User.findOne({ where: { email } });
    console.log(`[Email Worker] Utilisateur trouve:`, user?.email);
    
    // Utiliser l'email directement si l'utilisateur n'existe plus
    if (!user) {
      console.log(`[Email Worker] Utilisateur supprime, envoi direct de l'email`);
      await sendEmail(email, 'VM supprimee', `
        <h2>Machine virtuelle supprimee</h2>
        <p>La VM <b>${vmName}</b> a ete supprimee definitivement.</p>
      `);
    } else {
      await sendVMEmail(user, { name: vmName }, 'deleted');
    }
    console.log(`[Email Worker] Email de suppression envoye pour ${vmName}`);
  } catch (err) {
    console.error(`[Email Worker] Erreur envoi suppression:`, err.message);
    throw err;
  }
});

console.log('[Email Worker] Pret a traiter les jobs');