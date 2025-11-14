import 'dotenv/config';
import { emailQueue } from '../services/queue.js';
import { sendVMEmail } from '../services/email.js';
import { User, VirtualMachine } from '../models/index.js';

console.log('📧 Email Worker - Démarrage...'); // ✅ Vérifie que le fichier est exécuté

emailQueue.process('vm-created', async (job) => {
  console.log(`[Email Worker] 📬 Job 'vm-created' reçu`, job.data); // ✅ Log data reçues
  const { email, vmName, ip, sshKey } = job.data;
  
  try {
    const user = await User.findOne({ where: { email } });
    const vm = await VirtualMachine.findOne({ where: { name: vmName } });
    
    console.log(`[Email Worker] Utilisateur trouvé:`, user?.email); // ✅ Log user
    console.log(`[Email Worker] VM trouvée:`, vm?.name, 'IP:', vm?.ip_address); // ✅ Log vm
    console.log(`[Email Worker] SSH Key présente:`, !!sshKey); // ✅ Log clé SSH
    
    await sendVMEmail(user, vm, 'created', sshKey);
    console.log(`[Email Worker] ✅ Email de création envoyé pour ${vmName}`); // ✅ Log succès
  } catch (err) {
    console.error(`[Email Worker] ❌ Erreur envoi création:`, err.message); // ✅ Log erreur
    throw err;
  }
});

emailQueue.process('vm-deleted', async (job) => {
  console.log(`[Email Worker] 📬 Job 'vm-deleted' reçu`, job.data); // ✅ Log data reçues
  const { email, vmName } = job.data;
  
  try {
    const user = await User.findOne({ where: { email } });
    console.log(`[Email Worker] Utilisateur trouvé:`, user?.email); // ✅ Log user
    
    await sendVMEmail(user, { name: vmName }, 'deleted');
    console.log(`[Email Worker] ✅ Email de suppression envoyé pour ${vmName}`); // ✅ Log succès
  } catch (err) {
    console.error(`[Email Worker] ❌ Erreur envoi suppression:`, err.message); // ✅ Log erreur
    throw err;
  }
});

console.log('📧 Email Worker - Prêt à traiter les jobs');