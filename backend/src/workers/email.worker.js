import dotenv from 'dotenv';
dotenv.config();
import { emailQueue } from '../services/queue.service.js';
import { sendEmail } from '../services/email.service.js';

// Envoi d'email avec retry intégré
emailQueue.process('vm-created', async (job) => {
  const { email, vmName, ip, sshKey } = job.data;
  
  const html = `
    <h2>VM créée 🎉</h2>
    <p><b>Nom:</b> ${vmName}</p>
    <p><b>IP:</b> ${ip}</p>
    <p>La clé SSH est jointe.</p>
  `;

  await sendEmail(email, 'Votre VM est prête', html, sshKey ? [{
    filename: 'id_rsa',
    content: sshKey
  }] : []);
});

emailQueue.process('vm-deleted', async (job) => {
  const { email, vmName } = job.data;
  
  const html = `<h2>VM supprimée</h2><p>La VM ${vmName} a été supprimée.</p>`;
  await sendEmail(email, 'VM supprimée', html);
});

console.log('📧 Email Worker started');