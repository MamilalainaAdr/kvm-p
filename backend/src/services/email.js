import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

/**
 * Vérifie que le transporteur SMTP est correctement configuré
 */
export async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log('Connexion SMTP etablie avec succes');
  } catch (err) {
    console.error('Erreur de configuration SMTP:', err.message);
    throw err;
  }
}

const generateGuide = (ip, port, keyName) => {
  return `GUIDE DE CONNEXION SSH - OBOX
-----------------------------------
1. Sauvegardez la cle jointe (${keyName}) sur votre ordinateur.

2. Ouvrez un terminal et naviguez vers le dossier de la cle.

3. Changez les permissions de la cle (Obligatoire) :
   chmod 600 ${keyName}

4. Ajoutez la cle a votre agent SSH (Recommande) :
   eval $(ssh-agent)
   ssh-add ${keyName}

5. Connectez-vous a la VM :
   ssh -p ${port} -i ${keyName} root@${ip}

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
    console.log(`Email envoye a ${to}`);
  } catch (err) {
    console.error('Erreur envoi email:', err.message);
    throw err;
  }
};

export const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CORS_ORIGIN}/verify-email?token=${token}`;
  await sendEmail(user.email, 'Verifiez votre email', `
    <p>Bonjour ${user.name},</p>
    <p>Cliquez pour verifier : <a href="${url}">${url}</a></p>
  `);
};

export const sendVMEmail = async (user, vm, action, sshKey = null, port = null) => {
  let attachments = [];
  let html = '';
  let subject = '';

  if (action === 'created') {
    subject = 'Votre VM est prete';
    const keyName = `${vm.name}.pem`;
    const publicIp = process.env.PUBLIC_IP || "127.0.0.1" ;
    const guideContent = generateGuide(publicIp, vm.port || '22', keyName);

    html = `
      <h2>Machine virtuelle deployee</h2>
      <p>Bonjour ${user.name},</p>
      <p>Votre VM <b>${vm.name}</b> est operationnelle.</p>
      <ul>
        <li><b>IP :</b> ${publicIp}</li>
        <li><b>Port :</b> ${vm.port || '22'}</li>
        <li><b>OS :</b> ${vm.os_type} ${vm.version}</li>
      </ul>
      <p><b>Important :</b> Vous trouverez ci-joint votre cle privee SSH et un guide de connexion.</p>
    `;

    if (sshKey) {
      attachments = [
        { filename: keyName, content: sshKey },
        { filename: 'guide_connexion.txt', content: guideContent }
      ];
    }
  } else if (action === 'deleted') {
    subject = 'VM supprimee';
    html = `
      <h2>Machine virtuelle supprimee</h2>
      <p>La VM <b>${vm.name}</b> a ete supprimee definitivement.</p>
    `;
  } else if (action === 'updated') {
    subject = 'VM Mise a jour';
    html = `
      <h2>Ressources mises a jour</h2>
      <p>La VM <b>${vm.name}</b> a ete modifiee :</p>
      <ul>
        <li><b>vCPU :</b> ${vm.vcpu}</li>
        <li><b>RAM :</b> ${vm.memory} MB</li>
        <li><b>Disque :</b> ${vm.disk_size} GB</li>
      </ul>
    `;
  }

  await sendEmail(user.email, subject, html, attachments);
};