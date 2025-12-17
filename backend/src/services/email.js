import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const generateGuide = (ip, keyName) => {
  return `GUIDE DE CONNEXION SSH - OBOX
-----------------------------------
1. Sauvegardez la clé jointe (${keyName}) sur votre ordinateur.

2. Ouvrez un terminal et naviguez vers le dossier de la clé.

3. Changez les permissions de la clé (Obligatoire) :
   chmod 600 ${keyName}

4. Ajoutez la clé à votre agent SSH (Recommandé) :
   eval $(ssh-agent)
   ssh-add ${keyName}

5. Connectez-vous à la VM :
   ssh -i ${keyName} root@${ip}
   
   (Note : Le port SSH est le port standard 22)
-----------------------------------
Merci d'utiliser OBox.
`;
};

export const sendEmail = async (to, subject, html, attachments = []) => {
  console.log(`[Email Service] Envoi en cours:`, { to, subject, attachments: attachments.length });
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments
    });
    console.log(`✅ Email envoyé à ${to}`);
  } catch (err) {
    console.error('❌ Erreur envoi email:', err.message);
    throw err;
  }
};

export const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CORS_ORIGIN}/verify-email?token=${token}`;
  await sendEmail(user.email, 'Vérifiez votre email', `
    <p>Bonjour ${user.name},</p>
    <p>Cliquez pour vérifier : <a href="${url}">${url}</a></p>
  `);
};

export const sendVMEmail = async (user, vm, action, sshKey = null) => {
  let attachments = [];
  let html = '';
  let subject = '';

  if (action === 'created') {
    subject = '✅ Votre VM est prête';
    const keyName = `${vm.name}.pem`;
    const guideContent = generateGuide(vm.ip_address || 'IP_INCONNUE', keyName);

    html = `
      <h2>Machine virtuelle déployée 🚀</h2>
      <p>Bonjour ${user.name},</p>
      <p>Votre VM <b>${vm.name}</b> est opérationnelle.</p>
      <ul>
        <li><b>IP :</b> ${vm.ip_address || 'En attente'}</li>
        <li><b>Port :</b> 22</li>
        <li><b>OS :</b> ${vm.os_type} ${vm.version}</li>
      </ul>
      <p>🔐 <b>Important :</b> Vous trouverez ci-joint votre clé privée SSH et un guide de connexion.</p>
    `;

    if (sshKey) {
      attachments = [
        { filename: keyName, content: sshKey },
        { filename: 'guide_connexion.txt', content: guideContent }
      ];
    }
  } else if (action === 'deleted') {
    subject = '🗑️ VM supprimée';
    html = `
      <h2>Machine virtuelle supprimée</h2>
      <p>La VM <b>${vm.name}</b> a été supprimée définitivement.</p>
    `;
  } else if (action === 'updated') {
    subject = '🔄 VM Mise à jour';
    html = `
      <h2>Ressources mises à jour</h2>
      <p>La VM <b>${vm.name}</b> a été modifiée :</p>
      <ul>
        <li><b>vCPU :</b> ${vm.vcpu}</li>
        <li><b>RAM :</b> ${vm.memory} MB</li>
        <li><b>Disque :</b> ${vm.disk_size} GB</li>
      </ul>
      <p>Un redémarrage peut être nécessaire pour appliquer tous les changements.</p>
    `;
  }

  await sendEmail(user.email, subject, html, attachments);
};